import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAuditFromRequest } from '@/app/lib/audit'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

const getAdminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('listings')
      .select(`*, listing_channels(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ listing: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // If patching attributes, merge with existing rather than overwriting
    let patch = body
    if (body.attributes && Object.keys(body).length === 1) {
      const { data: existing } = await supabase
        .from('listings').select('attributes').eq('id', id).eq('user_id', user.id).single()
      patch = { attributes: { ...(existing?.attributes || {}), ...body.attributes } }
    }

    // images field: accept comma-separated string and convert to array
    if (typeof patch.images === 'string') {
      patch.images = patch.images.split(',').map((s: string) => s.trim()).filter(Boolean)
    }

    // Snapshot current state before update (for version history)
    const { data: before } = await supabase
      .from('listings').select('*').eq('id', id).eq('user_id', user.id).single()

    const { data, error } = await supabase
      .from('listings')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`*, listing_channels(*)`)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Record version if meaningful fields changed
    if (before) {
      const tracked = ['title', 'description', 'price', 'quantity', 'images', 'attributes', 'condition']
      const changedFields = tracked.filter(f => JSON.stringify(before[f]) !== JSON.stringify((data as any)[f]))
      if (changedFields.length) {
        void Promise.resolve(getAdminSupabase().from('listing_versions').insert({
          listing_id:     id,
          user_id:        user.id,
          changed_fields: changedFields,
          snapshot:       before,
        })).catch(() => {}) // fire-and-forget
      }
    }

    // SOC 2 audit trail — every user-side mutation lands in audit_log.
    void logAuditFromRequest(supabase, request, user, {
      action:      'listing.update',
      resource:    'listings',
      resourceId:  id,
      before:      before ?? null,
      after:       data as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ listing: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Snapshot before delete for the audit trail.
    const { data: before } = await supabase
      .from('listings').select('*').eq('id', id).eq('user_id', user.id).single()

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    void logAuditFromRequest(supabase, request, user, {
      action:      'listing.delete',
      resource:    'listings',
      resourceId:  id,
      before:      before ?? null,
      after:       null,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
