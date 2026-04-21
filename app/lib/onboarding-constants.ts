/**
 * Shared constants for the onboarding wizard (app/onboarding/page.tsx) and the
 * persistence API (app/api/onboarding/route.ts). Keep in sync with the CHECK
 * constraints in supabase/migrations/user_profiles.sql — mismatches produce a
 * hard insert failure, which is what we want.
 */

// ── Step 1 — You ────────────────────────────────────────────────────────────

export const ROLES = [
  { value: 'founder_ceo',   label: 'Founder / CEO' },
  { value: 'ops_manager',   label: 'Ops Manager' },
  { value: 'head_of_ecom',  label: 'Head of Ecommerce' },
  { value: 'agency',        label: 'Agency / Consultant' },
  { value: 'developer',     label: 'Developer' },
  { value: 'other',         label: 'Other' },
] as const

// ── Step 2 — Your business ──────────────────────────────────────────────────

export const BUSINESS_TYPES = [
  { value: 'limited_company', label: 'Limited company (Ltd / LLC / GmbH / SARL)' },
  { value: 'sole_trader',     label: 'Sole trader / sole proprietor' },
  { value: 'partnership',     label: 'Partnership / LLP' },
  { value: 'plc',             label: 'Public limited company / Inc.' },
  { value: 'non_profit',      label: 'Non-profit / charity' },
  { value: 'other',           label: 'Other' },
] as const

// ISO 3166-1 alpha-2 country codes. Priority markets first (Anglo + EU), then
// alphabetical global. Used in the Step 2 country dropdown.
export const COUNTRIES: Array<{ code: string; name: string; group: 'priority' | 'eu' | 'rest' }> = [
  // Priority — anglo markets Palvento targets first
  { code: 'GB', name: 'United Kingdom', group: 'priority' },
  { code: 'US', name: 'United States',  group: 'priority' },
  { code: 'AU', name: 'Australia',      group: 'priority' },
  { code: 'CA', name: 'Canada',         group: 'priority' },
  { code: 'IE', name: 'Ireland',        group: 'priority' },
  { code: 'NZ', name: 'New Zealand',    group: 'priority' },
  // EU — major markets with published multi-currency pricing
  { code: 'DE', name: 'Germany',        group: 'eu' },
  { code: 'FR', name: 'France',         group: 'eu' },
  { code: 'ES', name: 'Spain',          group: 'eu' },
  { code: 'IT', name: 'Italy',          group: 'eu' },
  { code: 'NL', name: 'Netherlands',    group: 'eu' },
  { code: 'BE', name: 'Belgium',        group: 'eu' },
  { code: 'SE', name: 'Sweden',         group: 'eu' },
  { code: 'DK', name: 'Denmark',        group: 'eu' },
  { code: 'FI', name: 'Finland',        group: 'eu' },
  { code: 'NO', name: 'Norway',         group: 'eu' },
  { code: 'AT', name: 'Austria',        group: 'eu' },
  { code: 'PT', name: 'Portugal',       group: 'eu' },
  { code: 'PL', name: 'Poland',         group: 'eu' },
  { code: 'CH', name: 'Switzerland',    group: 'eu' },
  // Rest — alphabetical. Keep the long tail because many Shopify operators
  // sell from places not on our currency list; country still matters for
  // tax/invoicing.
  { code: 'AE', name: 'United Arab Emirates', group: 'rest' },
  { code: 'AR', name: 'Argentina',      group: 'rest' },
  { code: 'BR', name: 'Brazil',         group: 'rest' },
  { code: 'CL', name: 'Chile',          group: 'rest' },
  { code: 'CN', name: 'China',          group: 'rest' },
  { code: 'CO', name: 'Colombia',       group: 'rest' },
  { code: 'CZ', name: 'Czech Republic', group: 'rest' },
  { code: 'EE', name: 'Estonia',        group: 'rest' },
  { code: 'GR', name: 'Greece',         group: 'rest' },
  { code: 'HK', name: 'Hong Kong',      group: 'rest' },
  { code: 'HR', name: 'Croatia',        group: 'rest' },
  { code: 'HU', name: 'Hungary',        group: 'rest' },
  { code: 'ID', name: 'Indonesia',      group: 'rest' },
  { code: 'IL', name: 'Israel',         group: 'rest' },
  { code: 'IN', name: 'India',          group: 'rest' },
  { code: 'IS', name: 'Iceland',        group: 'rest' },
  { code: 'JP', name: 'Japan',          group: 'rest' },
  { code: 'KR', name: 'South Korea',    group: 'rest' },
  { code: 'LT', name: 'Lithuania',      group: 'rest' },
  { code: 'LU', name: 'Luxembourg',     group: 'rest' },
  { code: 'LV', name: 'Latvia',         group: 'rest' },
  { code: 'MA', name: 'Morocco',        group: 'rest' },
  { code: 'MT', name: 'Malta',          group: 'rest' },
  { code: 'MX', name: 'Mexico',         group: 'rest' },
  { code: 'MY', name: 'Malaysia',       group: 'rest' },
  { code: 'PH', name: 'Philippines',    group: 'rest' },
  { code: 'RO', name: 'Romania',        group: 'rest' },
  { code: 'SA', name: 'Saudi Arabia',   group: 'rest' },
  { code: 'SG', name: 'Singapore',      group: 'rest' },
  { code: 'SI', name: 'Slovenia',       group: 'rest' },
  { code: 'SK', name: 'Slovakia',       group: 'rest' },
  { code: 'TH', name: 'Thailand',       group: 'rest' },
  { code: 'TR', name: 'Turkey',         group: 'rest' },
  { code: 'TW', name: 'Taiwan',         group: 'rest' },
  { code: 'UA', name: 'Ukraine',        group: 'rest' },
  { code: 'VN', name: 'Vietnam',        group: 'rest' },
  { code: 'ZA', name: 'South Africa',   group: 'rest' },
  { code: 'OT', name: 'Other — please contact support', group: 'rest' },
]

