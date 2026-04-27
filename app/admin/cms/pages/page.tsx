'use client'

/**
 * /admin/cms/pages — list of every marketing page.
 * Create a new draft, toggle draft/published, edit sections.
 */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { theme } from '@/app/admin/_lib/theme'

type Page = {
  id: string
  slug: string
  title: string
  description: string | null
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
  section_count: number
}

export default function AdminCmsPages() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // create form state
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/cms/pages')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setPages(json.pages ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createPage(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug.trim(), title: newTitle.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Create failed')
      setNewSlug('')
      setNewTitle('')
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function setStatus(id: string, status: 'draft' | 'published') {
    const res = await fetch(`/api/admin/cms/pages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) load()
  }

  async function removePage(id: string, slug: string) {
    if (!confirm(`Delete "${slug}" and all its sections?`)) return
    const res = await fetch(`/api/admin/cms/pages/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', color: theme.ink, margin: 0 }}>
          CMS pages
        </h1>
        <p style={{ fontSize: 13, color: theme.inkMuted, marginTop: 4 }}>
          Create, edit, and publish marketing pages. Draft pages are hidden from the public URL and the sitemap.
        </p>
      </div>

      {/* Create form */}
      <section style={{
        background: '#fff',
        border: `1px solid ${theme.inkFaint}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, marginBottom: 10 }}>New page</div>
        <form onSubmit={createPage} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            required
            placeholder="slug-in-kebab"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            style={{ flex: '0 0 220px', padding: '9px 11px', border: `1px solid ${theme.inkFaint}`, fontSize: 13, fontFamily: 'monospace' }}
          />
          <input
            required
            placeholder="Page title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: '1 1 260px', padding: '9px 11px', border: `1px solid ${theme.inkFaint}`, fontSize: 13 }}
          />
          <button
            type="submit"
            disabled={creating}
            style={{
              background: theme.ink, color: theme.cream, border: 'none', borderRadius: 6,
              padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: creating ? 'wait' : 'pointer',
              fontFamily: theme.sans,
            }}
          >
            {creating ? 'Creating…' : 'Create draft'}
          </button>
        </form>
      </section>

      {error && <div style={{ color: theme.danger, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: theme.inkMuted, fontSize: 13 }}>Loading…</div>}

      {!loading && pages.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 8, color: theme.inkMuted, fontSize: 13 }}>
          No pages yet. Create one above.
        </div>
      )}

      {!loading && pages.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 90px 90px 160px 180px',
            padding: '12px 20px',
            background: theme.creamSoft,
            borderBottom: `1px solid ${theme.inkFaint}`,
            fontSize: 11,
            fontWeight: 600,
            color: theme.inkMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            <div>Slug</div>
            <div>Title</div>
            <div>Status</div>
            <div>Sections</div>
            <div>Updated</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {pages.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 90px 90px 160px 180px',
                padding: '14px 20px',
                borderBottom: `1px solid ${theme.inkFaint}`,
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: theme.inkSoft }}>{p.slug}</div>
              <div style={{ fontSize: 13.5, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title}
              </div>
              <div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: p.status === 'published' ? theme.success : theme.inkMuted,
                  padding: '2px 8px',
                  border: `1px solid ${p.status === 'published' ? theme.success : theme.inkFaint}`,
                  borderRadius: 9999,
                }}>
                  {p.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: theme.inkSoft }}>{p.section_count}</div>
              <div style={{ fontSize: 12, color: theme.inkMuted }}>
                {new Date(p.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Link
                  href={`/admin/cms/pages/${p.id}/edit`}
                  style={{ fontSize: 12, color: theme.ink, fontWeight: 500, textDecoration: 'none', padding: '5px 10px', border: `1px solid ${theme.inkFaint}`, borderRadius: 5 }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => setStatus(p.id, p.status === 'published' ? 'draft' : 'published')}
                  style={{
                    fontSize: 12, color: theme.cobalt, fontWeight: 500,
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  {p.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => removePage(p.id, p.slug)}
                  style={{ fontSize: 12, color: theme.danger, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
