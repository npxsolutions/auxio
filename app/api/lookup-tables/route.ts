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

// GET — list all tables (with row counts) OR rows for a specific table (?table_id=)
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tableId = request.nextUrl.searchParams.get('table_id')

    if (tableId) {
      // Return rows for a specific table
      const { data: rows, error } = await supabase
        .from('lookup_table_rows')
        .select('id, match_value, output_value, position')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .order('position', { ascending: true })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ rows: rows || [] })
    }

    // Return all tables
    const { data: tables, error } = await supabase
      .from('lookup_tables')
      .select('id, name, description, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get row counts per table
    const counts: Record<string, number> = {}
    if (tables?.length) {
      const ids = tables.map(t => t.id)
      const { data: rowCounts } = await supabase
        .from('lookup_table_rows')
        .select('table_id')
        .eq('user_id', user.id)
        .in('table_id', ids)

      for (const r of rowCounts || []) {
        counts[r.table_id] = (counts[r.table_id] || 0) + 1
      }
    }

    return NextResponse.json({
      tables: (tables || []).map(t => ({ ...t, row_count: counts[t.id] || 0 })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create table OR add/bulk-add rows
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Create table
    if (body.name) {
      const { data, error } = await supabase
        .from('lookup_tables')
        .insert({ user_id: user.id, name: body.name.trim(), description: body.description || null })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ table: data })
    }

    // Add rows to existing table
    if (body.table_id && Array.isArray(body.rows)) {
      // Get current max position
      const { data: existing } = await supabase
        .from('lookup_table_rows')
        .select('position')
        .eq('table_id', body.table_id)
        .order('position', { ascending: false })
        .limit(1)

      const startPos = (existing?.[0]?.position ?? -1) + 1

      const inserts = body.rows
        .filter((r: any) => r.match_value !== undefined && r.output_value !== undefined)
        .map((r: any, i: number) => ({
          table_id:     body.table_id,
          user_id:      user.id,
          match_value:  String(r.match_value),
          output_value: String(r.output_value),
          position:     startPos + i,
        }))

      if (!inserts.length) return NextResponse.json({ added: 0 })

      const { error } = await supabase.from('lookup_table_rows').insert(inserts)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Touch updated_at on the parent table
      await supabase.from('lookup_tables').update({ updated_at: new Date().toISOString() })
        .eq('id', body.table_id).eq('user_id', user.id)

      return NextResponse.json({ added: inserts.length })
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — rename table OR update a row
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    if (body.row_id) {
      const { data, error } = await supabase
        .from('lookup_table_rows')
        .update({ match_value: body.match_value, output_value: body.output_value })
        .eq('id', body.row_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ row: data })
    }

    if (body.table_id) {
      const updates: any = { updated_at: new Date().toISOString() }
      if (body.name)        updates.name        = body.name
      if (body.description !== undefined) updates.description = body.description

      const { data, error } = await supabase
        .from('lookup_tables')
        .update(updates)
        .eq('id', body.table_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ table: data })
    }

    return NextResponse.json({ error: 'row_id or table_id required' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete table OR a row
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { table_id, row_id } = await request.json()

    if (row_id) {
      const { error } = await supabase.from('lookup_table_rows').delete().eq('id', row_id).eq('user_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (table_id) {
      // Cascade deletes rows via FK
      const { error } = await supabase.from('lookup_tables').delete().eq('id', table_id).eq('user_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'table_id or row_id required' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