// Country codes where the tax-ID field is labelled "VAT number".
// Add to this list to surface the VAT field for additional jurisdictions.
const VAT_COUNTRIES = new Set([
  'GB','IE',
  'DE','FR','ES','IT','NL','BE','SE','DK','FI','AT','PT','PL','LU','LT','LV',
  'EE','SI','SK','CZ','HR','HU','RO','GR','BG','CY','MT','IS','NO','CH',
])

// Country codes where the tax-ID field is labelled "GST number".
const GST_COUNTRIES = new Set(['AU','NZ','CA','SG','IN','MY'])

/**
 * Returns the right label + placeholder + visibility for the tax-ID field
 * based on the user's selected country. US hides the field by default
 * (sales tax handled state-side, usually not collected at signup).
 */
export function taxIdConfig(countryCode: string | null): {
  visible: boolean
  label: string
  placeholder: string
  helper?: string
} {
  if (!countryCode) return { visible: false, label: '', placeholder: '' }
  if (VAT_COUNTRIES.has(countryCode)) {
    return {
      visible: true,
      label: 'VAT number',
      placeholder: countryCode === 'GB' ? 'GB123456789' : 'e.g. DE123456789',
      helper: 'Optional. Include the two-letter country prefix.',
    }
  }
  if (GST_COUNTRIES.has(countryCode)) {
    return {
      visible: true,
      label: countryCode === 'AU' ? 'ABN' : 'GST / tax number',
      placeholder: countryCode === 'AU' ? '12 345 678 901' : 'Tax ID',
      helper: 'Optional.',
    }
  }
  // US + most rest-of-world: hide by default.
  return { visible: false, label: '', placeholder: '' }
}

/**
 * Returns the right label + placeholder for the company-registration-number
 * field. Defaults to a generic "Company registration number" for any
 * unhandled country.
 */
