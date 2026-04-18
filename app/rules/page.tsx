'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { P, CARD, MONO, HEADING, LABEL, BTN_PRIMARY, BTN_SECONDARY, SECTION_HEADER } from '@/app/lib/design-system'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConditionOp =
  | 'contains' | 'not_contains' | 'equals' | 'not_equals'
  | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than' | 'matches_regex'

type ActionType =
  | 'set_field' | 'template' | 'append' | 'prepend' | 'truncate'
  | 'replace' | 'map_value' | 'calculate'
  | 'strip_html' | 'uppercase' | 'lowercase' | 'trim'

type LogicMode = 'AND' | 'OR'
type RulePhase = 'pre' | 'business' | 'post'

interface Condition {
  field: string
  op:    ConditionOp
  value: string
}

interface Action {
  type:     ActionType
  field:    string
  value:    string
  from?:    string
  to?:      string
  operator?: string
}

interface Rule {
  id:          string
  name:        string
  channel:     string
  rule_phase:  RulePhase
  combinator:  LogicMode
  conditions:  Condition[]
  actions:     Action[]
  active:      boolean
  priority:    number
  valid_from?: string | null
  valid_to?:   string | null
  created_at:  string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELDS = [
  { value: 'title',           label: 'Title' },
  { value: 'description',     label: 'Description' },
  { value: 'price',           label: 'Price' },
  { value: 'sale_price',      label: 'Sale Price' },
  { value: 'brand',           label: 'Brand' },
  { value: 'condition',       label: 'Condition' },
  { value: 'category',        label: 'Category' },
  { value: 'sku',             label: 'SKU' },
  { value: 'barcode',         label: 'Barcode' },
  { value: 'weight',          label: 'Weight' },
  { value: 'material',        label: 'Material' },
  { value: 'color',           label: 'Color' },
  { value: 'size',            label: 'Size' },
  { value: 'images[0]',       label: 'Image URL' },
  { value: 'quantity',        label: 'Quantity' },
  { value: 'shipping_weight', label: 'Shipping Weight' },
]

const CONDITION_OPS: { value: ConditionOp; label: string }[] = [
  { value: 'contains',      label: 'contains' },
  { value: 'not_contains',  label: 'does not contain' },
  { value: 'equals',        label: 'equals' },
  { value: 'not_equals',    label: 'does not equal' },
  { value: 'starts_with',   label: 'starts with' },
  { value: 'ends_with',     label: 'ends with' },
  { value: 'is_empty',      label: 'is empty' },
  { value: 'is_not_empty',  label: 'is not empty' },
  { value: 'greater_than',  label: 'is greater than' },
  { value: 'less_than',     label: 'is less than' },
  { value: 'matches_regex', label: 'matches regex' },
]

const ACTION_TYPES: { value: ActionType; label: string; hint: string }[] = [
  { value: 'set_field',  label: 'Set field',      hint: 'Replace with a fixed value' },
  { value: 'template',   label: 'Template',        hint: 'Use {field} placeholders, e.g. {brand} {title}' },
  { value: 'append',     label: 'Append',          hint: 'Add text to end of field' },
  { value: 'prepend',    label: 'Prepend',         hint: 'Add text to start of field' },
  { value: 'truncate',   label: 'Truncate',        hint: 'Trim to max character length' },
  { value: 'replace',    label: 'Find & replace',  hint: 'Swap one string for another' },
  { value: 'map_value',  label: 'Map value',       hint: 'e.g. "New" → "new_with_tags"' },
  { value: 'calculate',  label: 'Calculate',       hint: 'e.g. price - 5%' },
  { value: 'strip_html', label: 'Strip HTML',      hint: 'Remove all HTML tags from field' },
  { value: 'uppercase',  label: 'Uppercase',       hint: 'Convert field to UPPERCASE' },
  { value: 'lowercase',  label: 'Lowercase',       hint: 'Convert field to lowercase' },
  { value: 'trim',       label: 'Trim whitespace', hint: 'Remove leading/trailing spaces' },
]

const CALC_OPERATORS = [
  { value: '+',  label: 'Add' },
  { value: '-',  label: 'Subtract' },
  { value: '*',  label: 'Multiply by' },
  { value: '/',  label: 'Divide by' },
  { value: '-%', label: 'Reduce by %' },
  { value: '+%', label: 'Increase by %' },
]

const CHANNELS = [
  { value: 'all',         label: 'All Channels' },
  { value: 'amazon',      label: 'Amazon' },
  { value: 'ebay',        label: 'eBay' },
  { value: 'etsy',        label: 'Etsy' },
  { value: 'shopify',     label: 'Shopify' },
  { value: 'tiktok_shop', label: 'TikTok Shop' },
]

const RULE_PHASES: { value: RulePhase; label: string; desc: string; color: string }[] = [
  { value: 'pre',      label: 'Pre-process',  desc: 'Strip HTML, trim, normalise — runs first always',       color: '#7c6fe0' },
  { value: 'business', label: 'Business',     desc: 'Conditional transformations — your core rules',         color: '#0f7b6c' },
  { value: 'post',     label: 'Post-process', desc: 'Char limits, final truncations — runs last always',     color: '#c05621' },
]

const CHANNEL_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  all:         { bg: P.raised, text: P.muted, dot: '#b8b8b5' },
  amazon:      { bg: '#fdf3e8', text: '#b7600a', dot: '#d9730d' },
  ebay:        { bg: '#fff0e6', text: '#c05621', dot: '#e07a38' },
  etsy:        { bg: P.emeraldSft, text: P.emerald, dot: P.emerald },
  shopify:     { bg: P.cobaltSft, text: P.cobaltDk, dot: P.cobalt },
  tiktok_shop: { bg: '#f0e8f8', text: '#6b3fa0', dot: '#8b5cf6' },
}

