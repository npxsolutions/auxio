'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

interface Settings {
  agent_mode: 'alerts' | 'copilot' | 'autopilot'
  min_margin: number
  max_acos: number
  safety_stock_days: number
  email_alerts: boolean
  default_cogs_pct: number
  ebay_fee_pct: number
  shopify_fee_pct: number
  default_shipping_cost: number
}

const AGENT_MODES = [
  {
    id: 'alerts',
    label: 'Alerts only',
    description: 'Get notified about issues and opportunities. You decide what to do.',
    icon: '🔔',
  },
  {
    id: 'copilot',
    label: 'Copilot',
    description: 'Agent surfaces recommendations with one-click approve/dismiss. You stay in control.',
    icon: '🤝',
  },
  {
    id: 'autopilot',
    label: 'Autopilot',
    description: 'Agent acts automatically within your safety rails. Review logs anytime.',
    icon: '🚀',
  },
]

const DEFAULT_SETTINGS: Settings = {
  agent_mode: 'copilot',
  min_margin: 15,
  max_acos: 30,
  safety_stock_days: 14,
  email_alerts: true,
  default_cogs_pct: 50,
  ebay_fee_pct: 10.75,
  shopify_fee_pct: 3,
  default_shipping_cost: 3.95,
}

interface CategoryMapping {
  id: string
  source_category: string
  channel_type: string
  channel_cat_id: string | null
  channel_cat_name: string | null
}