export function companyNumberConfig(countryCode: string | null): {
  label: string
  placeholder: string
} {
  switch (countryCode) {
    case 'GB': return { label: 'Companies House number', placeholder: '12345678' }
    case 'US': return { label: 'EIN (Employer ID Number)', placeholder: '12-3456789' }
    case 'AU': return { label: 'ACN (Australian Company Number)', placeholder: '123 456 789' }
    case 'CA': return { label: 'Corporation number', placeholder: '' }
    case 'IE': return { label: 'CRO number', placeholder: '' }
    case 'DE': return { label: 'Handelsregisternummer', placeholder: 'HRB 12345' }
    case 'FR': return { label: 'SIRET / SIREN', placeholder: '' }
    case 'NL': return { label: 'KvK number', placeholder: '' }
    case 'NZ': return { label: 'NZBN', placeholder: '' }
    default:   return { label: 'Company registration number', placeholder: 'Optional' }
  }
}

// ── Step 3 — Your store ─────────────────────────────────────────────────────

export const GMV_BANDS = [
  { value: 'under_10k',    label: 'Under $10k / month' },
  { value: '10k_100k',     label: '$10k – $100k / month' },
  { value: '100k_500k',    label: '$100k – $500k / month' },
  { value: '500k_plus',    label: '$500k+ / month' },
] as const

export const CHANNELS = [
  { value: 'shopify',           label: 'Shopify' },
  { value: 'amazon',            label: 'Amazon' },
  { value: 'ebay',              label: 'eBay' },
  { value: 'etsy',              label: 'Etsy' },
  { value: 'tiktok_shop',       label: 'TikTok Shop' },
  { value: 'walmart',           label: 'Walmart' },
  { value: 'onbuy',             label: 'OnBuy' },
  { value: 'google_shopping',   label: 'Google Shopping' },
  { value: 'bigcommerce',       label: 'BigCommerce' },
  { value: 'woocommerce',       label: 'WooCommerce' },
  { value: 'other',             label: 'Other' },
] as const

// ── Step 4 — Your problem ───────────────────────────────────────────────────

export const PRIMARY_PROBLEMS = [
  { value: 'feed_errors',       label: 'Feed errors — listings suppressed for GTIN / image / banned-word issues' },
  { value: 'pnl_blindness',     label: "P&L blindness — can't tell which channel is actually profitable" },
  { value: 'channel_breadth',   label: 'Channel breadth — need more marketplaces than our current tool covers' },
  { value: 'listing_mgmt',      label: 'Listing management — bulk edits, variant groups, re-syncing' },
  { value: 'pricing_rules',     label: 'Pricing rules — per-channel floors not enforced' },
  { value: 'category_mapping',  label: 'Category mapping — reviewing 30,000+ Amazon / eBay nodes by hand' },
  { value: 'other',             label: 'Other' },
] as const

// ── Step 5 — Attribution ────────────────────────────────────────────────────

export const ACQUISITION_SOURCES = [
  { value: 'app_store',  label: 'Shopify App Store' },
  { value: 'linkedin',   label: 'LinkedIn' },
  { value: 'google',     label: 'Google Search' },
  { value: 'blog',       label: 'A blog post or article' },
  { value: 'friend',     label: 'A friend or colleague' },
  { value: 'other',      label: 'Other' },
] as const

// ── Shared types ────────────────────────────────────────────────────────────

export type Role = typeof ROLES[number]['value']
export type BusinessType = typeof BUSINESS_TYPES[number]['value']
export type GmvBand = typeof GMV_BANDS[number]['value']
export type Channel = typeof CHANNELS[number]['value']
export type PrimaryProblem = typeof PRIMARY_PROBLEMS[number]['value']
export type AcquisitionSource = typeof ACQUISITION_SOURCES[number]['value']

export interface UserProfile {
  user_id: string
  full_name: string | null
  role: Role | null
  business_name: string | null
  country: string | null
  business_type: BusinessType | null
  company_number: string | null
  tax_id: string | null
  shopify_url: string | null
  gmv_band: GmvBand | null
  current_channels: Channel[] | null
  primary_problem: PrimaryProblem | null
  free_text_context: string | null
  acquisition_source: AcquisitionSource | null
  onboarding_step: number
  onboarding_completed_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null
  signup_ip: string | null
  created_at: string
  updated_at: string
}
