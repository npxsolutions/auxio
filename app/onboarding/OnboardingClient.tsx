'use client'

// [onboarding:client] — 5-step onboarding UI with sidebar progress + skip affordance.
// Server derives the true step; this component lets users revisit completed steps
// via the sidebar. Palette: v8 cream (#f5f3ef), ink (#191919), cobalt (#5b52f5).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const CREAM  = '#f5f3ef'
const INK    = '#191919'
const COBALT = '#5b52f5'
const MUTE   = '#787774'
const LINE   = '#e8e8e5'
const SERIF  = "'Instrument Serif', 'Iowan Old Style', Georgia, serif"
const SANS   = "'Geist', 'Geist Fallback', -apple-system, system-ui, sans-serif"

export type StepId = 1 | 2 | 3 | 4 | 5 | 6
export type DerivedState = {
  channelsCount: number
  listingsCount: number
  costsSetCount: number
  rulesCount:    number
  teamCount:     number
}

const STEPS: { id: StepId; title: string; blurb: string }[] = [
  { id: 1, title: 'Connect a marketplace', blurb: 'Shopify, eBay, WooCommerce, BigCommerce or Etsy.' },
  { id: 2, title: 'Import your products',  blurb: 'We\'ll sync your catalogue in the background.' },
  { id: 3, title: 'See your true profit',  blurb: 'Set cost prices so margin can compute.' },
  { id: 4, title: 'First repricing rule',  blurb: 'Automate price floors and raises.' },
  { id: 5, title: 'Invite your team',      blurb: 'Optional — add a teammate.' },
]

const LIVE_CHANNELS = [
  { id: 'shopify',      name: 'Shopify',      desc: 'Connect via OAuth',    connectPath: '/api/shopify/connect', icon: '🛍️' },
  { id: 'ebay',         name: 'eBay',         desc: 'Connect via OAuth',    connectPath: '/api/ebay/connect',    icon: '🛒' },
  { id: 'woocommerce',  name: 'WooCommerce',  desc: 'Enter site URL + key', connectPath: '/api/woocommerce/connect', icon: '🪵' },
  { id: 'bigcommerce',  name: 'BigCommerce',  desc: 'Store hash + token',   connectPath: '/api/bigcommerce/connect', icon: '🏬' },
  { id: 'etsy',         name: 'Etsy',         desc: 'Connect via OAuth',    connectPath: '/api/etsy/connect',    icon: '🎨' },
]

const COMING_SOON = ['Amazon', 'TikTok Shop', 'Walmart', 'OnBuy', 'Facebook', 'Google']