const SAMPLE_LISTING: Record<string, string> = {
  title:           'Nike Air Max 90 Mens Running Trainers White Black Size 10  New',
  description:     'Classic Nike Air Max 90 in white and black colourway. Perfect for everyday wear.',
  brand:           'Nike',
  category:        'Trainers',
  condition:       'New',
  price:           '89.99',
  sale_price:      '79.99',
  sku:             'NIKE-AM90-W-10',
  barcode:         '0191888735574',
  weight:          '0.8',
  material:        'Leather/Mesh',
  color:           'White/Black',
  size:            'UK 10',
  'images[0]':     'https://example.com/image.jpg',
  quantity:        '12',
  shipping_weight: '1.1',
}

// ─── Preview engine ───────────────────────────────────────────────────────────

function resolveTemplate(template: string, listing: Record<string, string>): string {
  return template.replace(/\{(\w+(?:\[\d+\])?)\}/g, (_, f) => listing[f] ?? '')
}

function applyRules(sample: Record<string, string>, rules: Rule[]): Record<string, string> {
  const out = { ...sample }

  const active = rules.filter(r => r.active)

  for (const phase of ['pre', 'business', 'post'] as RulePhase[]) {
    const phaseRules = active
      .filter(r => (r.rule_phase ?? 'business') === phase)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

    for (const rule of phaseRules) {
      const results = rule.conditions.map(c => {
        const v  = String(out[c.field] ?? '').toLowerCase()
        const cv = (c.value ?? '').toLowerCase()
        switch (c.op) {
          case 'contains':      return v.includes(cv)
          case 'not_contains':  return !v.includes(cv)
          case 'equals':        return v === cv
          case 'not_equals':    return v !== cv
          case 'starts_with':   return v.startsWith(cv)
          case 'ends_with':     return v.endsWith(cv)
          case 'is_empty':      return v === ''
          case 'is_not_empty':  return v !== ''
          case 'greater_than':  return parseFloat(v) > parseFloat(cv)
          case 'less_than':     return parseFloat(v) < parseFloat(cv)
          case 'matches_regex': try { return new RegExp(c.value, 'i').test(String(out[c.field] ?? '')) } catch { return false }
          default:              return true
        }
      })

      const passes = rule.conditions.length === 0 || (
        (rule.combinator ?? 'AND') === 'AND' ? results.every(Boolean) : results.some(Boolean)
      )
      if (!passes) continue

      for (const action of rule.actions) {
        const cur = String(out[action.field] ?? '')
        const resolvedVal = action.type === 'template' || action.type === 'set_field'
          ? resolveTemplate(action.value ?? '', out)
          : action.value ?? ''

        switch (action.type) {
          case 'set_field':  out[action.field] = resolvedVal; break
          case 'template':   out[action.field] = resolvedVal; break
          case 'append':     out[action.field] = cur + resolveTemplate(resolvedVal, out); break
          case 'prepend':    out[action.field] = resolveTemplate(resolvedVal, out) + cur; break
          case 'truncate':   out[action.field] = cur.slice(0, parseInt(action.value) || cur.length); break
          case 'replace':    out[action.field] = cur.split(action.from ?? '').join(action.to ?? ''); break
          case 'map_value':  if (cur === action.from) out[action.field] = action.to ?? ''; break
          case 'strip_html': out[action.field] = cur.replace(/<[^>]*>/g, ''); break
          case 'uppercase':  out[action.field] = cur.toUpperCase(); break
          case 'lowercase':  out[action.field] = cur.toLowerCase(); break
          case 'trim':       out[action.field] = cur.trim(); break
          case 'calculate': {
            const num = parseFloat(cur)
            const val = parseFloat(action.value)
            if (!isNaN(num) && !isNaN(val)) {
              switch (action.operator) {
                case '+':  out[action.field] = String(Math.round((num + val)            * 100) / 100); break
                case '-':  out[action.field] = String(Math.round((num - val)            * 100) / 100); break
                case '*':  out[action.field] = String(Math.round(num * val              * 100) / 100); break
                case '/':  out[action.field] = val !== 0 ? String(Math.round(num / val  * 100) / 100) : cur; break
                case '-%': out[action.field] = String(Math.round(num * (1 - val / 100) * 100) / 100); break
                case '+%': out[action.field] = String(Math.round(num * (1 + val / 100) * 100) / 100); break
              }
            }
            break
          }
        }
      }
    }
  }
  return out
}

