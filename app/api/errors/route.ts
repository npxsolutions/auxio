import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

export async function GET() {
  try {
    const supabase = getAdmin()

    // Query listing errors — gracefully handle if table doesn't exist yet
    let formattedListingErrors: any[] = []
    try {
      const { data: listingErrors, error: listingError } = await supabase
        .from('listing_channels')
        .select(`
          id,
          listing_id,
          channel,
          error_message,
          updated_at,
          listings (
            title,
            sku
          )
        `)
        .eq('status', 'error')
        .order('updated_at', { ascending: false })

      if (!listingError && listingErrors) {
        formattedListingErrors = listingErrors.map((row: any) => ({
          id: row.id,
          listing_id: row.listing_id,
          channel: row.channel,
          error_message: row.error_message,
          updated_at: row.updated_at,
          title: row.listings?.title ?? 'Untitled',
          sku: row.listings?.sku ?? null,
        }))
      }
    } catch {
      // Table doesn't exist yet — return empty
    }

    // Try to query order errors — gracefully handle if table/column doesn't exist
    let orderErrors: any[] = []
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, channel, status, error_message, updated_at, external_id')
        .eq('status', 'error')
        .order('updated_at', { ascending: false })

      if (!orderError && orderData) {
        orderErrors = orderData
      }
    } catch {
      // Table doesn't exist or column missing — return empty
      orderErrors = []
    }

    const total = formattedListingErrors.length + orderErrors.length

    return NextResponse.json({
      listing_errors: formattedListingErrors,
      order_errors: orderErrors,
      total,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