export default function OnboardingClient({
  initialStep,
  state,
}: {
  initialStep: StepId
  state: DerivedState
}) {
  const router = useRouter()
  const [step, setStep] = useState<StepId>(initialStep)

  const completed = (s: StepId) => {
    if (s === 1) return state.channelsCount > 0
    if (s === 2) return state.listingsCount > 0
    if (s === 3) return state.costsSetCount > 0
    if (s === 4) return state.rulesCount > 0
    if (s === 5) return state.teamCount > 0
    return false
  }

  function goToStep(s: StepId) {
    // only allow revisits of completed steps OR the current active step
    if (s <= initialStep) setStep(s)
  }

  function skip() {
    const next = Math.min(step + 1, 6) as StepId
    if (next >= 6) router.push('/dashboard')
    else setStep(next)
  }

  return (
    <div style={{ fontFamily: SANS, background: CREAM, minHeight: '100vh', display: 'flex', color: INK, WebkitFontSmoothing: 'antialiased' as const }}>
      {/* Sidebar progress */}
      <aside style={{ width: 300, borderRight: `1px solid ${LINE}`, padding: '40px 28px', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${COBALT} 0%, #7c75f8 100%)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>A</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Palvento</span>
        </div>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTE, fontWeight: 700, marginBottom: 18 }}>
          Getting started
        </div>

        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {STEPS.map(s => {
            const done = completed(s.id)
            const active = step === s.id
            const clickable = s.id <= initialStep
            return (
              <li key={s.id}>
                <button
                  onClick={() => goToStep(s.id)}
                  disabled={!clickable}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 8,
                    textAlign: 'left',
                    background: active ? 'rgba(91,82,245,0.08)' : 'transparent',
                    cursor: clickable ? 'pointer' : 'default',
                    fontFamily: SANS,
                    color: INK,
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: done ? COBALT : active ? 'white' : 'transparent',
                    border: done ? 'none' : `1.5px solid ${active ? COBALT : LINE}`,
                    color: done ? 'white' : active ? COBALT : MUTE,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, marginTop: 1,
                  }}>
                    {done ? '✓' : s.id}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: active ? 600 : 500, lineHeight: 1.3 }}>{s.title}</span>
                    <span style={{ display: 'block', fontSize: 11, color: MUTE, marginTop: 2, lineHeight: 1.4 }}>{s.blurb}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '64px 56px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>
          {step === 1 && <Step1Connect />}
          {step === 2 && <Step2Import state={state} />}
          {step === 3 && <Step3Costs onSkip={skip} onDone={() => router.refresh()} />}
          {step === 4 && <Step4Repricing onSkip={skip} onDone={() => router.refresh()} />}
          {step === 5 && <Step5Team onSkip={skip} onDone={() => router.push('/dashboard')} />}
        </div>
      </main>
    </div>
  )
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────

function Step1Connect() {
  return (
    <div>
      <Heading eyebrow="Step 1 of 5">Connect your first marketplace</Heading>
      <Body>Pick where your products live today. We'll sync everything from there.</Body>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
        {LIVE_CHANNELS.map(ch => (
          <a
            key={ch.id}
            href={ch.connectPath}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', border: `1px solid ${LINE}`, borderRadius: 10,
              textDecoration: 'none', color: INK, background: 'white',
              transition: 'border-color .15s, box-shadow .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = COBALT
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 0 3px rgba(91,82,245,0.08)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = LINE
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
            }}
          >
            <span style={{ fontSize: 22 }}>{ch.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{ch.name}</span>
              <span style={{ display: 'block', fontSize: 12, color: MUTE, marginTop: 1 }}>{ch.desc}</span>
            </span>
            <span style={{ fontSize: 12, color: MUTE }}>Connect →</span>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'white', border: `1px dashed ${LINE}`, borderRadius: 10 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTE, fontWeight: 700, marginBottom: 8 }}>Coming soon</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COMING_SOON.map(c => (
            <span key={c} style={{ fontSize: 12, padding: '3px 10px', background: CREAM, borderRadius: 20, color: MUTE }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────

function Step2Import({ state }: { state: DerivedState }) {
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  const [liveCount, setLiveCount] = useState<number>(state.listingsCount)
  const [msg, setMsg] = useState<string>('')

  // Poll the count while importing so the user sees progress.
  useEffect(() => {
    if (!importing) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/listings', { cache: 'no-store' })
        const data = await res.json()
        const n = Array.isArray(data?.listings) ? data.listings.length : 0
        setLiveCount(n)
        if (n > 0) {
          setImporting(false)
          router.refresh()
        }
      } catch (err: any) {
        console.error('[onboarding:step2] poll failed:', err?.message || err)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [importing, router])

  async function startImport() {
    setImporting(true)
    setMsg('Starting import…')
    try {
      const res = await fetch('/api/shopify/backfill', { method: 'POST' })
      if (!res.ok) throw new Error(`backfill returned ${res.status}`)
      setMsg('Syncing — this may take a minute.')
    } catch (err: any) {
      console.error('[onboarding:step2] backfill failed:', err?.message || err)
      setMsg('Import could not start. You can trigger it later from Settings → Channels.')
      setImporting(false)
    }
  }

  return (
    <div>
      <Heading eyebrow="Step 2 of 5">Import your products</Heading>
      <Body>We'll pull your catalogue, inventory levels, and historical orders.</Body>

      <div style={{ marginTop: 28, padding: 24, background: 'white', border: `1px solid ${LINE}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: MUTE, fontWeight: 500 }}>Listings imported</div>
            <div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {liveCount.toLocaleString()}
            </div>
          </div>
          <button
            onClick={startImport}
            disabled={importing}
            style={{
              padding: '11px 18px', background: INK, color: 'white', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: importing ? 'wait' : 'pointer', fontFamily: SANS,
            }}
          >
            {importing ? 'Importing…' : liveCount > 0 ? 'Re-sync' : 'Start import'}
          </button>
        </div>
        {msg && <div style={{ marginTop: 14, fontSize: 12, color: MUTE }}>{msg}</div>}
      </div>

      {liveCount > 0 && (
        <button
          onClick={() => router.refresh()}
          style={{ marginTop: 20, padding: '11px 18px', background: COBALT, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}
        >
          Continue → Step 3
        </button>
      )}
    </div>
  )
}

// ─── Step 3 ─────────────────────────────────────────────────────────────────

type CostRow = { id: string; title: string; sku?: string | null; price: number; cost_price?: number | null }

function Step3Costs({ onSkip, onDone }: { onSkip: () => void; onDone: () => void }) {
  const [rows, setRows] = useState<CostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/listings', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const top5 = (d?.listings || []).slice(0, 5) as CostRow[]
        setRows(top5)
      })
      .catch(err => console.error('[onboarding:step3] fetch failed:', err?.message || err))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(values).map(([id, v]) => {
          const cost_price = parseFloat(v)
          if (isNaN(cost_price)) return Promise.resolve()
          return fetch(`/api/listings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cost_price }),
          })
        })
      )
      onDone()
    } catch (err: any) {
      console.error('[onboarding:step3] save failed:', err?.message || err)
    } finally {
      setSaving(false)
    }
  }

  const anyEntered = Object.values(values).some(v => v && !isNaN(parseFloat(v)))

  return (
    <div>
      <Heading eyebrow="Step 3 of 5">See your true profit</Heading>
      <Body>Add a cost price to a few top SKUs so margin % can compute.</Body>

      {loading ? (
        <div style={{ marginTop: 28, color: MUTE, fontSize: 13 }}>Loading your listings…</div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 28, padding: 20, background: 'white', border: `1px dashed ${LINE}`, borderRadius: 10, fontSize: 13, color: MUTE }}>
          No listings yet — finish the import step first.
        </div>
      ) : (
        <div style={{ marginTop: 28, background: 'white', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <div key={row.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 110px', gap: 14, alignItems: 'center',
              padding: '14px 18px', borderBottom: i < rows.length - 1 ? `1px solid ${LINE}` : 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.title}</div>
                <div style={{ fontSize: 11, color: MUTE, fontFamily: 'monospace' }}>{row.sku || '—'}</div>
              </div>
              <div style={{ fontSize: 12, color: MUTE, fontFamily: 'monospace' }}>£{Number(row.price).toFixed(2)}</div>
              <div>
                <input
                  type="number"
                  placeholder="Cost £"
                  defaultValue={row.cost_price ?? ''}
                  onChange={e => setValues(v => ({ ...v, [row.id]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 13, fontFamily: SANS, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={save}
          disabled={saving || !anyEntered}
          style={{ padding: '11px 18px', background: anyEntered ? INK : LINE, color: anyEntered ? 'white' : MUTE, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: anyEntered && !saving ? 'pointer' : 'default', fontFamily: SANS }}
        >
          {saving ? 'Saving…' : 'Save costs & continue'}
        </button>
        <button
          onClick={onSkip}
          style={{ padding: '11px 14px', background: 'none', color: MUTE, border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: SANS }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ─── Step 4 ─────────────────────────────────────────────────────────────────

function Step4Repricing({ onSkip, onDone }: { onSkip: () => void; onDone: () => void }) {
  const [name, setName]         = useState('First repricing rule')
  const [floor, setFloor]       = useState('')
  const [strategy, setStrategy] = useState<'beat_lowest' | 'match_lowest'>('beat_lowest')
  const [pct, setPct]           = useState('2')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  async function submit() {
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/repricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          channel: 'all',
          strategy,
          strategy_param: parseFloat(pct) || 0,
          floor_price:   parseFloat(floor) || 0,
          ceiling_price: 9999,
          min_margin_pct: 15,
          active: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `status ${res.status}`)
      }
      onDone()
    } catch (e: any) {
      console.error('[onboarding:step4] save failed:', e?.message || e)
      setErr(e?.message || 'Could not save rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Heading eyebrow="Step 4 of 5">Set your first repricing rule</Heading>
      <Body>A floor guards your margin; the strategy controls how we react to competitors.</Body>

      <div style={{ marginTop: 28, background: 'white', border: `1px solid ${LINE}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Rule name">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Strategy">
          <select value={strategy} onChange={e => setStrategy(e.target.value as any)} style={inputStyle}>
            <option value="beat_lowest">Beat lowest competitor by %</option>
            <option value="match_lowest">Match lowest competitor</option>
          </select>
        </Field>
        <Field label={strategy === 'beat_lowest' ? 'Undercut by %' : 'Match offset %'}>
          <input type="number" value={pct} onChange={e => setPct(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Price floor (£)">
          <input type="number" value={floor} onChange={e => setFloor(e.target.value)} placeholder="e.g. 9.99" style={inputStyle} />
        </Field>
        {err && <div style={{ fontSize: 12, color: '#c9372c' }}>{err}</div>}
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={submit}
          disabled={saving}
          style={{ padding: '11px 18px', background: INK, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: SANS }}
        >
          {saving ? 'Saving…' : 'Create rule & continue'}
        </button>
        <button onClick={onSkip} style={{ padding: '11px 14px', background: 'none', color: MUTE, border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: SANS }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ─── Step 5 ─────────────────────────────────────────────────────────────────

function Step5Team({ onSkip, onDone }: { onSkip: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState<'admin' | 'viewer'>('viewer')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function invite() {
    if (!email.includes('@')) { setMsg('Enter a valid email'); return }
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      // Tolerate absence of this endpoint — log + proceed (stub per spec)
      if (!res.ok) {
        console.log('[onboarding:step5] invite stub (endpoint returned', res.status, ')')
      }
      onDone()
    } catch (err: any) {
      console.error('[onboarding:step5] invite failed:', err?.message || err)
      // Still finish — invites are optional on step 5.
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Heading eyebrow="Step 5 of 5">Invite your team</Heading>
      <Body>Share access with a teammate. You can always do this later.</Body>

      <div style={{ marginTop: 28, background: 'white', border: `1px solid ${LINE}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com" style={inputStyle} />
        </Field>
        <Field label="Role">
          <select value={role} onChange={e => setRole(e.target.value as any)} style={inputStyle}>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        {msg && <div style={{ fontSize: 12, color: '#c9372c' }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={invite}
          disabled={saving}
          style={{ padding: '11px 18px', background: INK, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: SANS }}
        >
          {saving ? 'Sending…' : 'Send invite & finish'}
        </button>
        <button onClick={onSkip} style={{ padding: '11px 14px', background: 'none', color: MUTE, border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: SANS }}>
          Skip — go to dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Shared atoms ───────────────────────────────────────────────────────────

function Heading({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: COBALT, fontWeight: 700, marginBottom: 10 }}>{eyebrow}</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.015em', margin: 0, color: INK }}>{children}</h1>
    </div>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, color: MUTE, lineHeight: 1.6, marginTop: 14, marginBottom: 0, maxWidth: 520 }}>{children}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: INK, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: `1px solid ${LINE}`,
  borderRadius: 7,
  fontSize: 13,
  fontFamily: SANS,
  color: INK,
  outline: 'none',
  background: 'white',
  boxSizing: 'border-box',
}