// ─── Blank builders ───────────────────────────────────────────────────────────

const blankCondition = (): Condition => ({ field: 'title', op: 'contains', value: '' })
const blankAction    = (): Action    => ({ type: 'set_field', field: 'title', value: '', operator: '-' })

// ─── Shared primitive components ──────────────────────────────────────────────

function Sel({ value, onChange, options, style }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  style?: React.CSSProperties
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '6px 28px 6px 10px',
        border: '1px solid #e8e8e5',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#191919',
        background: 'white url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M1 1l4 4 4-4\' stroke=\'%23b8b8b5\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E") no-repeat right 8px center',
        appearance: 'none',
        WebkitAppearance: 'none',
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Inp({ value, onChange, placeholder, style, type }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
  type?: string
}) {
  return (
    <input
      type={type ?? 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '6px 10px',
        border: '1px solid #e8e8e5',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#191919',
        background: 'white',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36, height: 20,
        background: active ? '#0f7b6c' : '#e0e0db',
        borderRadius: 10, position: 'relative',
        cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: active ? 18 : 2, width: 16, height: 16,
        background: 'white', borderRadius: '50%',
        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#9b9b98',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #ededea',
    }}>
      {children}
    </div>
  )
}

// ─── Phase badge ──────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: RulePhase }) {
  const p = RULE_PHASES.find(x => x.value === phase) ?? RULE_PHASES[1]
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 4,
      background: p.color + '18',
      color: p.color,
      letterSpacing: '0.03em',
    }}>
      {p.label}
    </span>
  )
}

// ─── Condition row ────────────────────────────────────────────────────────────