const CH_ICON: Record<string, string> = { ebay: '🛒', shopify: '🛍️', amazon: '📦' }

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings]       = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState('')
  const [mappings, setMappings]       = useState<CategoryMapping[]>([])
  const [mappingsLoading, setMappingsLoading] = useState(true)

  // DSAR state — export + delete flows.
  const [exporting, setExporting]       = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [deleteAck, setDeleteAck]       = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => { load() }, [])
  useEffect(() => {
    fetch('/api/category-mappings')
      .then(r => r.json())
      .then(d => setMappings(d.mappings || []))
      .catch(() => {})
      .finally(() => setMappingsLoading(false))
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('users')
      .select('agent_mode, min_margin, max_acos, safety_stock_days, email_alerts, default_cogs_pct, ebay_fee_pct, shopify_fee_pct, default_shipping_cost')
      .eq('id', user.id)
      .single()

    if (data) {
      setSettings({
        agent_mode:            data.agent_mode              || DEFAULT_SETTINGS.agent_mode,
        min_margin:            data.min_margin              ?? DEFAULT_SETTINGS.min_margin,
        max_acos:              data.max_acos                ?? DEFAULT_SETTINGS.max_acos,
        safety_stock_days:     data.safety_stock_days       ?? DEFAULT_SETTINGS.safety_stock_days,
        email_alerts:          data.email_alerts            ?? DEFAULT_SETTINGS.email_alerts,
        default_cogs_pct:      data.default_cogs_pct       ?? DEFAULT_SETTINGS.default_cogs_pct,
        ebay_fee_pct:          data.ebay_fee_pct           ?? DEFAULT_SETTINGS.ebay_fee_pct,
        shopify_fee_pct:       data.shopify_fee_pct        ?? DEFAULT_SETTINGS.shopify_fee_pct,
        default_shipping_cost: data.default_shipping_cost  ?? DEFAULT_SETTINGS.default_shipping_cost,
      })
    }
    setLoading(false)
  }

  async function deleteMapping(id: string) {
    await fetch('/api/category-mappings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMappings(prev => prev.filter(m => m.id !== id))
    showToast('Mapping deleted')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function save() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({
          agent_mode:            settings.agent_mode,
          min_margin:            settings.min_margin,
          max_acos:              settings.max_acos,
          safety_stock_days:     settings.safety_stock_days,
          email_alerts:          settings.email_alerts,
          default_cogs_pct:      settings.default_cogs_pct,
          ebay_fee_pct:          settings.ebay_fee_pct,
          shopify_fee_pct:       settings.shopify_fee_pct,
          default_shipping_cost: settings.default_shipping_cost,
        })
        .eq('id', user.id)

      if (error) throw error
      showToast('Settings saved')
    } catch {
      showToast('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const res = await fetch('/api/data/export', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('content-disposition') || ''
      const m = /filename="([^"]+)"/.exec(cd)
      a.download = m ? m[1] : `palvento-export-${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      showToast('Export downloaded')
    } catch {
      showToast('Export failed — email security@palvento.com')
    } finally {
      setExporting(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/data/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || 'Request failed')
      setDeleteAck(body?.message || 'Deletion request received.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not submit deletion request')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f3ef', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#787774' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '640px' }}>

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>Settings</h1>
            <p style={{ fontSize: '14px', color: '#787774' }}>Configure how your AI agent operates and what alerts you receive.</p>
          </div>

          {/* Agent mode */}
          <section style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Agent mode</div>
            <div style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>Controls how autonomously your agent acts on recommendations.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {AGENT_MODES.map(mode => (
                <label
                  key={mode.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px',
                    border: `1.5px solid ${settings.agent_mode === mode.id ? '#191919' : '#e8e8e5'}`,
                    borderRadius: '8px', cursor: 'pointer',
                    background: settings.agent_mode === mode.id ? '#fafafa' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="agent_mode"
                    value={mode.id}
                    checked={settings.agent_mode === mode.id}
                    onChange={() => setSettings(s => ({ ...s, agent_mode: mode.id as Settings['agent_mode'] }))}
                    style={{ marginTop: '2px', accentColor: '#191919' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919', marginBottom: '2px' }}>
                      {mode.icon} {mode.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#787774' }}>{mode.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Safety rails */}
          <section style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Safety rails</div>
            <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px' }}>The agent will never take actions that breach these thresholds.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Min acceptable margin', key: 'min_margin', suffix: '%', min: 0, max: 90, description: 'Agent won\'t reprice below this margin' },
                { label: 'Max ACOS target', key: 'max_acos', suffix: '%', min: 0, max: 100, description: 'Agent will pause ads exceeding this ACOS' },
                { label: 'Safety stock days', key: 'safety_stock_days', suffix: ' days', min: 1, max: 90, description: 'Alert when stock drops below this cover' },
              ].map(field => (
                <div key={field.key} style={{ gridColumn: field.key === 'safety_stock_days' ? '1 / -1' : undefined }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '4px' }}>{field.label}</label>
                  <div style={{ fontSize: '11px', color: '#9b9b98', marginBottom: '8px' }}>{field.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={settings[field.key as keyof Settings] as number}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: Number(e.target.value) }))}
                      style={{ width: '80px', padding: '9px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none' }}
                    />
                    <span style={{ fontSize: '13px', color: '#787774' }}>{field.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Profit defaults */}
          <section style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Profit calculation defaults</div>
            <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px' }}>
              Used when a listing has no cost price set. Override per listing on the listing detail page.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Default COGS %', key: 'default_cogs_pct', suffix: '%', min: 0, max: 100, description: 'Fallback cost of goods when no cost price is set on the listing' },
                { label: 'Default shipping cost', key: 'default_shipping_cost', suffix: '£', min: 0, max: 100, description: 'Per-order shipping cost estimate' },
                { label: 'eBay fee rate', key: 'ebay_fee_pct', suffix: '%', min: 0, max: 30, description: 'Final value fee + PayPal (default 10.75%)' },
                { label: 'Shopify fee rate', key: 'shopify_fee_pct', suffix: '%', min: 0, max: 10, description: 'Transaction fee (default 3%)' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '4px' }}>{field.label}</label>
                  <div style={{ fontSize: '11px', color: '#9b9b98', marginBottom: '8px' }}>{field.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      min={field.min}
                      max={field.max}
                      value={settings[field.key as keyof Settings] as number}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: Number(e.target.value) }))}
                      style={{ width: '90px', padding: '9px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none' }}
                    />
                    <span style={{ fontSize: '13px', color: '#787774' }}>{field.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Email notifications</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.email_alerts}
                onChange={e => setSettings(s => ({ ...s, email_alerts: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: '#191919', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#191919' }}>Critical alerts</div>
                <div style={{ fontSize: '12px', color: '#787774' }}>Receive email when stockouts, margin drops, or PPC waste are detected</div>
              </div>
            </label>
          </section>

          <button
            onClick={save}
            disabled={saving}
            style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>

          {/* Category mappings */}
          <section style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '24px', marginTop: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Saved category mappings</div>
            <div style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>
              When you pick an eBay/Amazon category on publish, it's saved here and auto-applied next time.
            </div>
            {mappingsLoading ? (
              <div style={{ fontSize: '13px', color: '#787774' }}>Loading…</div>
            ) : mappings.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9b9b98', padding: '16px', background: '#f5f3ef', borderRadius: '8px', textAlign: 'center' }}>
                No mappings yet — they appear here after your first publish with a category selected.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mappings.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #e8e8e5', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{CH_ICON[m.channel_type] || '🏪'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '12px', color: '#787774' }}>{m.source_category}</span>
                      <span style={{ fontSize: '12px', color: '#9b9b98', margin: '0 6px' }}>→</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#191919' }}>{m.channel_cat_name || m.channel_cat_id || '—'}</span>
                      <span style={{ fontSize: '11px', color: '#9b9b98', marginLeft: '6px' }}>({m.channel_type})</span>
                    </div>
                    <button onClick={() => deleteMapping(m.id)}
                      style={{ background: 'none', border: 'none', color: '#9b9b98', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', fontFamily: 'Inter' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Privacy & data (DSAR) */}
          <section id="privacy" style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '24px', marginTop: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Privacy &amp; data</div>
            <div style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>
              Exercise your GDPR rights in one click. <a href="/security" style={{ color: '#1d5fdb', textDecoration: 'none' }}>Security overview →</a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ border: '1px solid #e8e8e5', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>Export your data</div>
                <div style={{ fontSize: '12px', color: '#787774', lineHeight: 1.5, marginBottom: '12px' }}>
                  Download a JSON archive of every row we hold for your account. Instant.
                </div>
                <button
                  onClick={exportData}
                  disabled={exporting}
                  style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}
                >
                  {exporting ? 'Preparing…' : 'Export data'}
                </button>
              </div>

              <div style={{ border: '1px solid #e8e8e5', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>Delete your account</div>
                <div style={{ fontSize: '12px', color: '#787774', lineHeight: 1.5, marginBottom: '12px' }}>
                  We will process your request within 30 days and email confirmation.
                </div>
                <button
                  onClick={() => setDeleteOpen(true)}
                  style={{ background: 'white', color: '#7d2a1a', border: '1px solid #e8d5d0', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Delete account…
                </button>
              </div>
            </div>
          </section>

          {/* Delete confirmation modal */}
          {deleteOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,15,26,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <div role="dialog" aria-modal="true" style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                {!deleteAck ? (
                  <>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#191919', marginBottom: '8px' }}>Delete your Palvento account?</div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '18px' }}>
                      We will queue your request and process it within 30 days (GDPR SLA). Billing records required by law are retained for 7 years; everything else is purged. You can keep using the account until processing completes.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setDeleteOpen(false)}
                        disabled={deleting}
                        style={{ background: 'white', color: '#191919', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        disabled={deleting}
                        style={{ background: '#7d2a1a', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}
                      >
                        {deleting ? 'Submitting…' : 'Yes, request deletion'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#191919', marginBottom: '8px' }}>Request received</div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '18px' }}>{deleteAck}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setDeleteOpen(false); setDeleteAck(null) }}
                        style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
