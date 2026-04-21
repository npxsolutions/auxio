// Editorial v8 palette shared across the admin panel.
export const theme = {
  cream: '#f8f4ec',
  creamSoft: '#fdfaf2',
  ink: '#0b0f1a',
  inkSoft: 'rgba(11,15,26,0.62)',
  inkMuted: 'rgba(11,15,26,0.42)',
  inkFaint: 'rgba(11,15,26,0.14)',
  cobalt: '#e8863f',
  cobaltSoft: 'rgba(232,134,63,$1)',
  danger: '#b4321f',
  success: '#1f7a4a',
  serif: "'Instrument Serif', 'Times New Roman', serif",
  sans: "'Geist', -apple-system, system-ui, sans-serif",
} as const

export const STATUSES = {
  partners:   ['new', 'reviewing', 'approved', 'rejected', 'archived'] as const,
  affiliates: ['new', 'reviewing', 'approved', 'rejected', 'archived'] as const,
  demos:      ['new', 'scheduled', 'completed', 'no_show', 'cancelled'] as const,
  enterprise: ['new', 'reviewing', 'quoted', 'won', 'lost', 'archived'] as const,
} as const

export type Entity = 'partners' | 'affiliates' | 'demos' | 'api-keys' | 'enterprise'

export const ENTITY_TABLE: Record<Entity, string> = {
  partners: 'partner_applications',
  affiliates: 'affiliate_applications',
  demos: 'demo_requests',
  'api-keys': 'api_keys',
  enterprise: 'enterprise_quotes',
}