function ConditionRow({ cond, onChange, onDelete, showDelete }: {
  cond: Condition; onChange: (c: Condition) => void; onDelete: () => void; showDelete: boolean
}) {
  const noValueOps = ['is_empty', 'is_not_empty']
  return (
    <div style={{
      background: 'white', border: '1px solid #e8e8e5',
      borderRadius: 8, padding: 12, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Sel value={cond.field} onChange={v => onChange({ ...cond, field: v })} options={FIELDS} style={{ flex: 1 }} />
          {showDelete && (
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#c9c9c5', cursor: 'pointer', fontSize: 14, padding: '2px 4px', lineHeight: 1, borderRadius: 4, flexShrink: 0 }} title="Remove condition">×</button>
          )}
        </div>
        <Sel value={cond.op} onChange={v => onChange({ ...cond, op: v as ConditionOp })} options={CONDITION_OPS} style={{ width: '100%' }} />
        {!noValueOps.includes(cond.op) && (
          <Inp value={cond.value} onChange={v => onChange({ ...cond, value: v })} placeholder="value…" />
        )}
      </div>
    </div>
  )
}

// ─── Action row ───────────────────────────────────────────────────────────────

function ActionRow({ action, onChange, onDelete, showDelete }: {
  action: Action; onChange: (a: Action) => void; onDelete: () => void; showDelete: boolean
}) {
  const needsFromTo  = action.type === 'replace' || action.type === 'map_value'
  const needsCalc    = action.type === 'calculate'
  const isTemplate   = action.type === 'template'
  const noValue      = ['strip_html', 'uppercase', 'lowercase', 'trim'].includes(action.type)

  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Sel value={action.type} onChange={v => onChange({ ...action, type: v as ActionType })} options={ACTION_TYPES.map(t => ({ value: t.value, label: t.label }))} style={{ flex: 1 }} />
          {showDelete && (
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#c9c9c5', cursor: 'pointer', fontSize: 14, padding: '2px 4px', lineHeight: 1, borderRadius: 4, flexShrink: 0 }} title="Remove action">×</button>
          )}
        </div>
        <Sel value={action.field} onChange={v => onChange({ ...action, field: v })} options={FIELDS} style={{ width: '100%' }} />
        {isTemplate ? (
          <div>
            <textarea
              value={action.value}
              onChange={e => onChange({ ...action, value: e.target.value })}
              placeholder="{brand} {title} - Free  Delivery"
              rows={2}
              style={{
                width: '100%', padding: '6px 10px', border: '1px solid #e8e8e5',
                borderRadius: 6, fontSize: 12, fontFamily: 'Inter, monospace',
                color: '#191919', background: 'white', outline: 'none',
                resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5,
              }}
            />
            <div style={{ fontSize: 10, color: '#b8b8b5', marginTop: 4 }}>
              Use {'{'}<span style={{ color: '#7c6fe0' }}>field_name</span>{'}'} — e.g. {'{brand}'} {'{title}'} {'{color}'}
            </div>
          </div>
        ) : needsCalc ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <Sel value={action.operator ?? '-'} onChange={v => onChange({ ...action, operator: v })} options={CALC_OPERATORS} style={{ flex: 1 }} />
            <Inp value={action.value} onChange={v => onChange({ ...action, value: v })} placeholder="amount…" style={{ flex: 1 }} />
          </div>
        ) : needsFromTo ? (
          <>
            <Inp value={action.from ?? ''} onChange={v => onChange({ ...action, from: v })} placeholder={action.type === 'map_value' ? 'match value…' : 'find…'} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: '#b8b8b5', flexShrink: 0 }}>→</div>
              <Inp value={action.to ?? ''} onChange={v => onChange({ ...action, to: v })} placeholder="replace with…" />
            </div>
          </>
        ) : noValue ? (
          <div style={{ fontSize: 11, color: '#b8b8b5', fontStyle: 'italic', paddingLeft: 2 }}>
            {ACTION_TYPES.find(t => t.value === action.type)?.hint}
          </div>
        ) : (
          <Inp value={action.value} onChange={v => onChange({ ...action, value: v })} placeholder={action.type === 'truncate' ? 'max chars (e.g. 80)…' : 'value…'} />
        )}
      </div>
    </div>
  )
}

// ─── Channel badge ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: string }) {
  const colors = CHANNEL_COLOR[channel] ?? CHANNEL_COLOR.all
  const label  = CHANNELS.find(c => c.value === channel)?.label ?? channel
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: colors.bg, color: colors.text,
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: '2px',
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.dot, flexShrink: 0, display: 'inline-block' }} />
      {label}
    </span>
  )
}

// ─── Rule table row ───────────────────────────────────────────────────────────

