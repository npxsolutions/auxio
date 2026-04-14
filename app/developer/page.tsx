'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface ApiKey {
  id: string; name: string; key_prefix: string; scopes: string[]
  active: boolean; last_used_at: string | null; expires_at: string | null; created_at: string
}

interface Webhook {
  id: string; url: string; events: string[]; active: boolean
  last_triggered_at: string | null; failure_count: number; created_at: string
}

const ALL_EVENTS = [
  'listing.published', 'listing.updated', 'listing.error',
  'order.created', 'order.fulfilled',
  'inventory.low_stock', 'inventory.out_of_stock',
  'price.changed', 'sync.completed', 'sync.failed',
]

const ALL_SCOPES = ['read', 'write', 'listings', 'orders', 'inventory', 'analytics']

function fmtDate(d: string | null) {
  if (!d) return 'Never'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DeveloperPage() {
  const router = useRouter()
  const supabase = createClient()
  const [apiKeys, setApiKeys]   = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null)

  const [keyModal, setKeyModal]   = useState(false)
  const [hookModal, setHookModal] = useState(false)
  const [keyForm, setKeyForm]     = useState({ name: '', scopes: ['read'] as string[], expires_at: '' })
  const [hookForm, setHookForm]   = useState({ url: '', events: [] as string[] })
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login'); else load()
    })
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/developer')
    const json = await res.json()
    setApiKeys(json.api_keys || [])
    setWebhooks(json.webhooks || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  function toggleScope(scope: string) {
    setKeyForm(p => ({
      ...p,
      scopes: p.scopes.includes(scope) ? p.scopes.filter(s => s !== scope) : [...p.scopes, scope],
    }))
  }

  function toggleEvent(event: string) {
    setHookForm(p => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter(e => e !== event) : [...p.events, event],
    }))
  }

  async function createKey() {
    if (!keyForm.name) { showToast('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/developer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'api_key', ...keyForm }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setNewKeyRaw(json.raw_key)
      setKeyModal(false)
      setKeyForm({ name: '', scopes: ['read'], expires_at: '' })
      load()
    } catch (e: any) { showToast(e.message) }
    finally { setSaving(false) }
  }

  async function createWebhook() {
    if (!hookForm.url || !hookForm.events.length) { showToast('URL and at least one event required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/developer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'webhook', ...hookForm }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      showToast('Webhook created')
      setHookModal(false)
      setHookForm({ url: '', events: [] })
      load()
    } catch (e: any) { showToast(e.message) }
    finally { setSaving(false) }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? Apps using it will immediately lose access.')) return
    await fetch('/api/developer', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type: 'api_key' }) })
    showToast('Key revoked'); load()
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return
    await fetch('/api/developer', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type: 'webhook' }) })
    showToast('Webhook deleted'); load()
  }

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e8e8e5', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1b22' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300 }}>{toast}</div>}

      {/* New key revealed modal */}
      {newKeyRaw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, maxWidth: 540, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 8 }}>Your new API key</div>
            <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, fontWeight: 500 }}>
              ⚠ Copy this key now — it won't be shown again.
            </div>
            <div style={{ background: '#0f1117', borderRadius: 8, padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#a5a0fb', wordBreak: 'break-all', userSelect: 'all', marginBottom: 16 }}>
              {newKeyRaw}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { navigator.clipboard.writeText(newKeyRaw); showToast('Copied!') }}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Copy key
              </button>
              <button onClick={() => setNewKeyRaw(null)}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create API key modal */}
      {keyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, maxWidth: 480, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 22 }}>Generate API key</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Key name</div>
              <input value={keyForm.name} onChange={e => setKeyForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Production integration" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Scopes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_SCOPES.map(s => (
                  <button key={s} onClick={() => toggleScope(s)} style={{
                    padding: '5px 12px', borderRadius: 8,
                    border: `1px solid ${keyForm.scopes.includes(s) ? '#5b52f5' : '#e8e8e5'}`,
                    background: keyForm.scopes.includes(s) ? '#5b52f5' : 'white',
                    color: keyForm.scopes.includes(s) ? 'white' : '#6b6e87',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: keyForm.scopes.includes(s) ? 600 : 400,
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Expires (optional)</div>
              <input type="date" value={keyForm.expires_at} onChange={e => setKeyForm(p => ({ ...p, expires_at: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setKeyModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={createKey} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Generating…' : 'Generate key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create webhook modal */}
      {hookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, maxWidth: 520, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 22 }}>Create webhook</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Endpoint URL</div>
              <input value={hookForm.url} onChange={e => setHookForm(p => ({ ...p, url: e.target.value }))} placeholder="https://your-server.com/webhook" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Events to subscribe</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_EVENTS.map(e => (
                  <button key={e} onClick={() => toggleEvent(e)} style={{
                    padding: '5px 12px', borderRadius: 8,
                    border: `1px solid ${hookForm.events.includes(e) ? '#5b52f5' : '#e8e8e5'}`,
                    background: hookForm.events.includes(e) ? '#5b52f5' : 'white',
                    color: hookForm.events.includes(e) ? 'white' : '#6b6e87',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', fontWeight: hookForm.events.includes(e) ? 600 : 400,
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setHookModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={createWebhook} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creating…' : 'Create webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Developer & API</h1>
          <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>API keys, webhooks, and integration credentials</p>
        </div>

        {/* API Keys section */}
        <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>API Keys</div>
              <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Use these to authenticate requests to the Fulcra API</div>
            </div>
            <button onClick={() => setKeyModal(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Generate key</button>
          </div>
          {loading ? (
            <div style={{ padding: '24px', color: '#9496b0', fontSize: 13 }}>Loading…</div>
          ) : apiKeys.length === 0 ? (
            <div style={{ padding: '24px', color: '#9496b0', fontSize: 13 }}>No API keys yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf9f7' }}>
                  {['Name', 'Prefix', 'Scopes', 'Last used', 'Expires', 'Status', ''].map(col => (
                    <th key={col} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8e5df' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k, idx) => (
                  <tr key={k.id} style={{ borderBottom: idx < apiKeys.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1b22' }}>{k.name}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#9496b0' }}>{k.key_prefix}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {k.scopes.map(s => (
                          <span key={s} style={{ background: '#f5f3ef', color: '#6b6e87', borderRadius: 4, fontSize: 10, fontWeight: 600, padding: '1px 6px', fontFamily: 'monospace' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9496b0' }}>{fmtDate(k.last_used_at)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9496b0' }}>{fmtDate(k.expires_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: k.active ? '#f0fdf4' : '#fef2f2', color: k.active ? '#15803d' : '#dc2626', borderRadius: 100, fontSize: 10, fontWeight: 600, padding: '2px 8px' }}>
                        {k.active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {k.active && <button onClick={() => revokeKey(k.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'white', fontSize: 11, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Webhooks section */}
        <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>Webhooks</div>
              <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Receive real-time events when things happen in Fulcra</div>
            </div>
            <button onClick={() => setHookModal(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add webhook</button>
          </div>
          {loading ? (
            <div style={{ padding: '24px', color: '#9496b0', fontSize: 13 }}>Loading…</div>
          ) : webhooks.length === 0 ? (
            <div style={{ padding: '24px', color: '#9496b0', fontSize: 13 }}>No webhooks configured</div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {webhooks.map(h => (
                <div key={h.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#1a1b22', fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {h.events.map(e => (
                        <span key={e} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 4, fontSize: 10, fontWeight: 500, padding: '1px 7px', fontFamily: 'monospace' }}>{e}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#9496b0', marginTop: 6 }}>
                      Last triggered: {fmtDate(h.last_triggered_at)}
                      {h.failure_count > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}> · {h.failure_count} failures</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ background: h.active ? '#f0fdf4' : '#fef2f2', color: h.active ? '#15803d' : '#dc2626', borderRadius: 100, fontSize: 10, fontWeight: 600, padding: '2px 8px' }}>
                      {h.active ? 'Active' : 'Paused'}
                    </span>
                    <button onClick={() => deleteWebhook(h.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'white', fontSize: 11, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Docs callout */}
        <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 12, padding: '20px 24px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8', marginBottom: 4 }}>API Documentation</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Base URL: <code style={{ fontFamily: 'monospace', color: '#a5a0fb' }}>https://auxio.io/api/v1</code> · Authentication: Bearer token</div>
          </div>
          <a href="/api-docs" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#f0f0f8', fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit' }}>
            View docs →
          </a>
        </div>
      </main>
    </div>
  )
}
