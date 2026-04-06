import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// GET /api/category-mappings?channel=ebay
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channel = request.nextUrl.searchParams.get('channel')

    let query = supabase
      .from('category_mappings')
      .select('*')
      .eq('user_id', user.id)
      .order('source_category')

    if (channel) query = query.eq('channel_type', channel)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ mappings: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/category-mappings — upsert a mapping
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { source_category, channel_type, channel_cat_id, channel_cat_name } = await request.json()

    if (!source_category?.trim() || !channel_type?.trim()) {
      return NextResponse.json({ error: 'source_category and channel_type are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('category_mappings')
      .upsert({
        user_id:          user.id,
        source_category:  source_category.trim(),
        channel_type:     channel_type.trim(),
        channel_cat_id:   channel_cat_id || null,
        channel_cat_name: channel_cat_name || null,
      }, { onConflict: 'user_id,source_category,channel_type' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ mapping: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/category-mappings — remove a mapping by id
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('category_mappings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
