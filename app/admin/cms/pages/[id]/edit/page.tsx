'use client'

/**
 * /admin/cms/pages/[id]/edit — editor for a single marketing page.
 *
 * Flow:
 *   - Edit page meta (slug, title, description, status).
 *   - List sections with up/down arrows → reorder via PATCH /sections {order}.
 *   - Click a section → JSON props editor → save.
 *   - Add a new section from the registered type dropdown.
 *   - Delete sections.
 *
 * Minimal MVP — no drag-drop UI, no per-type structured form. The JSON
 * textarea is the props editor; matches the Section discriminated union in
 * app/lib/cms/types.ts which is the source of truth.
 */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { theme } from '@/app/admin/_lib/theme'

type Page = {
  id: string
  slug: string
  title: string
  description: string | null
  og_image_url: string | null
  status: 'draft' | 'published'
  published_at: string | null
}

type Section = {
  id: string
  type: string
  position: number
  props: Record<string, unknown>
}

// Keep in sync with app/lib/cms/types.ts Section union.
const SECTION_TYPES = [
  'hero',
  'feature_grid',
  'cta',
  'step_flow',
  'integration_grid',
  'testimonial',
  'pricing_table',
  'faq',
  'logo_wall',
]

export default function EditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const pageId = params?.id as string | undefined

  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Meta form state (mirrors server values until saved)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Section editor state
  const [editing, setEditing] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [newType, setNewType] = useState<string>('hero')

  async function load() {
    if (!pageId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cms/pages/${pageId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setPage(json.page)
      setSections(json.sections)
      setSlug(json.page.slug)
      setTitle(json.page.title)
      setDescription(json.page.description ?? '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [pageId])

  async function saveMeta() {
    setError(null)
    const res = await fetch(`/api/admin/cms/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title, description: description || null }),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error || 'Save failed')
    else load()
  }

  async function togglePublish() {
    if (!page) return
    const next = page.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/cms/pages/${pageId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    load()
  }

  async function addSection() {
    const res = await fetch(`/api/admin/cms/pages/${pageId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newType, props: {} }),
    })
    if (res.ok) load()
  }

  async function reorder(sectionId: string, direction: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === sectionId)
    const target = idx + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [moved] = next.splice(idx, 1)
    next.splice(target, 0, moved)
    setSections(next) // optimistic
    await fetch(`/api/admin/cms/pages/${pageId}/sections`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((s) => s.id) }),
    })
  }

  function startEdit(section: Section) {
    setEditing(section.id)
    setEditingDraft(JSON.stringify(section.props, null, 2))
  }

  async function saveSection(id: string, currentType: string) {
    try {
      const parsed = JSON.parse(editingDraft)
      const res = await fetch(`/api/admin/cms/pages/${pageId}/sections/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: currentType, props: parsed }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || 'Section save failed')
        return
      }
      setEditing(null)
      load()
    } catch {
      setError('Invalid JSON')
    }
  }

  async function deleteSection(id: string) {
    if (!confirm('Delete this section?')) return
    await fetch(`/api/admin/cms/pages/${pageId}/sections/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div style={{ padding: 40, color: theme.inkMuted }}>Loading…</div>
  if (!page) return <div style={{ padding: 40, color: theme.danger }}>Page not found</div>

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/cms/pages" style={{ fontSize: 12, color: theme.inkMuted, textDecoration: 'none' }}>
          ← All pages
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', color: theme.ink, margin: 0 }}>
          {page.title}
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`/cms/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: theme.inkSoft, textDecoration: 'none', padding: '6px 10px', border: `1px solid ${theme.inkFaint}`, borderRadius: 5 }}
          >
            Preview →
          </a>
          <button
            onClick={togglePublish}
            style={{
              background: page.status === 'published' ? theme.inkFaint : theme.cobalt,
              color: page.status === 'published' ? theme.ink : '#fff',
              border: 'none', padding: '6px 14px', borderRadius: 5,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {page.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: theme.danger, fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {/* Meta form */}
      <section style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, marginBottom: 12 }}>Page meta</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: theme.inkMuted, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ padding: '9px 11px', border: `1px solid ${theme.inkFaint}`, fontSize: 13, fontFamily: 'monospace' }}
            />
          </label>
          <label style={{ fontSize: 11, color: theme.inkMuted, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: '9px 11px', border: `1px solid ${theme.inkFaint}`, fontSize: 13 }}
            />
          </label>
        </div>
        <label style={{ fontSize: 11, color: theme.inkMuted, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Description (meta)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ padding: '9px 11px', border: `1px solid ${theme.inkFaint}`, fontSize: 13, fontFamily: theme.sans, resize: 'vertical' }}
          />
        </label>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={saveMeta}
            style={{
              background: theme.ink, color: theme.cream, border: 'none', padding: '8px 16px',
              borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Save meta
          </button>
        </div>
      </section>

      {/* Sections */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>
            Sections <span style={{ color: theme.inkMuted, fontWeight: 400 }}>· {sections.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${theme.inkFaint}`, fontSize: 12, borderRadius: 5 }}
            >
              {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={addSection}
              style={{
                background: theme.cobalt, color: '#fff', border: 'none', padding: '6px 14px',
                borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              + Add section
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections.map((s, idx) => {
            const isEditing = editing === s.id
            return (
              <div key={s.id} style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isEditing ? 12 : 0 }}>
                  <span style={{
                    fontSize: 10, color: theme.inkMuted, fontFamily: 'monospace',
                    minWidth: 28, textAlign: 'center', padding: '2px 6px',
                    border: `1px solid ${theme.inkFaint}`, borderRadius: 4,
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: theme.cobalt,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {s.type}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={() => reorder(s.id, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    style={{ ...iconBtn, opacity: idx === 0 ? 0.3 : 1 }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => reorder(s.id, 1)}
                    disabled={idx === sections.length - 1}
                    aria-label="Move down"
                    style={{ ...iconBtn, opacity: idx === sections.length - 1 ? 0.3 : 1 }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => (isEditing ? setEditing(null) : startEdit(s))}
                    style={{ ...iconBtn, padding: '4px 10px' }}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => deleteSection(s.id)}
                    style={{ ...iconBtn, padding: '4px 10px', color: theme.danger }}
                  >
                    Delete
                  </button>
                </div>

                {!isEditing && (
                  <pre style={{
                    margin: '10px 0 0',
                    fontSize: 11,
                    color: theme.inkMuted,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: 90,
                    overflow: 'hidden',
                    background: theme.creamSoft,
                    padding: 10,
                    borderRadius: 4,
                    fontFamily: 'monospace',
                  }}>
                    {JSON.stringify(s.props, null, 2).slice(0, 260)}
                    {JSON.stringify(s.props).length > 260 ? '…' : ''}
                  </pre>
                )}

                {isEditing && (
                  <>
                    <textarea
                      value={editingDraft}
                      onChange={(e) => setEditingDraft(e.target.value)}
                      rows={16}
                      spellCheck={false}
                      style={{
                        width: '100%', fontFamily: 'monospace', fontSize: 12,
                        padding: 12, border: `1px solid ${theme.inkFaint}`,
                        background: theme.creamSoft, borderRadius: 5, resize: 'vertical',
                      }}
                    />
                    <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => saveSection(s.id, s.type)}
                        style={{
                          background: theme.ink, color: theme.cream, border: 'none',
                          padding: '8px 16px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Save section
                      </button>
                      <div style={{ fontSize: 11, color: theme.inkMuted, alignSelf: 'center' }}>
                        Shape is validated on the client renderer, not saved validation — match{' '}
                        <code>app/lib/cms/types.ts</code>.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {sections.length === 0 && (
            <div style={{ padding: 28, background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, textAlign: 'center', color: theme.inkMuted, fontSize: 13 }}>
              No sections yet. Add one above.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${theme.inkFaint}`,
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 12,
  color: theme.inkSoft,
  cursor: 'pointer',
  fontFamily: theme.sans,
}
