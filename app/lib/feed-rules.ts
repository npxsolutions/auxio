// ── Feed Rule Engine ──────────────────────────────────────────────────────────
// Evaluates conditions and applies actions to a listing object before publish.
// Schema mirrors feed_rules.conditions (jsonb) and feed_rules.actions (jsonb).

type ConditionOp =
  | 'contains' | 'not_contains' | 'equals' | 'not_equals'
  | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than' | 'matches_regex'

interface Condition {
  field: string
  op:    ConditionOp
  value: string
}

interface Action {
  type:      string
  field:     string
  value:     string
  from?:     string
  to?:       string
  operator?: string
}

export interface FeedRule {
  id:         string
  conditions: Condition[]
  actions:    Action[]
  active:     boolean
  priority:   number
  channel:    string
}

export interface FieldMapping {
  source_field: string
  target_field: string
  transform?:   string | null
  template?:    string | null
}

// ── Field accessors ────────────────────────────────────────────────────────────

function getField(listing: Record<string, any>, field: string): string {
  if (field.startsWith('images[')) {
    const idx = parseInt(field.slice(7, -1)) || 0
    return String(listing.images?.[idx] ?? '')
  }
  return String(listing[field] ?? '')
}

const NUMERIC_FIELDS = new Set(['price', 'compare_price', 'cost_price', 'quantity', 'weight_grams'])

function setField(listing: Record<string, any>, field: string, value: string): void {
  if (field.startsWith('images[')) {
    const idx = parseInt(field.slice(7, -1)) || 0
    if (!Array.isArray(listing.images)) listing.images = []
    listing.images[idx] = value
    return
  }
  if (NUMERIC_FIELDS.has(field)) {
    const n = parseFloat(value)
    listing[field] = isNaN(n) ? listing[field] : n
    return
  }
  listing[field] = value
}

// ── Condition evaluator ────────────────────────────────────────────────────────

function evaluateCondition(listing: Record<string, any>, c: Condition): boolean {
  const v  = getField(listing, c.field).toLowerCase()
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
    case 'matches_regex': {
      try { return new RegExp(c.value, 'i').test(getField(listing, c.field)) } catch { return false }
    }
    default: return true
  }
}

// ── Action applicator ──────────────────────────────────────────────────────────

function applyAction(listing: Record<string, any>, action: Action): void {
  const cur = getField(listing, action.field)

  switch (action.type) {
    case 'set_field': setField(listing, action.field, action.value); break
    case 'append':    setField(listing, action.field, cur + action.value); break
    case 'prepend':   setField(listing, action.field, action.value + cur); break
    case 'truncate':  setField(listing, action.field, cur.slice(0, parseInt(action.value) || cur.length)); break
    case 'replace':   setField(listing, action.field, cur.split(action.from ?? '').join(action.to ?? '')); break
    case 'map_value': if (cur === action.from) setField(listing, action.field, action.to ?? ''); break
    case 'calculate': {
      const num = parseFloat(cur)
      const val = parseFloat(action.value)
      if (!isNaN(num) && !isNaN(val)) {
        let result: number
        switch (action.operator) {
          case '+':  result = Math.round((num + val)                   * 100) / 100; break
          case '-':  result = Math.round((num - val)                   * 100) / 100; break
          case '*':  result = Math.round(num * val                     * 100) / 100; break
          case '/':  result = val !== 0 ? Math.round(num / val        * 100) / 100 : num; break
          case '-%': result = Math.round(num * (1 - val / 100)        * 100) / 100; break
          case '+%': result = Math.round(num * (1 + val / 100)        * 100) / 100; break
          default:   return
        }
        setField(listing, action.field, String(result))
      }
      break
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Apply feed rules to a listing before publishing.
 * Rules targeting 'all' or the specific channelType are applied in priority order.
 * Returns a shallow clone — the original listing is not mutated.
 */
export function applyFeedRules(
  listing: Record<string, any>,
  rules: FeedRule[],
  channelType: string
): Record<string, any> {
  const out = { ...listing, images: [...(listing.images || [])] }

  const applicable = rules
    .filter(r => r.active && (r.channel === 'all' || r.channel === channelType))
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  for (const rule of applicable) {
    const passes =
      rule.conditions.length === 0 ||
      rule.conditions.every(c => evaluateCondition(out, c))

    if (!passes) continue
    for (const action of rule.actions) applyAction(out, action)
  }

  return out
}

/**
 * Apply field mappings — remaps source → target fields with optional transform or template.
 * Templates support {{field_name}} placeholders resolved against the original listing.
 * Returns a shallow clone — the original listing is not mutated.
 */
export function applyFieldMappings(
  listing: Record<string, any>,
  mappings: FieldMapping[]
): Record<string, any> {
  const out = { ...listing }

  for (const m of mappings) {
    const sourceVal = String(listing[m.source_field] ?? '')

    if (m.template) {
      out[m.target_field] = m.template.replace(
        /\{\{(\w+)\}\}/g,
        (_: string, f: string) => String(listing[f] ?? '')
      )
    } else if (m.transform) {
      switch (m.transform) {
        case 'uppercase':  out[m.target_field] = sourceVal.toUpperCase(); break
        case 'lowercase':  out[m.target_field] = sourceVal.toLowerCase(); break
        case 'trim':       out[m.target_field] = sourceVal.trim(); break
        case 'capitalize': out[m.target_field] = sourceVal.charAt(0).toUpperCase() + sourceVal.slice(1).toLowerCase(); break
        case 'strip_html': out[m.target_field] = sourceVal.replace(/<[^>]*>/g, ''); break
        default:           out[m.target_field] = sourceVal
      }
    } else {
      out[m.target_field] = sourceVal
    }
  }

  return out
}
