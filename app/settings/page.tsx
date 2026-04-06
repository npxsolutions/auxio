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

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7f5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#787774' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
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
        </div>
      </main>
    </div>
  )
}
