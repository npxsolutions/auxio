// ── Feed Rule Engine — Feedonomics-parity ────────────────────────────────────
// Three-phase execution: pre → business → post
// AND/OR condition combinators
// Scheduled activation via valid_from / valid_to
// Template expressions: {field} placeholders in any action value
// Lookup table actions via lookup_table_id

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
  type:             string
  field:            string
  value:            string
  from?:            string
  to?:              string
  operator?:        string
  lookup_table_id?: string   // for lookup_table action type
}

export interface FeedRule {
  id:          string
  conditions:  Condition[]
  actions:     Action[]
  active:      boolean
  priority:    number
  channel:     string
  rule_phase:  'pre' | 'business' | 'post'
  combinator:  'AND' | 'OR'
  valid_from?: string | null
  valid_to?:   string | null
}

export interface FieldMapping {
  source_field: string
  target_field: string
  transform?:   string | null
  template?:    string | null
}

export interface LookupRow {
  match_value:  string
  output_value: string
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

// ── Template expression resolver ───────────────────────────────────────────────
// Resolves {field} placeholders in a template string against the current listing.
// e.g. "{brand} {title} - Free UK Delivery" → "Nike Air Max - Free UK Delivery"

function resolveTemplate(template: string, listing: Record<string, any>): string {
  return template.replace(/\{(\w+(?:\[\d+\])?)\}/g, (_, f) => getField(listing, f))
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

function conditionsPass(
  listing: Record<string, any>,
  conditions: Condition[],
  combinator: 'AND' | 'OR'
): boolean {
  if (conditions.length === 0) return true
  const results = conditions.map(c => evaluateCondition(listing, c))
  return combinator === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

// ── Action applicator ──────────────────────────────────────────────────────────

function applyAction(
  listing: Record<string, any>,
  action: Action,
  lookupRows?: LookupRow[]
): void {
  const cur = getField(listing, action.field)

  // Resolve {field} template placeholders in value for all action types
  const resolvedValue = resolveTemplate(action.value ?? '', listing)

  switch (action.type) {
    case 'set_field':  setField(listing, action.field, resolvedValue); break
    case 'template':   setField(listing, action.field, resolvedValue); break   // explicit template type
    case 'append':     setField(listing, action.field, cur + resolvedValue); break
    case 'prepend':    setField(listing, action.field, resolvedValue + cur); break
    case 'truncate':   setField(listing, action.field, cur.slice(0, parseInt(action.value) || cur.length)); break
    case 'replace':    setField(listing, action.field, cur.split(action.from ?? '').join(action.to ?? '')); break
    case 'map_value':  if (cur === action.from) setField(listing, action.field, action.to ?? ''); break
    case 'strip_html': setField(listing, action.field, cur.replace(/<[^>]*>/g, '')); break
    case 'uppercase':  setField(listing, action.field, cur.toUpperCase()); break
    case 'lowercase':  setField(listing, action.field, cur.toLowerCase()); break
    case 'trim':       setField(listing, action.field, cur.trim()); break

    case 'lookup_table': {
      if (lookupRows?.length) {
        const match = lookupRows.find(r => r.match_value === cur)
        if (match) setField(listing, action.field, match.output_value)
      }
      break
    }

    case 'calculate': {
      const num = parseFloat(cur)
      const val = parseFloat(action.value)
      if (!isNaN(num) && !isNaN(val)) {
        let result: number
        switch (action.operator) {
          case '+':  result = Math.round((num + val)              * 100) / 100; break
          case '-':  result = Math.round((num - val)              * 100) / 100; break
          case '*':  result = Math.round(num * val                * 100) / 100; break
          case '/':  result = val !== 0 ? Math.round(num / val   * 100) / 100 : num; break
          case '-%': result = Math.round(num * (1 - val / 100)   * 100) / 100; break
          case '+%': result = Math.round(num * (1 + val / 100)   * 100) / 100; break
          default:   return
        }
        setField(listing, action.field, String(result))
      }
      break
    }
  }
}

// ── Scheduling check ───────────────────────────────────────────────────────────

function isScheduledActive(rule: FeedRule, now: Date): boolean {
  if (rule.valid_from && new Date(rule.valid_from) > now) return false
  if (rule.valid_to   && new Date(rule.valid_to)   < now) return false
  return true
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Apply feed rules to a listing in three phases (pre → business → post).
 * Rules are filtered by: active, channel scope, scheduled window.
 * Conditions are evaluated with the rule's own AND/OR combinator.
 * Template expressions ({field}) are resolved in all action values.
 *
 * Returns a shallow clone — the original listing is not mutated.
 *
 * @param lookupMap  Optional pre-fetched lookup table rows keyed by table_id
 */
export function applyFeedRules(
  listing: Record<string, any>,
  rules: FeedRule[],
  channelType: string,
  lookupMap: Record<string, LookupRow[]> = {}
): Record<string, any> {
  const out = { ...listing, images: [...(listing.images || [])] }
  const now = new Date()

  const eligible = rules.filter(r =>
    r.active &&
    (r.channel === 'all' || r.channel === channelType) &&
    isScheduledActive(r, now)
  )

  // Execute in three explicit phases, each sorted by priority
  for (const phase of ['pre', 'business', 'post'] as const) {
    const phaseRules = eligible
      .filter(r => (r.rule_phase ?? 'business') === phase)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

    for (const rule of phaseRules) {
      if (!conditionsPass(out, rule.conditions, rule.combinator ?? 'AND')) continue
      for (const action of rule.actions) {
        const lookupRows = action.lookup_table_id ? lookupMap[action.lookup_table_id] : undefined
        applyAction(out, action, lookupRows)
      }
    }
  }

  return out
}

/**
 * Apply field mappings — remaps source → target fields with optional transform or template.
 * Templates support {field_name} placeholders resolved against the original listing.
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
      out[m.target_field] = resolveTemplate(m.template, listing)
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

// ── Preview helper (for UI live-preview, no DB lookups needed) ─────────────────

export function previewRule(
  listing: Record<string, string>,
  conditions: Condition[],
  actions: Action[],
  combinator: 'AND' | 'OR'
): { out: Record<string, string>; matched: boolean } {
  const out = { ...listing }
  const matched = conditionsPass(out as any, conditions, combinator)

  if (matched) {
    for (const action of actions) {
      applyAction(out as any, action)
    }
  }

  return { out, matched }
}