function RuleRow({ rule, idx, onEdit, onDelete, onToggle }: {
  rule: Rule; idx: number; onEdit: () => void; onDelete: () => void; onToggle: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isScheduled = rule.valid_from || rule.valid_to
  const now = new Date()
  const scheduledActive = isScheduled
    ? (!rule.valid_from || new Date(rule.valid_from) <= now) && (!rule.valid_to || new Date(rule.valid_to) >= now)
    : true

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? '#fafaf8' : 'white', transition: 'background 0.1s', opacity: rule.active ? 1 : 0.55 }}
    >
      <td style={{ padding: '14px 16px', width: 60, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ color: '#c9c9c5', cursor: 'grab' }}>
            <rect x="0" y="1" width="4" height="2" rx="1" fill="currentColor"/>
            <rect x="6" y="1" width="4" height="2" rx="1" fill="currentColor"/>
            <rect x="0" y="6" width="4" height="2" rx="1" fill="currentColor"/>
            <rect x="6" y="6" width="4" height="2" rx="1" fill="currentColor"/>
            <rect x="0" y="11" width="4" height="2" rx="1" fill="currentColor"/>
            <rect x="6" y="11" width="4" height="2" rx="1" fill="currentColor"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#9b9b98' }}>{idx + 1}</span>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>{rule.name}</span>
          {isScheduled && (
            <span title={`${rule.valid_from ? 'From: ' + rule.valid_from.slice(0,10) : ''}${rule.valid_to ? ' To: ' + rule.valid_to.slice(0,10) : ''}`} style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: scheduledActive ? '#e8f5f3' : '#fef3e0',
              color: scheduledActive ? '#0f7b6c' : '#9b6800',
              fontWeight: 600,
            }}>
              {scheduledActive ? '⏱ Active' : '⏱ Scheduled'}
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}><PhaseBadge phase={rule.rule_phase ?? 'business'} /></td>
      <td style={{ padding: '14px 16px' }}><ChannelBadge channel={rule.channel} /></td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 12, color: '#787774', background: '#f5f3ef', padding: '3px 8px', borderRadius: 5 }}>
          {rule.conditions.length === 0 ? 'Always' : `${rule.conditions.length} cond. (${rule.combinator ?? 'AND'})`}
        </span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 12, color: '#787774', background: '#f5f3ef', padding: '3px 8px', borderRadius: 5 }}>
          {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
        </span>
      </td>
      <td style={{ padding: '14px 16px' }}><Toggle active={rule.active} onChange={onToggle} /></td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ background: '#f1f1ef', color: '#191919', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>Edit</button>
          <button onClick={onDelete} style={{ background: 'none', color: '#b8b8b5', border: '1px solid #e8e8e5', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', lineHeight: 1 }} title="Delete rule">×</button>
        </div>
      </td>
    </tr>
  )
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({ conditions, actions, combinator }: {
  conditions: Condition[]; actions: Action[]; combinator: LogicMode
}) {
  const draftRule: Rule = {
    id: '__draft__', name: 'Draft', channel: 'all',
    rule_phase: 'business', combinator,
    conditions: conditions.filter(c => c.value || c.op === 'is_empty' || c.op === 'is_not_empty'),
    actions:    actions.filter(a => a.value || a.type === 'truncate' || a.from || ['strip_html','uppercase','lowercase','trim'].includes(a.type)),
    active: true, priority: 0, created_at: '',
  }

  const previewOut = applyRules(SAMPLE_LISTING, [draftRule])
  const changedFields = Object.keys(SAMPLE_LISTING).filter(f => previewOut[f] !== SAMPLE_LISTING[f])

  const conditionResults = draftRule.conditions.map(c => {
    const v  = String(SAMPLE_LISTING[c.field] ?? '').toLowerCase()
    const cv = c.value.toLowerCase()
    switch (c.op) {
      case 'contains':      return v.includes(cv)
      case 'not_contains':  return !v.includes(cv)
      case 'equals':        return v === cv
      case 'not_equals':    return v !== cv
      case 'starts_with':   return v.startsWith(cv)
      case 'ends_with':     return v.endsWith(cv)
      case 'is_empty':      return v === ''
      case 'is_not_empty':  return v !== ''
      case 'greater_than':  return parseFloat(v) > parseFloat(cv)
      case 'less_than':     return parseFloat(v) < parseFloat(cv)
      case 'matches_regex': try { return new RegExp(c.value, 'i').test(String(SAMPLE_LISTING[c.field] ?? '')) } catch { return false }
      default:              return true
    }
  })

  const conditionMatches = draftRule.conditions.length === 0 || (
    combinator === 'AND' ? conditionResults.every(Boolean) : conditionResults.some(Boolean)
  )

  const affectedFields  = actions.filter(a => a.field && (a.value || a.from || ['strip_html','uppercase','lowercase','trim'].includes(a.type))).map(a => a.field)
  const displayFields   = affectedFields.length > 0 ? [...new Set(affectedFields)] : ['title', 'price', 'brand', 'condition']

  return (
    <div style={{ marginTop: 24, border: '1px solid #e8e8e5', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
      <div style={{ padding: '12px 16px', background: '#f5f3ef', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#787774', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live Preview — Sample Product</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: conditionMatches ? '#0f7b6c' : '#e3b341', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: conditionMatches ? '#0f7b6c' : '#9b9b98', fontWeight: 500 }}>
            {draftRule.conditions.length === 0 ? 'Always applies' : conditionMatches ? `Conditions match (${combinator})` : `No match (${combinator})`}
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #f1f1ef' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#b8b8b5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Before</div>
          {displayFields.map(f => (
            <div key={f} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#b8b8b5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{f}</div>
              <div style={{ fontSize: 12, color: '#9b9b98', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: changedFields.includes(f) && conditionMatches ? 'line-through' : 'none' }}>
                {SAMPLE_LISTING[f] || <span style={{ color: '#d0d0cc', fontStyle: 'italic' }}>empty</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#b8b8b5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>After</div>
          {displayFields.map(f => {
            const changed = changedFields.includes(f) && conditionMatches
            return (
              <div key={f} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#b8b8b5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{f}</div>
                <div style={{ fontSize: 12, color: changed ? '#0f7b6c' : '#9b9b98', fontWeight: changed ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: changed ? '#e8f5f3' : 'transparent', padding: changed ? '2px 6px' : '2px 0', borderRadius: changed ? 4 : 0, display: 'inline-block', maxWidth: '100%' }}>
                  {conditionMatches ? (previewOut[f] || <span style={{ color: '#d0d0cc', fontStyle: 'italic' }}>empty</span>) : (SAMPLE_LISTING[f] || <span style={{ color: '#d0d0cc', fontStyle: 'italic' }}>empty</span>)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── 3-Column Rule Editor ─────────────────────────────────────────────────────

function RuleEditor({
  editId, initialName, initialChannel, initialPhase, initialCombinator,
  initialPriority, initialActive, initialConditions, initialActions,
  initialValidFrom, initialValidTo, saving, onSave, onCancel,
}: {
  editId: string | null
  initialName: string
  initialChannel: string
  initialPhase: RulePhase
  initialCombinator: LogicMode
  initialPriority: number
  initialActive: boolean
  initialConditions: Condition[]
  initialActions: Action[]
  initialValidFrom: string
  initialValidTo: string
  saving: boolean
  onSave: (data: {
    name: string; channel: string; rule_phase: RulePhase; combinator: LogicMode
    priority: number; active: boolean; conditions: Condition[]; actions: Action[]
    valid_from: string | null; valid_to: string | null
  }) => void
  onCancel: () => void
}) {
  const [name,       setName]       = useState(initialName)
  const [channel,    setChannel]    = useState(initialChannel)
  const [phase,      setPhase]      = useState<RulePhase>(initialPhase)
  const [combinator, setCombinator] = useState<LogicMode>(initialCombinator)
  const [priority,   setPriority]   = useState(initialPriority)
  const [active,     setActive]     = useState(initialActive)
  const [validFrom,  setValidFrom]  = useState(initialValidFrom)
  const [validTo,    setValidTo]    = useState(initialValidTo)
  const [conditions, setConditions] = useState<Condition[]>(initialConditions.length ? initialConditions : [blankCondition()])
  const [actions,    setActions]    = useState<Action[]>(initialActions.length ? initialActions : [blankAction()])

  const updateCondition = useCallback((idx: number, c: Condition) => setConditions(prev => prev.map((x, i) => i === idx ? c : x)), [])
  const deleteCondition = useCallback((idx: number) => setConditions(prev => prev.filter((_, i) => i !== idx)), [])
  const updateAction    = useCallback((idx: number, a: Action)    => setActions(prev => prev.map((x, i) => i === idx ? a : x)), [])
  const deleteAction    = useCallback((idx: number) => setActions(prev => prev.filter((_, i) => i !== idx)), [])

  const addBtnStyle: React.CSSProperties = {
    background: 'none', border: '1px dashed #d5d5d0', borderRadius: 6,
    padding: '7px 12px', fontSize: 12, color: '#9b9b98', cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif', width: '100%', textAlign: 'left',
  }

  const selectedPhase = RULE_PHASES.find(p => p.value === phase)!

  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 12, marginBottom: 28, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '14px 20px', background: '#f5f3ef', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#787774' }}>{editId ? 'Edit Rule' : 'New Rule'}</span>
          <PhaseBadge phase={phase} />
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#9b9b98', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 1fr', minHeight: 380 }}>

        {/* ── LEFT: Conditions ── */}
        <div style={{ padding: 20, borderRight: '1px solid #ededea' }}>
          <ColHeader>IF — Conditions</ColHeader>

          {conditions.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#9b9b98' }}>Match</span>
              {(['AND', 'OR'] as LogicMode[]).map(mode => (
                <button key={mode} onClick={() => setCombinator(mode)} style={{
                  padding: '3px 10px', borderRadius: 5, border: '1px solid',
                  borderColor: combinator === mode ? '#191919' : '#e8e8e5',
                  background: combinator === mode ? '#191919' : 'white',
                  color: combinator === mode ? 'white' : '#787774',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, -apple-system, sans-serif', transition: 'all 0.1s',
                }}>
                  {mode}
                </button>
              ))}
              <span style={{ fontSize: 11, color: '#9b9b98' }}>conditions</span>
            </div>
          )}

          {conditions.map((c, i) => (
            <div key={i}>
              {i > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#c9c9c5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
                  {combinator}
                </div>
              )}
              <ConditionRow cond={c} onChange={nc => updateCondition(i, nc)} onDelete={() => deleteCondition(i)} showDelete={conditions.length > 1} />
            </div>
          ))}

          <button onClick={() => setConditions(prev => [...prev, blankCondition()])} style={addBtnStyle}>+ Add condition</button>
        </div>

        {/* ── MIDDLE: Rule settings ── */}
        <div style={{ padding: 20, background: '#f9f9f7', borderRight: '1px solid #ededea', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <ColHeader>Rule Settings</ColHeader>

            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Name</label>
              <textarea value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Truncate eBay titles to 80 chars" rows={2}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e8e8e5', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif', color: '#191919', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
            </div>

            {/* Phase */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Phase</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {RULE_PHASES.map(p => (
                  <button key={p.value} onClick={() => setPhase(p.value)} style={{
                    padding: '7px 10px', border: '1px solid', textAlign: 'left',
                    borderColor: phase === p.value ? p.color : '#e8e8e5',
                    background: phase === p.value ? p.color + '12' : 'white',
                    borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
                    transition: 'all 0.1s',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: phase === p.value ? p.color : '#787774' }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: '#b8b8b5', marginTop: 1, lineHeight: 1.3 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Channel */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Channel</label>
              <Sel value={channel} onChange={setChannel} options={CHANNELS} style={{ width: '100%' }} />
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Schedule (optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#b8b8b5', marginBottom: 2 }}>Active from</div>
                  <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', border: '1px solid #e8e8e5', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif', color: validFrom ? '#191919' : '#b8b8b5', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#b8b8b5', marginBottom: 2 }}>Active until</div>
                  <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', border: '1px solid #e8e8e5', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif', color: validTo ? '#191919' : '#b8b8b5', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Priority</label>
              <input type="number" min={1} value={priority} onChange={e => setPriority(parseInt(e.target.value) || 1)}
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #e8e8e5', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif', color: '#191919', background: 'white', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</label>
              <Toggle active={active} onChange={() => setActive(v => !v)} />
            </div>
          </div>

          {/* Save / Cancel */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => onSave({
                name, channel, rule_phase: phase, combinator, priority, active,
                conditions, actions,
                valid_from: validFrom ? new Date(validFrom).toISOString() : null,
                valid_to:   validTo   ? new Date(validTo).toISOString()   : null,
              })}
              disabled={saving}
              style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : editId ? 'Update rule' : 'Save rule'}
            </button>
            <button onClick={onCancel} style={{ background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: 7, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── RIGHT: Actions ── */}
        <div style={{ padding: 20 }}>
          <ColHeader>THEN — Actions</ColHeader>
          {actions.map((a, i) => (
            <ActionRow key={i} action={a} onChange={na => updateAction(i, na)} onDelete={() => deleteAction(i)} showDelete={actions.length > 1} />
          ))}
          <button onClick={() => setActions(prev => [...prev, blankAction()])} style={addBtnStyle}>+ Add action</button>
        </div>
      </div>

      {/* Live Preview */}
      <div style={{ padding: '0 20px 20px' }}>
        <PreviewPanel conditions={conditions} actions={actions} combinator={combinator} />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RulesPage() {
  const router = useRouter()
  const [rules,     setRules]     = useState<Rule[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [editRule,  setEditRule]  = useState<Rule | null>(null)
  const [tabFilter, setTabFilter] = useState('all')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    fetch('/api/rules')
      .then(r => r.json())
      .then(d => setRules(d.rules ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openNew()  { setEditRule(null); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function openEdit(rule: Rule) { setEditRule(rule); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancelForm() { setShowForm(false); setEditRule(null) }

  async function handleSave(data: {
    name: string; channel: string; rule_phase: RulePhase; combinator: LogicMode
    priority: number; active: boolean; conditions: Condition[]; actions: Action[]
    valid_from: string | null; valid_to: string | null
  }) {
    if (!data.name.trim()) { showToast('Rule name is required'); return }
    setSaving(true)
    try {
      const body = {
        name:        data.name,
        channel:     data.channel,
        rule_phase:  data.rule_phase,
        combinator:  data.combinator,
        priority:    data.priority,
        active:      data.active,
        valid_from:  data.valid_from,
        valid_to:    data.valid_to,
        conditions:  data.conditions.filter(c => c.value || c.op === 'is_empty' || c.op === 'is_not_empty'),
        actions:     data.actions.filter(a => a.value || a.from || ['strip_html','uppercase','lowercase','trim','truncate'].includes(a.type)),
      }
      const res  = await fetch('/api/rules', {
        method:  editRule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(editRule ? { id: editRule.id, ...body } : body),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Failed to save'); return }

      if (editRule) {
        setRules(prev => prev.map(r => r.id === editRule.id ? json.rule : r))
        showToast('Rule updated')
      } else {
        setRules(prev => [...prev, json.rule])
        showToast('Rule created')
      }
      cancelForm()
    } catch (err: any) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(rule: Rule) {
    const res  = await fetch('/api/rules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rule.id, active: !rule.active }) })
    const json = await res.json()
    if (res.ok) setRules(prev => prev.map(r => r.id === rule.id ? json.rule : r))
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return
    const res = await fetch('/api/rules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setRules(prev => prev.filter(r => r.id !== id))
    else showToast('Delete failed')
  }

  const filteredRules = tabFilter === 'all' ? rules : rules.filter(r => r.channel === tabFilter)

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '2px', border: 'none',
    background: tabFilter === tab ? P.ink : 'transparent',
    color: tabFilter === tab ? P.bg : P.muted,
    fontSize: 12, fontWeight: tabFilter === tab ? 600 : 400,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
    letterSpacing: '0.02em',
  })

  // Phase stats
  const phaseCounts = { pre: 0, business: 0, post: 0 }
  rules.forEach(r => { phaseCounts[r.rule_phase ?? 'business']++ })

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: P.bg, WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '11px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ ...SECTION_HEADER, marginBottom: 6 }}>TRANSFORMATION</div>
            <h1 style={{ ...HEADING, fontSize: 28, fontWeight: 400, color: P.ink, letterSpacing: '-0.02em', margin: 0, marginBottom: 4 }}>Feed Rules</h1>
            <p style={{ fontSize: 13, color: P.muted, margin: 0 }}>Transform your product data before it reaches each channel</p>
          </div>
          {!showForm && (
            <button onClick={openNew} style={{ ...BTN_PRIMARY, borderRadius: '2px', padding: '10px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 400, lineHeight: 1 }}>+</span> New Rule
            </button>
          )}
        </div>

        {/* Phase overview strip */}
        {!showForm && rules.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {RULE_PHASES.map(p => (
              <div key={p.value} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#191919' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#9b9b98', marginTop: 1 }}>{p.desc.split('—')[0].trim()}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: p.color }}>{phaseCounts[p.value]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Rule Editor */}
        {showForm && (
          <RuleEditor
            editId={editRule?.id ?? null}
            initialName={editRule?.name ?? ''}
            initialChannel={editRule?.channel ?? 'all'}
            initialPhase={editRule?.rule_phase ?? 'business'}
            initialCombinator={editRule?.combinator ?? 'AND'}
            initialPriority={editRule?.priority ?? rules.length + 1}
            initialActive={editRule?.active ?? true}
            initialConditions={editRule?.conditions ?? []}
            initialActions={editRule?.actions ?? []}
            initialValidFrom={editRule?.valid_from ? editRule.valid_from.slice(0, 10) : ''}
            initialValidTo={editRule?.valid_to ? editRule.valid_to.slice(0, 10) : ''}
            saving={saving}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        )}

        {/* Channel filter tabs */}
        {!showForm && (
          <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: P.raised, padding: 3, borderRadius: '2px', width: 'fit-content' }}>
            {[{ value: 'all', label: 'All' }, { value: 'amazon', label: 'Amazon' }, { value: 'ebay', label: 'eBay' }, { value: 'etsy', label: 'Etsy' }, { value: 'shopify', label: 'Shopify' }, { value: 'tiktok_shop', label: 'TikTok' }].map(tab => (
              <button key={tab.value} onClick={() => setTabFilter(tab.value)} style={tabStyle(tab.value)}>
                {tab.label}
                <span style={{ marginLeft: 5, fontSize: 10, color: tabFilter === tab.value ? 'rgba(255,255,255,0.65)' : P.muted, fontWeight: 500 }}>
                  {tab.value === 'all' ? rules.length : rules.filter(r => r.channel === tab.value).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Rules list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#b8b8b5', fontSize: 14 }}>Loading…</div>
        ) : !showForm && rules.length === 0 ? (
          <div style={{ ...CARD, padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ ...MONO, fontSize: 28, marginBottom: 16, color: P.muted }}>{'{ }'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: P.ink, marginBottom: 8 }}>No feed rules yet</div>
            <div style={{ fontSize: 13, color: P.muted, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
              Feed rules transform your product data before it reaches each channel. Truncate titles, remap categories, adjust prices, generate bullet points.
            </div>
            <button onClick={openNew} style={{ ...BTN_PRIMARY, padding: '10px 20px', fontSize: 13 }}>
              Create your first rule
            </button>
          </div>
        ) : !showForm && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f7', borderBottom: '1px solid #ededea' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em', width: 60 }}>#</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Name</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Phase</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Channel</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Conditions</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Actions</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active</th>
                  <th style={{ padding: '10px 16px', width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule, idx) => (
                  <React.Fragment key={rule.id}>
                    <RuleRow rule={rule} idx={idx} onEdit={() => openEdit(rule)} onDelete={() => deleteRule(rule.id)} onToggle={() => toggleActive(rule)} />
                    {idx < filteredRules.length - 1 && (
                      <tr><td colSpan={8} style={{ padding: 0, borderBottom: '1px solid #f1f1ef' }} /></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
