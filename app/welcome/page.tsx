'use client'

/**
 * Palvento welcome — 5-step data-capture wizard that runs right after
 * email verification and before the product-tour /onboarding flow.
 *
 *   Step 1 — You            (full_name, role)
 *   Step 2 — Your business  (business_name, country, business_type,
 *                            company_number, tax_id)
 *   Step 3 — Your store     (shopify_url, gmv_band, current_channels)
 *   Step 4 — Your problem   (primary_problem, free_text_context)
 *   Step 5 — How you found us  (acquisition_source)
 *
 * Resumable — on mount we GET /api/onboarding and jump to the saved
 * onboarding_step. Every Next click PATCHes the server so a dropout at
 * step 3 still preserves steps 1+2 on the user's profile.
 *
 * Branch: if gmv_band === '500k_plus', we route the user to /enterprise
 * with business fields pre-filled rather than self-serve trial.
 *
 * On completion → redirect to /onboarding (the product tour).
 *
 * Brand rules match signup: cream bg, Instrument Serif italic display,
 * Geist UI, cobalt accent, Palvento chevron.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ROLES, BUSINESS_TYPES, COUNTRIES, GMV_BANDS, CHANNELS,
  PRIMARY_PROBLEMS, ACQUISITION_SOURCES,
  taxIdConfig, companyNumberConfig,
  type UserProfile, type Channel,
} from '../lib/onboarding-constants'

const C = {
  bg:      '#f3f0ea',
  surface: '#ffffff',
  ink:     '#0b0f1a',
  mutedDk: '#2c3142',
  muted:   '#5a6171',
  rule:    'rgba(11,15,26,0.10)',
  ruleSoft:'rgba(11,15,26,0.06)',
  cobalt:  '#1d5fdb',
  cobaltDk:'#1647a8',
  cobaltSft:'rgba(29,95,219,0.10)',
}

const display = 'var(--font-display), Georgia, serif'
const sans    = 'var(--font-geist), -apple-system, system-ui, sans-serif'
const mono    = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'

const TOTAL_STEPS = 5
const STEP_TITLES = ['You', 'Your business', 'Your store', 'Your problem', 'How you found us']

type FormState = Omit<Partial<UserProfile>, 'current_channels'> & {
  current_channels?: string[]
}

export default function WelcomePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({ current_channels: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/onboarding')
        if (res.status === 401) { router.push('/login'); return }
        const { profile } = await res.json()
        if (profile) {
          setForm(profile)
          const startStep = Math.min(Math.max((profile.onboarding_step || 0) + 1, 1), TOTAL_STEPS)
          if (profile.onboarding_completed_at) { router.push('/onboarding'); return }
          setStep(startStep)
        }
        try {
          const raw = localStorage.getItem('palvento_signup_attribution')
          if (raw) {
            const att = JSON.parse(raw)
            setForm(prev => ({
              ...prev,
              utm_source:   prev.utm_source   ?? att.utm_source   ?? null,
              utm_medium:   prev.utm_medium   ?? att.utm_medium   ?? null,
              utm_campaign: prev.utm_campaign ?? att.utm_campaign ?? null,
              referrer:     prev.referrer     ?? att.referrer     ?? null,
            }))
          }
        } catch {}
      } catch (e: any) {
        setError(e.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  async function saveStep(nextStep: number) {
    setSaving(true)
    setError(null)
    try {
      const patch: Record<string, unknown> = {
        ...form,
        onboarding_step: nextStep - 1,
      }
      delete patch.user_id
      delete patch.created_at
      delete patch.updated_at
      delete patch.onboarding_completed_at

      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      return true
    } catch (e: any) {
      setError(e.message || 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    const err = validateStep(step, form)
    if (err) { setError(err); return }

    if (step === 3 && form.gmv_band === '500k_plus') {
      const ok = await saveStep(step + 1)
      if (!ok) return
      const qs = new URLSearchParams({
        business_name: form.business_name || '',
        country:       form.country || '',
        shopify_url:   form.shopify_url || '',
        gmv:           '500k_plus',
      }).toString()
      router.push(`/enterprise?${qs}`)
      return
    }

    const ok = await saveStep(step + 1)
    if (!ok) return

    if (step === TOTAL_STEPS) {
      const res = await fetch('/api/onboarding', { method: 'POST' })
      if (res.ok) router.push('/onboarding')
      else setError('Could not complete onboarding')
      return
    }
    setStep(step + 1)
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleChannel(value: string) {
    setForm(prev => {
      const next = new Set(prev.current_channels || [])
      if (next.has(value)) next.delete(value); else next.add(value)
      return { ...prev, current_channels: Array.from(next) }
    })
  }

  const isEnterprise = form.gmv_band === '500k_plus'
  const taxCfg = useMemo(() => taxIdConfig(form.country ?? null), [form.country])
  const coCfg  = useMemo(() => companyNumberConfig(form.country ?? null), [form.country])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
        <div style={{ fontFamily: mono, fontSize: 12, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: sans, WebkitFontSmoothing: 'antialiased' as any }}>
      <header style={{ padding: '20px 32px', borderBottom: `1px solid ${C.rule}`, background: 'rgba(243,240,234,0.9)', position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink}/>
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt}/>
            </svg>
            <span style={{ fontFamily: display, fontSize: 22, letterSpacing: '-0.015em' }}>Palvento</span>
          </Link>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Setup · {step} / {TOTAL_STEPS}</span>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(n => (
            <div key={n} style={{ flex: 1, height: 3, background: n <= step ? C.cobalt : C.rule, borderRadius: 2, transition: 'background 0.25s' }} />
          ))}
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.mutedDk, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          § {String(step).padStart(2,'0')} · {STEP_TITLES[step - 1]}
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 96px' }}>
        <h1 style={{ fontFamily: display, fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 400, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 8px' }}>
          {step === 1 && <>Tell us who <em style={{ color: C.cobalt, fontStyle: 'italic' }}>you are.</em></>}
          {step === 2 && <>Now your <em style={{ color: C.cobalt, fontStyle: 'italic' }}>business.</em></>}
          {step === 3 && <>What you're <em style={{ color: C.cobalt, fontStyle: 'italic' }}>selling.</em></>}
          {step === 4 && <>What you want <em style={{ color: C.cobalt, fontStyle: 'italic' }}>Palvento to fix.</em></>}
          {step === 5 && <>How you <em style={{ color: C.cobalt, fontStyle: 'italic' }}>found us.</em></>}
        </h1>
        <p style={{ fontSize: 14.5, color: C.mutedDk, marginBottom: 36, lineHeight: 1.55, maxWidth: 560 }}>
          {step === 1 && 'This takes about two minutes. You can back out at any step — what you save stays saved.'}
          {step === 2 && 'We need this for invoicing, tax handling, and to serve the right support region. Company number and VAT are optional.'}
          {step === 3 && 'What you sell, where, and at what scale. Helps us wire the right channels up on your first sync.'}
          {step === 4 && "The real friction. Whatever you write here shows up on our operator-call notes — this is how we prioritise the roadmap."}
          {step === 5 && 'Honest attribution — no wrong answer. Helps us know which surfaces are working.'}
        </p>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Full name">
              <Input value={form.full_name || ''} onChange={v => set('full_name', v)} placeholder="Jane Smith" autoFocus />
            </Field>
            <Field label="Your role">
              <Select value={form.role || ''} onChange={v => set('role', v as any)} placeholder="Select a role">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Business name">
              <Input value={form.business_name || ''} onChange={v => set('business_name', v)} placeholder="Your registered trading name" autoFocus />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Country">
                <Select value={form.country || ''} onChange={v => set('country', v)} placeholder="Select country">
                  <optgroup label="Palvento priority markets">
                    {COUNTRIES.filter(c => c.group === 'priority').map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="Europe">
                    {COUNTRIES.filter(c => c.group === 'eu').map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="Rest of world">
                    {COUNTRIES.filter(c => c.group === 'rest').map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </optgroup>
                </Select>
              </Field>
              <Field label="Business type">
                <Select value={form.business_type || ''} onChange={v => set('business_type', v as any)} placeholder="Select type">
                  {BUSINESS_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label={coCfg.label} helper="Optional.">
              <Input value={form.company_number || ''} onChange={v => set('company_number', v)} placeholder={coCfg.placeholder} />
            </Field>
            {taxCfg.visible && (
              <Field label={taxCfg.label} helper={taxCfg.helper}>
                <Input value={form.tax_id || ''} onChange={v => set('tax_id', v)} placeholder={taxCfg.placeholder} />
              </Field>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Shopify store URL" helper="Either mystore.myshopify.com or your custom domain.">
              <Input value={form.shopify_url || ''} onChange={v => set('shopify_url', v)} placeholder="mystore.myshopify.com" autoFocus />
            </Field>
            <Field label="Monthly GMV">
              <Select value={form.gmv_band || ''} onChange={v => set('gmv_band', v as any)} placeholder="Pick a band">
                {GMV_BANDS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </Select>
            </Field>
            {isEnterprise && (
              <div style={{ background: C.cobaltSft, border: `1px solid ${C.cobalt}`, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: C.cobaltDk, lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>Looks like you're enterprise scale.</strong> Our Enterprise tier starts at $2,000/mo with dedicated onboarding, SSO, SLA, and data residency. When you continue, we'll take you to an Enterprise intake with your business details pre-filled — not the self-serve trial.
              </div>
            )}
            <Field label="Current channels (pick all that apply)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CHANNELS.map(ch => {
                  const selected = (form.current_channels || []).includes(ch.value)
                  return (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => toggleChannel(ch.value)}
                      style={{
                        padding: '8px 14px', borderRadius: 999,
                        border: `1px solid ${selected ? C.cobalt : C.rule}`,
                        background: selected ? C.cobaltSft : C.surface,
                        color: selected ? C.cobaltDk : C.mutedDk,
                        fontFamily: sans, fontSize: 13,
                        fontWeight: selected ? 600 : 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >{selected && '✓ '}{ch.label}</button>
                  )
                })}
              </div>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="The #1 thing you want Palvento to solve">
              <Select value={form.primary_problem || ''} onChange={v => set('primary_problem', v as any)} placeholder="Pick the sharpest one">
                {PRIMARY_PROBLEMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </Field>
            <Field label="Anything else we should know?" helper="Optional. Your exact words here show up on our operator-call notes.">
              <textarea
                value={form.free_text_context || ''}
                onChange={e => set('free_text_context', e.target.value)}
                placeholder="e.g. we just hit TikTok Shop's beauty compliance wall"
                rows={5}
                style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.rule}`, borderRadius: 8, fontSize: 14, fontFamily: sans, color: C.ink, outline: 'none', boxSizing: 'border-box', background: C.surface, resize: 'vertical', minHeight: 110 }}
              />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="How you found us">
              <Select value={form.acquisition_source || ''} onChange={v => set('acquisition_source', v as any)} placeholder="Pick one">
                {ACQUISITION_SOURCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
            </Field>
            <div style={{ background: C.ruleSoft, borderRadius: 8, padding: '14px 16px', fontSize: 13, color: C.mutedDk, lineHeight: 1.55 }}>
              You're done. Hit finish and we'll drop you into the product-tour so you can connect your first channel.
            </div>
          </div>
        )}

        {error && (
          <div role="alert" style={{ marginTop: 20, fontSize: 13, color: '#b32718', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.rule}` }}>
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || saving}
            style={{
              background: 'transparent',
              color: step === 1 ? C.muted : C.ink,
              border: `1px solid ${step === 1 ? C.rule : C.ink}`,
              borderRadius: 8, padding: '12px 20px', fontSize: 14, fontFamily: sans,
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.6 : 1,
            }}
          >← Back</button>
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            style={{
              background: C.ink, color: C.bg, border: 'none',
              borderRadius: 8, padding: '14px 24px', fontSize: 14.5, fontWeight: 500,
              cursor: saving ? 'wait' : 'pointer', fontFamily: sans,
              letterSpacing: '0.01em', opacity: saving ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >{saving ? 'Saving…' : step === TOTAL_STEPS ? 'Finish →' : isEnterprise && step === 3 ? 'Continue to Enterprise →' : 'Next →'}</button>
        </div>
      </main>
    </div>
  )
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
      {children}
      {helper && <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.45 }}>{helper}</div>}
    </div>
  )
}

function Input(props: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      type="text"
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ width: '100%', padding: '12px 14px', border: `1px solid ${focus ? C.cobalt : C.rule}`, borderRadius: 8, fontSize: 14, fontFamily: sans, color: C.ink, outline: 'none', boxSizing: 'border-box', background: C.surface, boxShadow: focus ? `0 0 0 3px ${C.cobaltSft}` : 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
    />
  )
}

function Select({ value, onChange, placeholder, children }: { value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode }) {
  const [focus, setFocus] = useState(false)
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', padding: '12px 14px', border: `1px solid ${focus ? C.cobalt : C.rule}`, borderRadius: 8,
        fontSize: 14, fontFamily: sans, color: value ? C.ink : C.muted,
        outline: 'none', boxSizing: 'border-box', background: C.surface,
        boxShadow: focus ? `0 0 0 3px ${C.cobaltSft}` : 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%235a6171' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40,
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
  )
}

function validateStep(step: number, form: FormState): string | null {
  switch (step) {
    case 1:
      if (!form.full_name?.trim()) return 'Please enter your full name.'
      if (!form.role) return 'Please pick a role.'
      return null
    case 2:
      if (!form.business_name?.trim()) return 'Please enter your business name.'
      if (!form.country) return 'Please select your country.'
      if (!form.business_type) return 'Please select a business type.'
      return null
    case 3: {
      if (!form.shopify_url?.trim()) return 'Please enter your Shopify store URL.'
      const url = form.shopify_url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
      const valid = /^[a-z0-9-]+\.myshopify\.com$/i.test(url) || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url)
      if (!valid) return "That doesn't look like a valid Shopify store URL."
      if (!form.gmv_band) return 'Please pick a GMV band.'
      if (!form.current_channels?.length) return 'Pick at least one channel.'
      return null
    }
    case 4:
      if (!form.primary_problem) return 'Please pick the primary problem.'
      return null
    case 5:
      if (!form.acquisition_source) return 'Please tell us where you found us.'
      return null
    default:
      return null
  }
}
