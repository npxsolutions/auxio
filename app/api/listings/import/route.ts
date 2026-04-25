import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Parse a CSV string into rows of objects
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i])
    if (values.length === 0) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim().replace(/^"|"$/g, '') })
    rows.push(row)
  }
  return rows
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}

// Map CSV columns to listing fields — flexible column names
const FIELD_MAP: Record<string, string> = {
  title: 'title', name: 'title', product_title: 'title', product_name: 'title',
  description: 'description', body: 'description', body_html: 'description',
  price: 'price', sale_price: 'price',
  compare_price: 'compare_price', compare_at_price: 'compare_price', rrp: 'compare_price',
  sku: 'sku', item_sku: 'sku',
  barcode: 'barcode', ean: 'barcode', upc: 'barcode', gtin: 'barcode', isbn: 'barcode',
  brand: 'brand', vendor: 'brand', manufacturer: 'brand',
  category: 'category', type: 'category', product_type: 'category',
  condition: 'condition',
  quantity: 'quantity', stock: 'quantity', inventory_quantity: 'quantity', qty: 'quantity',
  weight: 'weight_grams', weight_grams: 'weight_grams', weight_kg: '_weight_kg',
  images: 'images', image: 'images', image_url: 'images', image_src: 'images', photo: 'images',
}

function mapRow(row: Record<string, string>): { listing: any; attributes: Record<string, string> } {
  const listing: any = { attributes: {} }
  const unmapped: Record<string, string> = {}

  for (const [col, val] of Object.entries(row)) {
    if (!val) continue
    const mapped = FIELD_MAP[col]
    if (mapped === '_weight_kg') {
      listing.weight_grams = Math.round(parseFloat(val) * 1000)
    } else if (mapped) {
      listing[mapped] = val
    } else {
      unmapped[col] = val
    }
  }

  // Type coercions
  if (listing.price) listing.price = parseFloat(listing.price) || 0
  if (listing.compare_price) listing.compare_price = parseFloat(listing.compare_price) || null
  if (listing.quantity) listing.quantity = parseInt(listing.quantity) || 0
  if (listing.weight_grams) listing.weight_grams = parseInt(listing.weight_grams) || null
  if (listing.images) listing.images = listing.images.split('|').map((s: string) => s.trim()).filter(Boolean)

  // Unmapped columns become attributes
  listing.attributes = unmapped

  return { listing, attributes: unmapped }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (!rows.length) return NextResponse.json({ error: 'CSV is empty or has no data rows' }, { status: 400 })

    // Create import job
    const { data: job } = await supabase.from('import_jobs').insert({
      user_id: user.id, status: 'processing', total_rows: rows.length,
    }).select().single()

    let imported = 0
    let failed_rows = 0
    const errors: any[] = []

    // Process in batches of 50
    const BATCH = 50
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const toInsert = []

      for (const [idx, row] of batch.entries()) {
        const { listing } = mapRow(row)
        if (!listing.title) {
          errors.push({ row: i + idx + 2, error: 'Missing title' })
          failed_rows++
          continue
        }
        toInsert.push({
          user_id:      user.id,
          title:        listing.title,
          description:  listing.description || null,
          price:        listing.price ?? 0,
          compare_price: listing.compare_price ?? null,
          sku:          listing.sku || null,
          barcode:      listing.barcode || null,
          brand:        listing.brand || null,
          category:     listing.category || null,
          condition:    listing.condition || 'new',
          quantity:     listing.quantity ?? 0,
          weight_grams: listing.weight_grams || null,
          images:       listing.images || [],
          attributes:   listing.attributes || {},
          status:       'draft',
        })
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('channel_listings').insert(toInsert)
        if (error) {
          errors.push({ batch: i, error: error.message })
          failed_rows += toInsert.length
        } else {
          imported += toInsert.length
        }
      }
    }

    // Update job
    await supabase.from('import_jobs').update({
      status: 'done', imported, failed_rows, errors,
      completed_at: new Date().toISOString(),
    }).eq('id', job!.id)

    return NextResponse.json({ job_id: job!.id, total: rows.length, imported, failed_rows, errors })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
