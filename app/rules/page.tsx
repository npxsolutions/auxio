'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

// ─── Types ───────────────────────────────────────────────────────────────────

type ConditionOp = 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'ends_with' | 'gt' | 'lt'
type ActionType  = 'set_field' | 'append' | 'prepend' | 'truncate' | 'replace' | 'map_value'

interface Condition {
  field: string
  op:    ConditionOp
  value: string
}

interface Action {
  type:  ActionType
  field: string
  value: string
  from?: string   // for map_value / replace
  to?:   string   // for map_value / replace
}

interface Rule {
  id:         string
  name:       string
  channel:    string
  conditions: Condition[]
  actions:    Action[]
  active:     boolean
  priority:   number
  created_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELDS = [
  { value: 'title',       label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'brand',       label: 'Brand' },
  { value: 'category',    label: 'Category' },
  { value: 'condition',   label: 'Condition' },
  { value: 'price',       label: 'Price' },
  { value: 'sku',         label: 'SKU' },
]

const CONDITION_OPS: { value: ConditionOp; label: string }[] = [
  { value: 'contains',     label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'equals',       label: 'equals' },
  { value: 'starts_with',  label: 'starts with' },
  { value: 'ends_with',    label: 'ends with' },
  { value: 'gt',           label: 'is greater than' },
  { value: 'lt',           label: 'is less than' },
]

const ACTION_TYPES: { value: ActionType; label: string; hint: string }[] = [
  { value: 'set_field',  label: 'Set field',    hint: 'Replace field value entirely' },
  { value: 'append',     label: 'Append',       hint: 'Add text to the end' },
  { value: 'prepend',    label: 'Prepend',       hint: 'Add text to the start' },
  { value: 'truncate',   label: 'Truncate',      hint: 'Trim to max length (enter number)' },
  { value: 'replace',    label: 'Find & replace', hint: 'Replace one value with another' },
  { value: 'map_value',  label: 'Map value',     hint: 'e.g. "New" → "new_with_tags"' },
]

const CHANNELS = [
  { value: 'all',     label: 'All channels' },
  { value: 'ebay',    label: 'eBay' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'amazon',  label: 'Amazon' },
]

const CHANNEL_ICON: Record<string, string> = { all: '🔗', ebay: '🛒', shopify: '🛍️', amazon: '📦' }

// ─── Blank builders ───────────────────────────────────────────────────────────

const blankCondition = (): Condition => ({ field: 'title', op: 'contains', value: '' })
const blankAction    = (): Action    => ({ type: 'append', field: 'title', value: '' })

// ─── Apply rules to a sample listing (preview engine) ────────────────────────

function applyRules(sample: Record<string, string>, rules: Rule[]): Record<string, string> {
  const out = { ...sample }
  const active = rules.filter(r => r.active).sort((a, b) => a.priority - b.priority)

  for (const rule of active) {
    // Check all conditions pass (AND logic)
    const passes = rule.conditions.every(c => {
      const v = String(out[c.field] || '').toLowerCase()
      const cv = c.value.toLowerCase()
      switch (c.op) {
        case 'contains':     return v.includes(cv)
        case 'not_contains': return !v.includes(cv)
        case 'equals':       return v === cv
        case 'starts_with':  return v.startsWith(cv)
        case 'ends_with':    return v.endsWith(cv)
        case 'gt':           return parseFloat(v) > parseFloat(cv)
        case 'lt':           return parseFloat(v) < parseFloat(cv)
        default:             return true
      }
    })

    if (!passes) continue

    for (const action of rule.actions) {
      const cur = String(out[action.field] || '')
      switch (action.type) {
        case 'set_field':  out[action.field] = action.value; break
        case 'append':     out[action.field] = cur + action.value; break
        case 'prepend':    out[action.field] = action.value + cur; break
        case 'truncate':   out[action.field] = cur.slice(0, parseInt(action.value) || cur.length); break
        case 'replace':    out[action.field] = cur.split(action.from || '').join(action.to || ''); break
        case 'map_value':  if (cur === action.from) out[action.field] = action.to || ''; break
      }
    }
  }
  return out
}

const SAMPLE_LISTING: Record<string, string> = {
  title:       'Nike Air Max 90 Mens Running Trainers White Black Size 10 UK New',
  description: 'Classic Nike Air Max 90 in white and black colourway.',
  brand:       'Nike',
  category:    'Trainers',
  condition:   'New',
  price:       '89.99',
  sku:         'NIKE-AM90-W-10',
}

// ─── Inline editor components ─────────────────────────────────────────────────

function SelectField({ value, onChange, options, style }: any) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '6px 10px', border: '1px solid #e8e8e5', borderRadius: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', background: 'white', ...style }}>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function TextInput({ value, onChange, placeholder, style }: any) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding: '6px 10px', border: '1px solid #e8e8e5', borderRadius: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', background: 'white', ...style }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RulesPage() {
  const router = useRouter()
  const [rules, setRules]             = useState<Rule[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [editId, setEditId]           = useState<string | null>(null)

  // Form state
  const [name, setName]               = useState('')
  const [channel, setChannel]         = useState('all')
  const [conditions, setConditions]   = useState<Condition[]>([blankCondition()])
  const [actions, setActions]         = useState<Action[]>([blankAction()])
  const [preview, setPreview]         = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    fetch('/api/rules')
      .then(r => r.json())
      .then(d => setRules(d.rules || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setName(''); setChannel('all')
    setConditions([blankCondition()]); setActions([blankAction()])
    setEditId(null); setShowForm(false); setPreview(false)
  }

  function openEdit(rule: Rule) {
    setName(rule.name); setChannel(rule.channel)
    setConditions(rule.conditions.length ? rule.conditions : [blankCondition()])
    setActions(rule.actions.length ? rule.actions : [blankAction()])
    setEditId(rule.id); setShowForm(true); setPreview(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveRule() {
    if (!name.trim()) { showToast('Rule name is required'); return }
    setSaving(true)
    try {
      const body = { name, channel, conditions: conditions.filter(c => c.value), actions: actions.filter(a => a.value || a.type === 'truncate') }
      const res = await fetch('/api/rules', {
        method:  editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(editId ? { id: editId, ...body } : body),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Failed to save'); return }

      if (editId) {
        setRules(prev => prev.map(r => r.id === editId ? json.rule : r))
      } else {
        setRules(prev => [...prev, json.rule])
      }
      showToast(editId ? 'Rule updated' : 'Rule created')
      resetForm()
    } catch (err: any) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(rule: Rule) {
    const res = await fetch('/api/rules', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: rule.id, active: !rule.active }),
    })
    const json = await res.json()
    if (res.ok) setRules(prev => prev.map(r => r.id === rule.id ? json.rule : r))
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return
    const res = await fetch('/api/rules', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    if (res.ok) setRules(prev => prev.filter(r => r.id !== id))
    else showToast('Delete failed')
  }

  // Preview: simulate rules against sample
  const previewOutput = applyRules(SAMPLE_LISTING, [
    ...(editId ? [] : [{
      id: '__draft__', name, channel,
      conditions: conditions.filter(c => c.value),
      actions:    actions.filter(a => a.value || a.type === 'truncate'),
      active: true, priority: 0, created_at: '',
    }]),
  ])

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '840px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>Feed Rules</h1>
              <p style={{ fontSize: '14px', color: '#787774' }}>Transform listing data automatically before publishing to each channel.</p>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                + New rule
              </button>
            )}
          </div>

          {/* ── Rule editor ── */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '12px', marginBottom: '28px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f1ef', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule name (e.g. Truncate eBay titles to 80 chars)"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <SelectField value={channel} onChange={setChannel} options={CHANNELS} />
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* CONDITIONS */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    When (conditions — all must match)
                  </div>
                  {conditions.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <SelectField value={c.field} onChange={(v: string) => setConditions(prev => prev.map((x, j) => j === i ? { ...x, field: v } : x))} options={FIELDS} />
                      <SelectField value={c.op}    onChange={(v: string) => setConditions(prev => prev.map((x, j) => j === i ? { ...x, op: v as ConditionOp } : x))} options={CONDITION_OPS} />
                      <TextInput  value={c.value}  onChange={(v: string) => setConditions(prev => prev.map((x, j) => j === i ? { ...x, value: v } : x))} placeholder="value…" style={{ flex: 1 }} />
                      {conditions.length > 1 && (
                        <button onClick={() => setConditions(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', color: '#9b9b98', cursor: 'pointer', fontSize: '16px', padding: '4px 6px', fontFamily: 'Inter' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setConditions(prev => [...prev, blankCondition()])}
                    style={{ background: '#f7f7f5', border: '1px dashed #e8e8e5', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', color: '#787774', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    + Add condition
                  </button>
                </div>

                {/* ACTIONS */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Then (actions)
                  </div>
                  {actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <SelectField value={a.type}  onChange={(v: string) => setActions(prev => prev.map((x, j) => j === i ? { ...x, type: v as ActionType } : x))} options={ACTION_TYPES.map(t => ({ value: t.value, label: t.label }))} />
                      <SelectField value={a.field} onChange={(v: string) => setActions(prev => prev.map((x, j) => j === i ? { ...x, field: v } : x))} options={FIELDS} />
                      {(a.type === 'replace' || a.type === 'map_value') ? (
                        <>
                          <TextInput value={a.from || ''} onChange={(v: string) => setActions(prev => prev.map((x, j) => j === i ? { ...x, from: v } : x))} placeholder="from…" style={{ flex: 1 }} />
                          <span style={{ fontSize: '12px', color: '#9b9b98', padding: '6px 4px' }}>→</span>
                          <TextInput value={a.to   || ''} onChange={(v: string) => setActions(prev => prev.map((x, j) => j === i ? { ...x, to: v } : x))} placeholder="to…" style={{ flex: 1 }} />
                        </>
                      ) : (
                        <TextInput value={a.value} onChange={(v: string) => setActions(prev => prev.map((x, j) => j === i ? { ...x, value: v } : x))}
                          placeholder={a.type === 'truncate' ? 'max length (e.g. 80)' : 'value…'} style={{ flex: 1 }} />
                      )}
                      {actions.length > 1 && (
                        <button onClick={() => setActions(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', color: '#9b9b98', cursor: 'pointer', fontSize: '16px', padding: '4px 6px', fontFamily: 'Inter' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setActions(prev => [...prev, blankAction()])}
                    style={{ background: '#f7f7f5', border: '1px dashed #e8e8e5', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', color: '#787774', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    + Add action
                  </button>
                </div>

                {/* PREVIEW TOGGLE */}
                <div style={{ background: '#f7f7f5', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
                  <button onClick={() => setPreview(p => !p)}
                    style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 600, color: '#2383e2', cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: 0 }}>
                    {preview ? '▲ Hide preview' : '▼ Preview against sample listing'}
                  </button>
                  {preview && (
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {['title', 'condition', 'brand', 'price'].map(f => (
                        <div key={f} style={{ background: 'white', borderRadius: '6px', padding: '10px 12px', border: '1px solid #e8e8e5' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{f}</div>
                          <div style={{ fontSize: '12px', color: '#9b9b98', textDecoration: 'line-through', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{SAMPLE_LISTING[f]}</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: previewOutput[f] !== SAMPLE_LISTING[f] ? '#0f7b6c' : '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {previewOutput[f] !== SAMPLE_LISTING[f] && <span style={{ marginRight: '4px' }}>✓</span>}{previewOutput[f] || SAMPLE_LISTING[f]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* FORM BUTTONS */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveRule} disabled={saving}
                    style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : editId ? 'Update rule' : 'Create rule'}
                  </button>
                  <button onClick={resetForm}
                    style={{ background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '7px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Rules list ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#787774', fontSize: '14px' }}>Loading…</div>
          ) : rules.length === 0 && !showForm ? (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚙️</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#191919', marginBottom: '6px' }}>No rules yet</div>
              <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px', maxWidth: '360px', margin: '0 auto 20px' }}>
                Rules automatically transform your listing data — truncate titles, map conditions, remap categories — before publishing.
              </div>
              <button onClick={() => setShowForm(true)}
                style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Create your first rule
              </button>
            </div>
          ) : rules.length > 0 ? (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                {rules.length} rule{rules.length !== 1 ? 's' : ''} · applied in order
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rules.map((rule, idx) => (
                  <div key={rule.id} style={{ background: 'white', border: `1px solid ${rule.active ? '#e8e8e5' : '#f1f1ef'}`, borderRadius: '10px', padding: '16px 20px', opacity: rule.active ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#f1f1ef', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#9b9b98', flexShrink: 0 }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{rule.name}</span>
                          <span style={{ fontSize: '11px', color: '#787774', background: '#f1f1ef', padding: '2px 7px', borderRadius: '4px' }}>
                            {CHANNEL_ICON[rule.channel]} {CHANNELS.find(c => c.value === rule.channel)?.label || rule.channel}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#787774', marginTop: '3px' }}>
                          {rule.conditions.length > 0 && <span>{rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}</span>}
                          {rule.conditions.length > 0 && rule.actions.length > 0 && <span style={{ margin: '0 6px' }}>·</span>}
                          {rule.actions.length > 0 && <span>{rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}</span>}
                          {rule.conditions.length === 0 && rule.actions.length === 0 && <span style={{ color: '#c9372c' }}>No conditions or actions</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Toggle */}
                        <div onClick={() => toggleActive(rule)}
                          style={{ width: '36px', height: '20px', background: rule.active ? '#0f7b6c' : '#e8e8e5', borderRadius: '10px', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: '2px', left: rule.active ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.15s' }} />
                        </div>
                        <button onClick={() => openEdit(rule)}
                          style={{ background: '#f1f1ef', color: '#191919', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          Edit
                        </button>
                        <button onClick={() => deleteRule(rule.id)}
                          style={{ background: 'none', color: '#9b9b98', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

        </div>
      </main>
    </div>
  )
}
