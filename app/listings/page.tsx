'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import TourTrigger from '../components/TourTrigger'
import { useTour } from '../lib/tours'
import { createClient as createSupabaseClient } from '../lib/supabase-client'
import { HealthSummaryStrip, HealthDrawer, HealthBadge, useListingHealth } from './HealthSummaryStrip'
import { P, CARD, MONO, LABEL, HEADING, NUMBER, BTN_PRIMARY, BTN_SECONDARY, SECTION_HEADER, STATUS_DOT, CHANNEL_SVG } from '../lib/design-system'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelStatus = {
  channel_type: string
  status: string
  channel_url?: string
  error_message?: string
  last_synced_at?: string
}

type Listing = {
  id: string
  title: string
  price: number
  condition: string
  quantity: number
  status: string
  images: string[]
  sku?: string
  category?: string
  brand?: string
  created_at: string
  listing_channels: ChannelStatus[]
  // v2 columns (listings_table_v2 migration)
  margin_pct?: number | null
  sold_30d?: number | null
  sell_through_30d?: number | null
  days_of_cover?: number | null
  channel_count?: number | null
  primary_channel?: string | null
  last_sync_at?: string | null
  sync_errors_count?: number | null
  image_count?: number | null
  msrp?: number | null
  min_price?: number | null
  max_price?: number | null
  competitor_price?: number | null
  tags?: string[] | null
  parent_listing_id?: string | null
  is_bundle?: boolean | null
}

type DensityMode = 'compact' | 'comfortable' | 'spacious'
type SortField = 'title' | 'price' | 'quantity' | 'status' | 'created_at' | 'velocity' | 'revenue_30d' | 'margin_30d' | 'days_supply' | null
type SortDir = 'asc' | 'desc'
type SidePanelTab = 'details' | 'channels' | 'errors'

type ListingStats = {
  units_7d:     number
  units_30d:    number
  revenue_7d:   number
  revenue_30d:  number
  margin_30d:   number | null
  velocity:     number
  days_supply:  number | null
  sparkline:    number[]
  channels_30d: string[]
}

type FilterState = {
  status: string
  channel: string
  priceMin: string
  priceMax: string
  hasErrors: boolean
  health: string
  search: string
  // v2 quick-filter chips
  missingImage: boolean
  lowStock: boolean
  lowMargin: boolean
  syncError: boolean
  isBundle: boolean
  isVariant: boolean
}

type SavedView = {
  id: string
  name: string
  filters: FilterState
  visibleColumns: string[]
  sortField: SortField
  sortDir: SortDir
}

type BulkEditField = 'price' | 'quantity' | 'condition' | 'brand' | 'category' | null

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_COLUMNS = [
  'image', 'sku', 'price', 'stock', 'condition', 'brand', 'category', 'channels', 'status', 'created',
  'performance', 'velocity', 'revenue_30d', 'margin', 'supply', 'trend',
  // v2 columns
  'margin_pct', 'sold_30d', 'primary_channel', 'channel_count', 'last_sync_at', 'tags', 'msrp',
  'competitor_price', 'days_of_cover',
]

const DEFAULT_COLUMNS = [
  'sku', 'primary_channel', 'channel_count', 'stock', 'price', 'margin_pct', 'sold_30d', 'last_sync_at', 'status',
  'image', 'trend',
]

const COLUMN_LABELS: Record<string, string> = {
  image:       'Image',
  sku:         'SKU',
  price:       'Price',
  stock:       'Stock',
  condition:   'Condition',
  brand:       'Brand',
  category:    'Category',
  channels:    'Channels',
  status:      'Status',
  created:     'Created',
  performance: 'Performance',
  velocity:    'Velocity (7d)',
  revenue_30d: '30d Revenue',
  margin:      'Margin',
  supply:      'Days Supply',
  trend:       'Sales Trend',
  // v2
  margin_pct:       'Margin %',
  sold_30d:         'Sold (30d)',
  primary_channel:  'Primary channel',
  channel_count:    '# Channels',
  last_sync_at:     'Last sync',
  tags:             'Tags',
  msrp:             'MSRP',
  competitor_price: 'Competitor £',
  days_of_cover:    'Cover (d)',
}

const DENSITY_ROW_HEIGHT: Record<DensityMode, number> = {
  compact: 32,
  comfortable: 44,
  spacious: 56,
}

const STATUS_COLOUR: Record<string, string> = {
  published: P.emerald,
  failed: P.oxblood,
  pending: P.muted,
  draft: P.muted,
}

const CHANNEL_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  amazon: 'Amazon',
  ebay: 'eBay',
}

const CHANNEL_STYLE: Record<string, { bg: string; color: string }> = {
  shopify: { bg: P.cobaltSft, color: P.cobalt },
  ebay: { bg: P.amberSft, color: P.amber },
  amazon: { bg: P.amberSft, color: P.amber },
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all',
  channel: 'all',
  priceMin: '',
  priceMax: '',
  hasErrors: false,
  health: 'all',
  search: '',
  missingImage: false,
  lowStock: false,
  lowMargin: false,
  syncError: false,
  isBundle: false,
  isVariant: false,
}

const DEFAULT_VIEWS: SavedView[] = [
  {
    id: '__all__',
    name: 'All',
    filters: DEFAULT_FILTERS,
    visibleColumns: DEFAULT_COLUMNS,
    sortField: null,
    sortDir: 'asc',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return `£${Number(n).toFixed(2)}`
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function lsSet(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOUR[status] || P.muted
  return (
    <span
      style={{
        ...MONO,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        fontWeight: 600,
        color,
        background: color + '14',
        padding: '2px 7px',
        borderRadius: '2px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      <span style={STATUS_DOT(color)} />
      {status.replace('_', ' ')}
    </span>
  )
}

function ChannelDot({ channel, cs }: { channel: string; cs?: ChannelStatus }) {
  const colour = cs ? (STATUS_COLOUR[cs.status] || P.muted) : P.rule
  const chStyle = CHANNEL_STYLE[channel]
  return (
    <div
      title={cs ? `${CHANNEL_LABELS[channel] || channel}: ${cs.status}` : `${CHANNEL_LABELS[channel] || channel}: not published`}
      style={{
        width: '22px',
        height: '22px',
        borderRadius: '2px',
        background: cs && chStyle ? chStyle.bg : P.ruleSoft,
        border: `1px solid ${colour}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: P.ink,
        flexShrink: 0,
      }}
    >
      {CHANNEL_SVG[channel] || null}
    </div>
  )
}

// ── Sparkline: 7-bar mini chart ───────────────────────────────────────────────
function Sparkline({ data, color = P.cobalt }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  const W = 56, H = 22, BAR = 5, GAP = 3
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const barH = Math.max(2, (v / max) * (H - 2))
        return (
          <rect
            key={i}
            x={i * (BAR + GAP)}
            y={H - barH}
            width={BAR}
            height={barH}
            rx={1.5}
            fill={v > 0 ? color : P.ruleSoft}
            opacity={v > 0 ? (0.4 + 0.6 * (v / max)) : 1}
          />
        )
      })}
    </svg>
  )
}

// ── Performance tier badge ────────────────────────────────────────────────────
function PerfTier({ velocity, units30d }: { velocity: number; units30d: number }) {
  let label: string, bg: string, color: string

  if (velocity >= 3) {
    label = 'Top Seller'; bg = P.emeraldSft; color = P.emerald
  } else if (velocity >= 0.5 || units30d >= 3) {
    label = 'Active'; bg = P.cobaltSft; color = P.cobalt
  } else if (units30d > 0) {
    label = 'Slow'; bg = P.amberSft; color = P.amber
  } else {
    label = 'Stale'; bg = P.ruleSoft; color = P.muted
  }

  return (
    <span style={{
      ...MONO,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 600, color,
      background: bg, padding: '2px 7px', borderRadius: 2,
      whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      <span style={STATUS_DOT(color)} />
      {label}
    </span>
  )
}

// ── Days supply indicator ─────────────────────────────────────────────────────
function DaysSupply({ days }: { days: number | null }) {
  if (days === null) return <span style={{ fontSize: 12, color: P.muted }}>--</span>
  const color = days < 7 ? P.oxblood : days < 21 ? P.amber : P.emerald
  return (
    <span style={{ ...NUMBER, fontSize: 12, fontWeight: 600, color }}>
      {days > 999 ? '999+' : Math.round(days)}d
    </span>
  )
}

function EditableCell({
  value,
  onSave,
  type = 'text',
  prefix = '',
}: {
  value: string | number
  onSave: (v: string) => void
  type?: string
  prefix?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    setEditing(false)
    if (draft !== String(value)) onSave(draft)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setEditing(false); setDraft(String(value)) }
        }}
        style={{
          width: '72px',
          padding: '2px 6px',
          border: '1px solid #2383e2',
          borderRadius: '4px',
          fontSize: '13px',
          fontFamily: 'inherit',
          color: P.ink,
          outline: 'none',
          background: 'white',
        }}
      />
    )
  }

  return (
    <div
      onClick={e => { e.stopPropagation(); setEditing(true) }}
      title="Click to edit"
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: P.ink,
        cursor: 'text',
        padding: '1px 4px',
        borderRadius: '3px',
        border: '1px solid transparent',
        display: 'inline-block',
        minWidth: '40px',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(11,15,26,0.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent' }}
    >
      {prefix}{type === 'number' && prefix === '£' ? Number(value).toFixed(2) : value}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const router = useRouter()

  // Tour: fetch user id once so the tour can key its "completed" flag per user.
  const [tourUserId, setTourUserId] = useState<string | null>(null)
  useEffect(() => {
    const sb = createSupabaseClient()
    sb.auth.getUser().then(({ data }) => {
      if (data.user?.id) setTourUserId(data.user.id)
    }).catch(err => console.error('[tour:listings] user fetch failed', err))
  }, [])
  useTour('listings', tourUserId)

  // Core data
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])
  const [stats, setStats] = useState<Record<string, ListingStats>>({})

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // [feed:validator] listing-health overlay
  const { byListing: healthByListing, totals: healthTotals, reload: reloadHealth } = useListingHealth()
  const [healthFilter, setHealthFilter] = useState<'all' | 'errors' | 'warnings' | 'healthy'>('all')
  const [healthDrawerListing, setHealthDrawerListing] = useState<Listing | null>(null)

  // Sorting
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Views
  const [views, setViews] = useState<SavedView[]>(DEFAULT_VIEWS)
  const [activeViewId, setActiveViewId] = useState('__all__')
  const [saveViewOpen, setSaveViewOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  // Display
  const [density, setDensity] = useState<DensityMode>('comfortable')
  const [densityOpen, setDensityOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [colMenuOpen, setColMenuOpen] = useState(false)

  // Pagination
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)

  // Side panel
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('details')

  // Bulk actions
  const [bulkPublishing, setBulkPublishing] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkChannels, setBulkChannels] = useState<Set<string>>(new Set())
  const [bulkEditField, setBulkEditField] = useState<BulkEditField>(null)
  const [bulkEditValue, setBulkEditValue] = useState('')
  const [bulkEditMenuOpen, setBulkEditMenuOpen] = useState(false)

  // Toast
  const [toast, setToast] = useState('')

  // Columns dropdown ref for outside click
  const colMenuRef = useRef<HTMLDivElement>(null)
  const densityRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const bulkEditRef = useRef<HTMLDivElement>(null)
  const saveViewRef = useRef<HTMLDivElement>(null)

  // ── Bootstrap from localStorage ──────────────────────────────────────────────

  useEffect(() => {
    setDensity(lsGet('palvento_density', 'comfortable'))
    setVisibleColumns(lsGet('palvento_columns', DEFAULT_COLUMNS))
    const saved = lsGet<SavedView[]>('palvento_views', [])
    if (saved.length > 0) {
      setViews([...DEFAULT_VIEWS, ...saved])
    }
  }, [])

  // ── API fetches ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/channels/health')
      .then(r => r.json())
      .then(d => {
        const valid = Object.entries(d.health || {})
          .filter(([, v]: any) => v.valid)
          .map(([k]) => k)
        setConnectedChannels(valid)
        setBulkChannels(new Set(valid))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => setListings(d.listings || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/listings/stats')
      .then(r => r.json())
      .then(d => setStats(d.stats || {}))
      .catch(() => {})
  }, [])

  // ── Toast helper ──────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // ── Outside-click to close dropdowns ─────────────────────────────────────────

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false)
      if (densityRef.current && !densityRef.current.contains(e.target as Node)) setDensityOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPanelOpen(false)
      if (bulkEditRef.current && !bulkEditRef.current.contains(e.target as Node)) setBulkEditMenuOpen(false)
      if (saveViewRef.current && !saveViewRef.current.contains(e.target as Node)) setSaveViewOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Sorting ───────────────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  // ── Filtering ─────────────────────────────────────────────────────────────────

  function updateFilter(k: keyof FilterState, v: any) {
    setFilters(prev => ({ ...prev, [k]: v }))
    setActiveViewId('__custom__')
    setPage(1)
  }

  function clearAllFilters() {
    setFilters(DEFAULT_FILTERS)
    setActiveViewId('__all__')
    setPage(1)
  }

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; key: keyof FilterState }[] = []
    if (filters.status !== 'all') chips.push({ label: `Status: ${filters.status}`, key: 'status' })
    if (filters.channel !== 'all') chips.push({ label: `Channel: ${CHANNEL_LABELS[filters.channel] || filters.channel}`, key: 'channel' })
    if (filters.priceMin) chips.push({ label: `Min price: £${filters.priceMin}`, key: 'priceMin' })
    if (filters.priceMax) chips.push({ label: `Max price: £${filters.priceMax}`, key: 'priceMax' })
    if (filters.hasErrors) chips.push({ label: 'Has errors', key: 'hasErrors' })
    if (filters.health === 'incomplete') chips.push({ label: 'Not published', key: 'health' })
    if (filters.missingImage) chips.push({ label: 'Missing image', key: 'missingImage' })
    if (filters.lowStock)     chips.push({ label: 'Low stock (<5)', key: 'lowStock' })
    if (filters.lowMargin)    chips.push({ label: 'Low margin (<10%)', key: 'lowMargin' })
    if (filters.syncError)    chips.push({ label: 'Sync error', key: 'syncError' })
    if (filters.isBundle)     chips.push({ label: 'Bundle', key: 'isBundle' })
    if (filters.isVariant)    chips.push({ label: 'Variant', key: 'isVariant' })
    return chips
  }, [filters])

  // ── Derived: filtered + sorted ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let out = listings

    if (filters.status !== 'all') out = out.filter(l => l.status === filters.status)
    if (filters.channel !== 'all') out = out.filter(l => l.listing_channels?.some(lc => lc.channel_type === filters.channel))
    if (filters.priceMin) out = out.filter(l => l.price >= parseFloat(filters.priceMin))
    if (filters.priceMax) out = out.filter(l => l.price <= parseFloat(filters.priceMax))
    if (filters.hasErrors) out = out.filter(l => l.listing_channels?.some(lc => lc.error_message))
    if (filters.health === 'incomplete') out = out.filter(l => !l.listing_channels?.some(lc => lc.status === 'published'))
    if (filters.missingImage) out = out.filter(l => !(l.images && l.images.length > 0))
    if (filters.lowStock)     out = out.filter(l => (l.quantity ?? 0) < 5)
    if (filters.lowMargin)    out = out.filter(l => l.margin_pct != null && Number(l.margin_pct) < 10)
    if (filters.syncError)    out = out.filter(l => (l.sync_errors_count ?? 0) > 0 || l.listing_channels?.some(lc => lc.error_message))
    if (filters.isBundle)     out = out.filter(l => !!l.is_bundle)
    if (filters.isVariant)    out = out.filter(l => !!l.parent_listing_id)
    if (healthFilter !== 'all') {
      out = out.filter(l => {
        const h = healthByListing.get(l.id)
        if (healthFilter === 'errors')   return !!h && h.errors_count > 0
        if (healthFilter === 'warnings') return !!h && h.errors_count === 0 && h.warnings_count > 0
        if (healthFilter === 'healthy')  return !!h && h.errors_count === 0 && h.warnings_count === 0
        return true
      })
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      out = out.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.sku?.toLowerCase().includes(q) ||
        l.brand?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q)
      )
    }

    // Sort
    const STAT_SORT_FIELDS = new Set(['velocity', 'revenue_30d', 'margin_30d', 'days_supply'])
    if (sortField) {
      out = [...out].sort((a, b) => {
        let av: any
        let bv: any
        if (STAT_SORT_FIELDS.has(sortField)) {
          const as = a.sku ? stats[a.sku] : null
          const bs = b.sku ? stats[b.sku] : null
          av = as ? (as as any)[sortField] ?? -1 : -1
          bv = bs ? (bs as any)[sortField] ?? -1 : -1
        } else {
          av = a[sortField as keyof Listing]
          bv = b[sortField as keyof Listing]
          if (typeof av === 'string') av = av.toLowerCase()
          if (typeof bv === 'string') bv = bv.toLowerCase()
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return out
  }, [listings, filters, sortField, sortDir, healthFilter, healthByListing, stats])

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Selection helpers
  const allPageSelected = paged.length > 0 && paged.every(l => selected.has(l.id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allPageSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        paged.forEach(l => next.delete(l.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        paged.forEach(l => next.add(l.id))
        return next
      })
    }
  }

  function toggleOne(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAllResults() {
    setSelected(new Set(filtered.map(l => l.id)))
  }

  // ── Views ─────────────────────────────────────────────────────────────────────

  function applyView(view: SavedView) {
    setFilters(view.filters)
    setVisibleColumns(view.visibleColumns)
    setSortField(view.sortField)
    setSortDir(view.sortDir)
    setActiveViewId(view.id)
    setPage(1)
  }

  function saveCurrentView() {
    if (!newViewName.trim()) return
    const view: SavedView = {
      id: Date.now().toString(),
      name: newViewName.trim(),
      filters,
      visibleColumns,
      sortField,
      sortDir,
    }
    const userViews = [...views.filter(v => v.id !== '__all__'), view]
    setViews([DEFAULT_VIEWS[0], ...userViews])
    lsSet('palvento_views', userViews)
    setActiveViewId(view.id)
    setNewViewName('')
    setSaveViewOpen(false)
    showToast(`View "${view.name}" saved`)
  }

  function deleteView(id: string) {
    const userViews = views.filter(v => v.id !== '__all__' && v.id !== id)
    setViews([DEFAULT_VIEWS[0], ...userViews])
    lsSet('palvento_views', userViews)
    if (activeViewId === id) applyView(DEFAULT_VIEWS[0])
  }

  // ── Column persistence ────────────────────────────────────────────────────────

  function toggleColumn(col: string) {
    setVisibleColumns(prev => {
      const next = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
      lsSet('palvento_columns', next)
      return next
    })
  }

  // ── Density persistence ───────────────────────────────────────────────────────

  function setDensityAndSave(d: DensityMode) {
    setDensity(d)
    lsSet('palvento_density', d)
    setDensityOpen(false)
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────────

  async function bulkPublish() {
    if (!selected.size || !bulkChannels.size) return
    setBulkPublishing(true)
    let succeeded = 0
    for (const id of selected) {
      try {
        await fetch(`/api/listings/${id}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channels: Array.from(bulkChannels) }),
        })
        succeeded++
      } catch {}
    }
    const data = await fetch('/api/listings').then(r => r.json())
    setListings(data.listings || [])
    setSelected(new Set())
    setBulkPublishing(false)
    showToast(`Published ${succeeded} listing${succeeded !== 1 ? 's' : ''}`)
  }

  async function bulkDelete() {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} listing${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true)
    for (const id of selected) {
      await fetch(`/api/listings/${id}`, { method: 'DELETE' })
    }
    setListings(prev => prev.filter(l => !selected.has(l.id)))
    setSelected(new Set())
    setBulkDeleting(false)
    showToast(`Deleted ${selected.size} listing${selected.size !== 1 ? 's' : ''}`)
  }

  async function applyBulkEdit() {
    if (!bulkEditField || !bulkEditValue || !selected.size) return
    let count = 0
    for (const id of selected) {
      try {
        await fetch(`/api/listings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bulkEditField]: bulkEditField === 'price' || bulkEditField === 'quantity' ? parseFloat(bulkEditValue) : bulkEditValue }),
        })
        count++
      } catch {}
    }
    const data = await fetch('/api/listings').then(r => r.json())
    setListings(data.listings || [])
    setBulkEditField(null)
    setBulkEditValue('')
    setBulkEditMenuOpen(false)
    showToast(`Updated ${count} product${count !== 1 ? 's' : ''}`)
  }

  // ── Inline cell save ──────────────────────────────────────────────────────────

  async function saveCellField(id: string, field: 'price' | 'quantity', value: string) {
    const parsed = parseFloat(value)
    if (isNaN(parsed)) return
    setListings(prev => prev.map(l => l.id === id ? { ...l, [field]: parsed } : l))
    try {
      await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: parsed }),
      })
    } catch {
      showToast('Failed to save — please try again')
    }
  }

  // ── Counts ────────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    all: listings.length,
    draft: listings.filter(l => l.status === 'draft').length,
    published: listings.filter(l => l.status === 'published').length,
    failed: listings.filter(l => l.status === 'failed').length,
  }), [listings])

  // ── Grid template ─────────────────────────────────────────────────────────────

  function buildGridCols() {
    const parts: string[] = ['36px']
    if (visibleColumns.includes('image'))       parts.push('44px')
    parts.push('1fr') // title always visible
    if (visibleColumns.includes('sku'))         parts.push('90px')
    if (visibleColumns.includes('price'))       parts.push('80px')
    if (visibleColumns.includes('stock'))       parts.push('65px')
    if (visibleColumns.includes('condition'))   parts.push('100px')
    if (visibleColumns.includes('brand'))       parts.push('100px')
    if (visibleColumns.includes('category'))    parts.push('110px')
    if (visibleColumns.includes('channels'))    parts.push('100px')
    if (visibleColumns.includes('status'))      parts.push('100px')
    if (visibleColumns.includes('created'))     parts.push('110px')
    if (visibleColumns.includes('performance')) parts.push('110px')
    if (visibleColumns.includes('velocity'))    parts.push('90px')
    if (visibleColumns.includes('revenue_30d')) parts.push('100px')
    if (visibleColumns.includes('margin'))      parts.push('80px')
    if (visibleColumns.includes('supply'))      parts.push('90px')
    if (visibleColumns.includes('trend'))       parts.push('70px')
    if (visibleColumns.includes('margin_pct'))       parts.push('80px')
    if (visibleColumns.includes('sold_30d'))         parts.push('80px')
    if (visibleColumns.includes('primary_channel'))  parts.push('110px')
    if (visibleColumns.includes('channel_count'))    parts.push('70px')
    if (visibleColumns.includes('last_sync_at'))     parts.push('110px')
    if (visibleColumns.includes('tags'))             parts.push('140px')
    if (visibleColumns.includes('msrp'))             parts.push('80px')
    if (visibleColumns.includes('competitor_price')) parts.push('90px')
    if (visibleColumns.includes('days_of_cover'))    parts.push('80px')
    return parts.join(' ')
  }

  const gridCols = buildGridCols()
  const rowH = DENSITY_ROW_HEIGHT[density]

  // ── Sort indicator ────────────────────────────────────────────────────────────

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span style={{ color: '#ccc', fontSize: '10px', marginLeft: '4px' }}>↕</span>
    return <span style={{ color: P.ink, fontSize: '10px', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── Side panel listing (keep in sync) ─────────────────────────────────────────

  useEffect(() => {
    if (selectedListing) {
      const updated = listings.find(l => l.id === selectedListing.id)
      if (updated) setSelectedListing(updated)
    }
  }, [listings])

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'var(--font-geist), -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: P.bg, WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />
      <TourTrigger tourId="listings" userId={tourUserId} />

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: P.ink, color: P.bg, padding: '12px 18px', borderRadius: '2px', fontSize: '13px', fontWeight: 500, zIndex: 500, boxShadow: '0 4px 16px rgba(11,15,26,0.18)' }}>
          {toast}
        </div>
      )}

      {/* Side Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          background: P.surface,
          borderLeft: `1px solid ${P.rule}`,
          zIndex: 100,
          padding: 0,
          transform: selectedListing ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {selectedListing && (
          <SidePanel
            listing={selectedListing}
            tab={sidePanelTab}
            setTab={setSidePanelTab}
            onClose={() => setSelectedListing(null)}
            onNavigate={() => router.push(`/listings/${selectedListing.id}`)}
            onSave={async (field, value) => {
              if (field === 'price' || field === 'quantity') {
                await saveCellField(selectedListing.id, field, String(value))
              }
            }}
            connectedChannels={connectedChannels}
          />
        )}
      </div>

      {/* Main */}
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
        <div style={{ maxWidth: '1200px' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ ...HEADING, fontSize: '24px', fontWeight: 400, color: P.ink, margin: 0, letterSpacing: '-0.01em' }}>Listings</h1>
              <p style={{ ...MONO, fontSize: '11px', color: P.muted, margin: '4px 0 0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {listings.length} listing{listings.length !== 1 ? 's' : ''} -- create once, publish everywhere
              </p>
            </div>
            <div data-tour="listings-cost" style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => router.push('/listings/import')}
                style={{ ...BTN_SECONDARY, padding: '9px 16px' }}
              >
                Import CSV
              </button>
              <button
                onClick={() => router.push('/listings/new')}
                style={{ ...BTN_PRIMARY, padding: '9px 18px' }}
              >
                + New listing
              </button>
            </div>
          </div>

          {/* ── Listing health summary strip ── */}
          <HealthSummaryStrip
            totals={healthTotals}
            activeFilter={healthFilter}
            onFilter={setHealthFilter}
          />

          {/* ── Saved View Tabs ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', borderBottom: `1px solid ${P.rule}`, paddingBottom: '0' }}>
            {views.map(view => (
              <div key={view.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => applyView(view)}
                  style={{
                    padding: '7px 14px',
                    fontSize: '13px',
                    fontWeight: activeViewId === view.id ? 600 : 500,
                    color: activeViewId === view.id ? P.ink : P.muted,
                    background: 'none',
                    border: 'none',
                    borderBottom: activeViewId === view.id ? `2px solid ${P.cobalt}` : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: '-1px',
                    borderRadius: '0',
                  }}
                >
                  {view.name}
                </button>
                {view.id !== '__all__' && (
                  <button
                    onClick={() => deleteView(view.id)}
                    title="Delete view"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: '12px', padding: '0 4px', marginLeft: '-6px' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Save View */}
            <div ref={saveViewRef} style={{ position: 'relative', marginLeft: '8px' }}>
              <button
                onClick={() => setSaveViewOpen(v => !v)}
                style={{ padding: '6px 10px', fontSize: '12px', color: P.muted, background: 'none', border: `1px dashed ${P.rule}`, borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
              >
                + Save view
              </button>
              {saveViewOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '12px', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', width: '220px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: P.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Save current view</div>
                  <input
                    autoFocus
                    value={newViewName}
                    onChange={e => setNewViewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveCurrentView()}
                    placeholder="View name..."
                    style={{ width: '100%', padding: '6px 8px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button onClick={saveCurrentView} style={{ flex: 1, padding: '6px', background: P.ink, color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    <button onClick={() => setSaveViewOpen(false)} style={{ flex: 1, padding: '6px', background: 'white', color: P.muted, border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '280px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: P.muted, fontSize: '13px' }}>⌕</span>
              <input
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                placeholder="Search title, SKU, brand..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', border: `1px solid ${P.rule}`, borderRadius: '2px', fontSize: '13px', fontFamily: 'inherit', color: P.ink, outline: 'none', background: 'white', boxSizing: 'border-box' }}
              />
            </div>

            {/* Filter dropdown */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterPanelOpen(v => !v)}
                style={{
                  padding: '8px 14px',
                  background: activeFilterChips.length > 0 ? P.ink : 'white',
                  color: activeFilterChips.length > 0 ? 'white' : P.ink,
                  border: `1px solid ${P.rule}`,
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Filter{activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''} ▾
              </button>

              {filterPanelOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '16px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', width: '280px', minWidth: '260px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: P.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filters</div>

                  {/* Status */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: P.ink, display: 'block', marginBottom: '6px' }}>Status</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {['all', 'draft', 'published', 'failed', 'missing_images'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateFilter('status', s)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            border: `1px solid ${filters.status === s ? P.ink : P.rule}`,
                            borderRadius: '5px',
                            background: filters.status === s ? P.ink : 'white',
                            color: filters.status === s ? 'white' : P.muted,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: 500,
                          }}
                        >
                          {s === 'all' ? 'All' : s === 'missing_images' ? 'Missing Images' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: P.ink, display: 'block', marginBottom: '6px' }}>Channel</label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {['all', 'shopify', 'ebay', 'amazon'].map(ch => (
                        <button
                          key={ch}
                          onClick={() => updateFilter('channel', ch)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            border: `1px solid ${filters.channel === ch ? P.ink : P.rule}`,
                            borderRadius: '5px',
                            background: filters.channel === ch ? P.ink : 'white',
                            color: filters.channel === ch ? 'white' : P.muted,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: 500,
                          }}
                        >
                          {ch === 'all' ? 'All' : CHANNEL_LABELS[ch] || ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: P.ink, display: 'block', marginBottom: '6px' }}>Price Range</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Min £"
                        value={filters.priceMin}
                        onChange={e => updateFilter('priceMin', e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                      />
                      <span style={{ color: P.muted, fontSize: '12px' }}>–</span>
                      <input
                        type="number"
                        placeholder="Max £"
                        value={filters.priceMax}
                        onChange={e => updateFilter('priceMax', e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Has errors + Not published */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: P.ink }}>
                      <input type="checkbox" checked={filters.hasErrors} onChange={e => updateFilter('hasErrors', e.target.checked)} style={{ accentColor: P.ink }} />
                      Has channel errors
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: P.ink }}>
                      <input
                        type="checkbox"
                        checked={filters.health === 'incomplete'}
                        onChange={e => updateFilter('health', e.target.checked ? 'incomplete' : 'all')}
                        style={{ accentColor: P.ink }}
                      />
                      Not published anywhere
                    </label>
                  </div>

                  {activeFilterChips.length > 0 && (
                    <button onClick={clearAllFilters} style={{ fontSize: '12px', color: P.oxblood, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: '0' }}>
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Column visibility */}
            <div ref={colMenuRef} data-tour="listings-columns" style={{ position: 'relative' }}>
              <button
                onClick={() => setColMenuOpen(v => !v)}
                style={{ padding: '8px 14px', background: 'white', color: P.ink, border: `1px solid ${P.rule}`, borderRadius: '2px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Columns ▾
              </button>
              {colMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'white', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '12px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '170px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: P.muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Columns</div>
                  {ALL_COLUMNS.map(col => (
                    <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: P.ink }}>
                      <input type="checkbox" checked={visibleColumns.includes(col)} onChange={() => toggleColumn(col)} style={{ accentColor: P.ink }} />
                      {COLUMN_LABELS[col] || col}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Density */}
            <div ref={densityRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDensityOpen(v => !v)}
                title="Row density"
                style={{ padding: '8px 12px', background: 'white', color: P.ink, border: `1px solid ${P.rule}`, borderRadius: '2px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ☰
              </button>
              {densityOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'white', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '8px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '150px' }}>
                  {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDensityAndSave(d)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: density === d ? P.bg : 'none',
                        border: 'none',
                        borderRadius: '2px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        fontWeight: density === d ? 600 : 400,
                        color: P.ink,
                        cursor: 'pointer',
                      }}
                    >
                      {density === d ? '● ' : '○ '}{d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick filter chips (v2) ── */}
          <div data-tour="listings-filters" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
            {([
              { key: 'missingImage', label: 'Missing image' },
              { key: 'lowStock',     label: 'Low stock' },
              { key: 'lowMargin',    label: 'Low margin' },
              { key: 'syncError',    label: 'Sync error' },
              { key: 'isBundle',     label: 'Bundle' },
              { key: 'isVariant',    label: 'Variant' },
            ] as { key: keyof FilterState; label: string }[]).map(chip => {
              const on = Boolean(filters[chip.key])
              return (
                <button
                  key={chip.key as string}
                  onClick={() => updateFilter(chip.key, !on)}
                  style={{
                    padding: '4px 11px',
                    fontSize: '12px',
                    border: `1px solid ${on ? P.ink : P.rule}`,
                    borderRadius: '2px',
                    background: on ? P.ink : 'white',
                    color: on ? 'white' : P.muted,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                  }}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          {/* ── Active filter chips ── */}
          {activeFilterChips.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
              {activeFilterChips.map(chip => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px 4px 10px',
                    background: P.ruleSoft,
                    border: `1px solid ${P.rule}`,
                    borderRadius: '2px',
                    fontSize: '12px',
                    color: P.ink,
                    fontWeight: 500,
                  }}
                >
                  {chip.label}
                  <button
                    onClick={() => {
                      const boolKeys: (keyof FilterState)[] = ['hasErrors', 'missingImage', 'lowStock', 'lowMargin', 'syncError', 'isBundle', 'isVariant']
                      if (boolKeys.includes(chip.key)) updateFilter(chip.key, false)
                      else if (chip.key === 'health') updateFilter('health', 'all')
                      else updateFilter(chip.key, chip.key === 'status' || chip.key === 'channel' ? 'all' : '')
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: '14px', lineHeight: 1, padding: '0', display: 'flex', alignItems: 'center' }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button onClick={clearAllFilters} style={{ fontSize: '12px', color: P.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                Clear all
              </button>
            </div>
          )}

          {/* ── Bulk action bar ── */}
          {someSelected && (
            <div style={{ background: P.ink, color: 'white', borderRadius: '9px', padding: '10px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{selected.size} selected</span>

              {/* Select all results */}
              {selected.size < filtered.length && (
                <button
                  onClick={selectAllResults}
                  style={{ fontSize: '12px', color: P.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                >
                  Select all {filtered.length} results
                </button>
              )}

              <div style={{ width: '1px', height: '16px', background: '#444' }} />

              {/* Channel toggles */}
              {connectedChannels.length > 0 && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  {connectedChannels.map(ch => {
                    const on = bulkChannels.has(ch)
                    return (
                      <button
                        key={ch}
                        onClick={() => setBulkChannels(prev => { const n = new Set(prev); on ? n.delete(ch) : n.add(ch); return n })}
                        style={{ padding: '4px 9px', background: on ? 'rgba(255,255,255,0.15)' : 'transparent', color: on ? 'white' : '#666', border: `1px solid ${on ? 'rgba(255,255,255,0.3)' : '#444'}`, borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                      >
                        {CHANNEL_LABELS[ch] || ch}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Bulk Edit dropdown */}
              <div ref={bulkEditRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setBulkEditMenuOpen(v => !v)}
                  style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Edit Field ▾
                </button>
                {bulkEditMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '8px', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '200px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: P.muted, padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Edit field</div>
                    {(['price', 'quantity', 'condition', 'brand', 'category'] as BulkEditField[]).map(f => (
                      <button
                        key={f!}
                        onClick={() => { setBulkEditField(f); setBulkEditValue('') }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: bulkEditField === f ? P.bg : 'none', border: 'none', borderRadius: '2px', fontSize: '13px', fontFamily: 'inherit', color: P.ink, cursor: 'pointer', fontWeight: bulkEditField === f ? 600 : 400 }}
                      >
                        {f!.charAt(0).toUpperCase() + f!.slice(1)}
                      </button>
                    ))}
                    {bulkEditField && (
                      <div style={{ borderTop: '1px solid #f1f1ef', paddingTop: '8px', marginTop: '4px', padding: '8px' }}>
                        <input
                          autoFocus
                          type={bulkEditField === 'price' || bulkEditField === 'quantity' ? 'number' : 'text'}
                          placeholder={`New ${bulkEditField}...`}
                          value={bulkEditValue}
                          onChange={e => setBulkEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyBulkEdit()}
                          style={{ width: '100%', padding: '6px 8px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={applyBulkEdit}
                          style={{ width: '100%', marginTop: '6px', padding: '7px', background: P.ink, color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Apply to {selected.size} product{selected.size !== 1 ? 's' : ''}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={bulkPublish}
                  disabled={bulkPublishing || bulkChannels.size === 0}
                  style={{ padding: '7px 14px', background: P.emerald, color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontWeight: 600, cursor: (bulkPublishing || bulkChannels.size === 0) ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: bulkChannels.size === 0 ? 0.5 : 1 }}
                >
                  {bulkPublishing ? 'Publishing...' : `Publish${bulkChannels.size ? ' to ' + Array.from(bulkChannels).map(c => CHANNEL_LABELS[c] || c).join(' + ') : '…'}`}
                </button>
                <button
                  onClick={bulkDelete}
                  disabled={bulkDeleting}
                  style={{ padding: '7px 14px', background: P.oxblood, color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontWeight: 600, cursor: bulkDeleting ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                >
                  {bulkDeleting ? 'Deleting...' : `Delete (${selected.size})`}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  style={{ padding: '7px 12px', background: 'none', color: P.muted, border: '1px solid #444', borderRadius: '2px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Table / Empty states ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: P.muted, fontSize: '14px' }}>Loading...</div>
          ) : filtered.length === 0 && listings.length === 0 ? (
            <div style={{ ...CARD, padding: '60px', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={P.muted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: '16px' }}><path d="M6 8h20M6 14h20M6 20h12"/></svg>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: P.ink, margin: '0 0 8px' }}>No listings yet</h2>
              <p style={{ fontSize: '13px', color: P.muted, margin: '0 0 24px' }}>Create your first listing and publish it to Shopify, eBay, and Amazon in one go.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => router.push('/listings/import')} style={{ padding: '10px 18px', background: 'white', color: P.ink, border: `1px solid ${P.rule}`, borderRadius: '2px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Import CSV</button>
                <button onClick={() => router.push('/listings/new')} style={{ padding: '10px 20px', background: P.ink, color: 'white', border: 'none', borderRadius: '2px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create listing</button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...CARD, padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: P.muted }}>No listings match these filters</div>
              <button onClick={clearAllFilters} style={{ marginTop: '10px', fontSize: '13px', color: P.cobalt, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ ...CARD, overflow: 'hidden' }}>

              {/* Sticky header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                alignItems: 'center',
                gap: '10px',
                padding: '0 16px',
                height: '36px',
                borderBottom: `1px solid ${P.rule}`,
                background: P.bg,
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <div data-tour="listings-bulk" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} style={{ accentColor: P.ink, cursor: 'pointer' }} />
                </div>
                {visibleColumns.includes('image') && <div />}
                <HeaderCell label="Product" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                {visibleColumns.includes('sku') && <HeaderCell label="SKU" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('price') && <HeaderCell label="Price" field="price" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('stock') && <HeaderCell label="Stock" field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('condition') && <HeaderCell label="Condition" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('brand') && <HeaderCell label="Brand" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('category') && <HeaderCell label="Category" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('channels')    && <HeaderCell label="Channels"      field={null}           sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('status')      && <HeaderCell label="Status"         field="status"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('created')     && <HeaderCell label="Created"        field="created_at"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('performance') && <HeaderCell label="Performance"    field={null}           sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('velocity')    && <HeaderCell label="Velocity (7d)"  field="velocity"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('revenue_30d') && <HeaderCell label="30d Revenue"    field="revenue_30d"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('margin')      && <HeaderCell label="Margin"         field="margin_30d"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('supply')      && <HeaderCell label="Days Supply"    field="days_supply"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('trend')       && <HeaderCell label="Trend (7d)"     field={null}           sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('margin_pct')      && <HeaderCell label="Margin %"       field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('sold_30d')        && <HeaderCell label="Sold (30d)"     field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('primary_channel') && <HeaderCell label="Primary"        field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('channel_count')   && <HeaderCell label="# Ch"           field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('last_sync_at')    && <HeaderCell label="Last sync"      field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('tags')            && <HeaderCell label="Tags"           field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('msrp')            && <HeaderCell label="MSRP"           field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('competitor_price')&& <HeaderCell label="Competitor"     field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('days_of_cover')   && <HeaderCell label="Cover (d)"      field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
              </div>

              {/* Rows */}
              {paged.map((listing, i) => {
                const isSelected = selected.has(listing.id)
                return (
                  <div
                    key={listing.id}
                    onClick={() => { setSelectedListing(listing); setSidePanelTab('details') }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: gridCols,
                      alignItems: 'center',
                      gap: '10px',
                      padding: `0 16px`,
                      minHeight: `${rowH}px`,
                      borderBottom: i < paged.length - 1 ? '1px solid #f7f7f5' : 'none',
                      background: isSelected ? P.cobaltSft : selectedListing?.id === listing.id ? P.ruleSoft : P.surface,
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected && selectedListing?.id !== listing.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(29,95,219,0.04)' }}
                    onMouseLeave={e => { if (!isSelected && selectedListing?.id !== listing.id) (e.currentTarget as HTMLDivElement).style.background = P.surface }}
                  >
                    {/* Checkbox */}
                    <div onClick={e => toggleOne(listing.id, e)}>
                      <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: P.ink, cursor: 'pointer' }} />
                    </div>

                    {/* Thumbnail */}
                    {visibleColumns.includes('image') && (
                      <div style={{ width: '36px', height: '36px', borderRadius: '2px', background: P.ruleSoft, overflow: 'hidden', flexShrink: 0 }}>
                        {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                    )}

                    {/* Title */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: P.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</span>
                        {(() => {
                          const h = healthByListing.get(listing.id)
                          if (!h) return null
                          return <HealthBadge score={h.health_score} onClick={() => setHealthDrawerListing(listing)} />
                        })()}
                      </div>
                      {density !== 'compact' && (
                        <div style={{ fontSize: '11px', color: P.muted, marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {[listing.condition, listing.brand].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>

                    {/* SKU */}
                    {visibleColumns.includes('sku') && (
                      <div style={{ fontSize: '12px', color: P.muted, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.sku || '—'}
                      </div>
                    )}

                    {/* Price */}
                    {visibleColumns.includes('price') && (
                      <div onClick={e => e.stopPropagation()}>
                        <EditableCell
                          value={listing.price}
                          type="number"
                          prefix="£"
                          onSave={v => saveCellField(listing.id, 'price', v)}
                        />
                      </div>
                    )}

                    {/* Stock */}
                    {visibleColumns.includes('stock') && (
                      <div onClick={e => e.stopPropagation()}>
                        <EditableCell
                          value={listing.quantity}
                          type="number"
                          onSave={v => saveCellField(listing.id, 'quantity', v)}
                        />
                      </div>
                    )}

                    {/* Condition */}
                    {visibleColumns.includes('condition') && (
                      <div style={{ fontSize: '12px', color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.condition || '—'}
                      </div>
                    )}

                    {/* Brand */}
                    {visibleColumns.includes('brand') && (
                      <div style={{ fontSize: '12px', color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.brand || '—'}
                      </div>
                    )}

                    {/* Category */}
                    {visibleColumns.includes('category') && (
                      <div style={{ fontSize: '12px', color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.category || '—'}
                      </div>
                    )}

                    {/* Channels */}
                    {visibleColumns.includes('channels') && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['shopify', 'ebay', 'amazon'].map(ch => (
                          <ChannelDot
                            key={ch}
                            channel={ch}
                            cs={listing.listing_channels?.find(lc => lc.channel_type === ch)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    {visibleColumns.includes('status') && <StatusBadge status={listing.status} />}

                    {/* Created */}
                    {visibleColumns.includes('created') && (
                      <div style={{ fontSize: '12px', color: P.muted, whiteSpace: 'nowrap' }}>{fmtDate(listing.created_at)}</div>
                    )}

                    {/* ── Performance stats (SKU-linked from transactions) ── */}
                    {(() => {
                      const s = listing.sku ? stats[listing.sku] : null
                      const daysSupply = s && s.velocity > 0 ? listing.quantity / s.velocity : null

                      return (
                        <>
                          {visibleColumns.includes('performance') && (
                            <div>
                              {s ? (
                                <PerfTier velocity={s.velocity} units30d={s.units_30d} />
                              ) : (
                                <span style={{ fontSize: 11, color: P.rule }}>No data</span>
                              )}
                            </div>
                          )}

                          {visibleColumns.includes('velocity') && (
                            <div style={{ fontSize: 12, fontWeight: 600, color: P.ink, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {s ? (
                                <>
                                  <span>{s.units_7d}</span>
                                  <span style={{ fontSize: 10, color: P.muted, fontWeight: 400 }}> units</span>
                                </>
                              ) : <span style={{ color: P.rule }}>—</span>}
                            </div>
                          )}

                          {visibleColumns.includes('revenue_30d') && (
                            <div style={{ fontSize: 12, fontWeight: 600, color: s && s.revenue_30d > 0 ? P.emerald : '#9b9b98', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {s && s.revenue_30d > 0 ? `£${s.revenue_30d.toFixed(0)}` : '—'}
                            </div>
                          )}

                          {visibleColumns.includes('margin') && (
                            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap',
                              color: s?.margin_30d != null ? (s.margin_30d >= 20 ? P.emerald : s.margin_30d >= 10 ? P.amber : P.oxblood) : '#9b9b98' }}>
                              {s?.margin_30d != null ? `${s.margin_30d.toFixed(1)}%` : '—'}
                            </div>
                          )}

                          {visibleColumns.includes('supply') && (
                            <DaysSupply days={daysSupply} />
                          )}

                          {visibleColumns.includes('trend') && (
                            <div>
                              {s ? (
                                <Sparkline
                                  data={s.sparkline}
                                  color={s.units_7d >= 3 ? P.emerald : s.units_7d > 0 ? P.cobalt : P.ruleSoft}
                                />
                              ) : (
                                <Sparkline data={[0,0,0,0,0,0,0]} color={P.ruleSoft} />
                              )}
                            </div>
                          )}
                        </>
                      )
                    })()}

                    {/* ── v2 columns ── */}
                    {visibleColumns.includes('margin_pct') && (
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap',
                        color: listing.margin_pct != null ? (Number(listing.margin_pct) >= 20 ? P.emerald : Number(listing.margin_pct) >= 10 ? P.amber : P.oxblood) : '#9b9b98' }}>
                        {listing.margin_pct != null ? `${Number(listing.margin_pct).toFixed(1)}%` : '—'}
                      </div>
                    )}
                    {visibleColumns.includes('sold_30d') && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: P.ink, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {listing.sold_30d ?? 0}
                      </div>
                    )}
                    {visibleColumns.includes('primary_channel') && (
                      <div style={{ fontSize: 12, color: P.muted, whiteSpace: 'nowrap' }}>
                        {listing.primary_channel ? (CHANNEL_LABELS[listing.primary_channel] || listing.primary_channel) : '—'}
                      </div>
                    )}
                    {visibleColumns.includes('channel_count') && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: P.ink, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {listing.channel_count ?? 0}
                      </div>
                    )}
                    {visibleColumns.includes('last_sync_at') && (
                      <div style={{ fontSize: 11, color: P.muted, whiteSpace: 'nowrap' }}>
                        {listing.last_sync_at ? fmtDate(listing.last_sync_at) : '—'}
                      </div>
                    )}
                    {visibleColumns.includes('tags') && (
                      <div style={{ fontSize: 11, color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.tags && listing.tags.length > 0 ? listing.tags.slice(0, 3).join(', ') + (listing.tags.length > 3 ? ` +${listing.tags.length - 3}` : '') : '—'}
                      </div>
                    )}
                    {visibleColumns.includes('msrp') && (
                      <div style={{ fontSize: 12, color: P.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {listing.msrp != null ? `£${Number(listing.msrp).toFixed(2)}` : '—'}
                      </div>
                    )}
                    {visibleColumns.includes('competitor_price') && (
                      <div style={{ fontSize: 12, color: P.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {listing.competitor_price != null ? `£${Number(listing.competitor_price).toFixed(2)}` : '—'}
                      </div>
                    )}
                    {visibleColumns.includes('days_of_cover') && (
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap',
                        color: listing.days_of_cover != null ? (listing.days_of_cover < 7 ? P.oxblood : listing.days_of_cover < 21 ? P.amber : P.emerald) : '#9b9b98' }}>
                        {listing.days_of_cover != null ? `${listing.days_of_cover}d` : '—'}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${P.rule}`, background: P.bg }}>
                <div style={{ fontSize: '13px', color: P.muted }}>
                  Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} listings
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                    style={{ padding: '4px 8px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', color: P.ink, background: 'white', cursor: 'pointer' }}
                  >
                    {[25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ padding: '5px 10px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', cursor: page === 1 ? 'default' : 'pointer', background: 'white', color: page === 1 ? '#ccc' : P.ink }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pageNum = totalPages <= 7 ? i + 1 :
                        page <= 4 ? i + 1 :
                        page >= totalPages - 3 ? totalPages - 6 + i :
                        page - 3 + i
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          style={{
                            padding: '5px 9px',
                            border: `1px solid ${page === pageNum ? P.ink : P.rule}`,
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            background: page === pageNum ? P.ink : 'white',
                            color: page === pageNum ? 'white' : P.ink,
                            fontWeight: page === pageNum ? 600 : 400,
                          }}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    {totalPages > 7 && page < totalPages - 3 && (
                      <>
                        <span style={{ color: P.muted, fontSize: '12px' }}>...</span>
                        <button onClick={() => setPage(totalPages)} style={{ padding: '5px 9px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', background: 'white', color: P.ink }}>{totalPages}</button>
                      </>
                    )}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{ padding: '5px 10px', border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', cursor: page === totalPages ? 'default' : 'pointer', background: 'white', color: page === totalPages ? '#ccc' : P.ink }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* [feed:validator] Listing health drawer */}
      <HealthDrawer
        open={!!healthDrawerListing}
        onClose={() => { setHealthDrawerListing(null); reloadHealth() }}
        listingId={healthDrawerListing?.id ?? null}
        listingTitle={healthDrawerListing?.title ?? null}
      />
    </div>
  )
}

// ─── Header Cell ──────────────────────────────────────────────────────────────

function HeaderCell({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (f: SortField) => void
}) {
  const active = field && sortField === field
  return (
    <div
      onClick={() => field && onSort(field)}
      style={{
        ...LABEL,
        fontSize: '9px',
        color: active ? P.ink : P.muted,
        cursor: field ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {field && (
        <span style={{ color: active ? P.ink : P.rule, fontSize: '9px' }}>
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      )}
    </div>
  )
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({
  listing,
  tab,
  setTab,
  onClose,
  onNavigate,
  onSave,
  connectedChannels,
}: {
  listing: Listing
  tab: SidePanelTab
  setTab: (t: SidePanelTab) => void
  onClose: () => void
  onNavigate: () => void
  onSave: (field: string, value: string | number) => Promise<void>
  connectedChannels: string[]
}) {
  const errors = listing.listing_channels?.filter(lc => lc.error_message) || []

  const tabStyle = (t: SidePanelTab): React.CSSProperties => ({
    ...MONO,
    padding: '10px 16px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: tab === t ? P.ink : P.muted,
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${tab === t ? P.cobalt : 'transparent'}`,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: '-1px',
  })

  return (
    <>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', borderBottom: `1px solid ${P.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: P.ink, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
            {listing.sku && <div style={{ fontSize: '12px', color: P.muted, marginTop: '2px', fontFamily: 'monospace' }}>{listing.sku}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
            <button onClick={onNavigate} title="Open full page" style={{ background: 'none', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: P.muted, fontFamily: 'inherit' }}>↗</button>
            <button onClick={onClose} style={{ background: 'none', border: `1px solid ${P.rule}`, borderRadius: '2px', padding: '4px 8px', cursor: 'pointer', fontSize: '14px', color: P.muted }}>×</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: 'none' }}>
          <button style={tabStyle('details')} onClick={() => setTab('details')}>Details</button>
          <button style={tabStyle('channels')} onClick={() => setTab('channels')}>
            Channels {listing.listing_channels?.length > 0 && <span style={{ fontSize: '11px', color: P.muted, marginLeft: '3px' }}>({listing.listing_channels.length})</span>}
          </button>
          <button style={tabStyle('errors')} onClick={() => setTab('errors')}>
            Errors {errors.length > 0 && <span style={{ fontSize: '11px', background: 'rgba(125,42,26,0.10)', color: P.oxblood, padding: '1px 5px', borderRadius: '2px', marginLeft: '4px' }}>{errors.length}</span>}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {tab === 'details' && (
          <DetailsTab listing={listing} onSave={onSave} />
        )}
        {tab === 'channels' && (
          <ChannelsTab listing={listing} connectedChannels={connectedChannels} />
        )}
        {tab === 'errors' && (
          <ErrorsTab errors={errors} />
        )}
      </div>
    </>
  )
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ listing, onSave }: { listing: Listing; onSave: (field: string, value: string | number) => Promise<void> }) {
  const [editPrice, setEditPrice] = useState(false)
  const [editStock, setEditStock] = useState(false)
  const [priceVal, setPriceVal] = useState(String(listing.price))
  const [stockVal, setStockVal] = useState(String(listing.quantity))

  useEffect(() => {
    setPriceVal(String(listing.price))
    setStockVal(String(listing.quantity))
  }, [listing.price, listing.quantity])

  function labelStyle() {
    return { fontSize: '11px', fontWeight: 700, color: P.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '3px' }
  }
  function valStyle() {
    return { fontSize: '13px', color: P.ink, fontWeight: 500 }
  }
  function rowStyle() {
    return { marginBottom: '16px' }
  }

  return (
    <div>
      {/* Images */}
      {listing.images?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {listing.images.slice(0, 6).map((img, i) => (
              <div key={i} style={{ width: '72px', height: '72px', borderRadius: '2px', overflow: 'hidden', background: P.ruleSoft, border: `1px solid ${P.rule}` }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div style={rowStyle()}>
        <div style={labelStyle()}>Price</div>
        {editPrice ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              autoFocus
              type="number"
              value={priceVal}
              onChange={e => setPriceVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onSave('price', parseFloat(priceVal)); setEditPrice(false) }
                if (e.key === 'Escape') { setEditPrice(false); setPriceVal(String(listing.price)) }
              }}
              style={{ padding: '5px 8px', border: '1px solid #2383e2', borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '100px' }}
            />
            <button onClick={() => { onSave('price', parseFloat(priceVal)); setEditPrice(false) }} style={{ padding: '5px 10px', background: P.ink, color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            <button onClick={() => { setEditPrice(false); setPriceVal(String(listing.price)) }} style={{ padding: '5px 10px', background: 'none', color: P.muted, border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...valStyle(), fontSize: '16px', fontWeight: 700 }}>£{Number(listing.price).toFixed(2)}</span>
            <button onClick={() => setEditPrice(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: '12px', fontFamily: 'inherit', textDecoration: 'underline' }}>Edit</button>
          </div>
        )}
      </div>

      {/* Stock */}
      <div style={rowStyle()}>
        <div style={labelStyle()}>Stock</div>
        {editStock ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              autoFocus
              type="number"
              value={stockVal}
              onChange={e => setStockVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onSave('quantity', parseFloat(stockVal)); setEditStock(false) }
                if (e.key === 'Escape') { setEditStock(false); setStockVal(String(listing.quantity)) }
              }}
              style={{ padding: '5px 8px', border: '1px solid #2383e2', borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '80px' }}
            />
            <button onClick={() => { onSave('quantity', parseFloat(stockVal)); setEditStock(false) }} style={{ padding: '5px 10px', background: P.ink, color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            <button onClick={() => { setEditStock(false); setStockVal(String(listing.quantity)) }} style={{ padding: '5px 10px', background: 'none', color: P.muted, border: `1px solid ${P.rule}`, borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...valStyle(), color: listing.quantity === 0 ? P.oxblood : P.ink, fontWeight: listing.quantity === 0 ? 700 : 500 }}>
              {listing.quantity === 0 ? 'Out of stock' : `${listing.quantity} units`}
            </span>
            <button onClick={() => setEditStock(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: '12px', fontFamily: 'inherit', textDecoration: 'underline' }}>Edit</button>
          </div>
        )}
      </div>

      {/* Metadata grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #f1f1ef', paddingTop: '16px' }}>
        {[
          { label: 'Condition', value: listing.condition },
          { label: 'Brand', value: listing.brand },
          { label: 'Category', value: listing.category },
          { label: 'Created', value: fmtDate(listing.created_at) },
          { label: 'Status', value: <StatusBadge status={listing.status} /> },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={labelStyle()}>{label}</div>
            <div style={valStyle()}>{value || <span style={{ color: '#ccc' }}>—</span>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Channels Tab ─────────────────────────────────────────────────────────────

function ChannelsTab({ listing, connectedChannels }: { listing: Listing; connectedChannels: string[] }) {
  const allChannels = ['shopify', 'ebay', 'amazon']
  return (
    <div>
      {allChannels.map(ch => {
        const cs = listing.listing_channels?.find(lc => lc.channel_type === ch)
        const style = CHANNEL_STYLE[ch] || { bg: P.ruleSoft, color: P.ink }
        const connected = connectedChannels.includes(ch)
        return (
          <div
            key={ch}
            style={{
              border: `1px solid ${P.rule}`,
              borderRadius: '2px',
              padding: '14px',
              marginBottom: '10px',
              background: cs ? '#fafafa' : 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cs ? '8px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '2px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.ink }}>
                  {CHANNEL_SVG[ch] || null}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: P.ink }}>{CHANNEL_LABELS[ch] || ch}</span>
                {!connected && <span style={{ fontSize: '11px', color: P.muted }}>(not connected)</span>}
              </div>
              {cs ? (
                <StatusBadge status={cs.status} />
              ) : (
                <span style={{ fontSize: '12px', color: P.muted }}>Not published</span>
              )}
            </div>
            {cs && (
              <div style={{ fontSize: '12px', color: P.muted }}>
                {cs.last_synced_at && <div>Last sync: {fmtDate(cs.last_synced_at)}</div>}
                {cs.channel_url && (
                  <a href={cs.channel_url} target="_blank" rel="noopener noreferrer" style={{ color: P.cobalt, textDecoration: 'none', marginTop: '3px', display: 'inline-block' }}>
                    View on {CHANNEL_LABELS[ch]} →
                  </a>
                )}
                {cs.error_message && (
                  <div style={{ marginTop: '6px', padding: '6px 8px', background: 'rgba(125,42,26,0.06)', border: '1px solid rgba(125,42,26,0.12)', borderRadius: '5px', color: P.oxblood, fontSize: '12px' }}>
                    {cs.error_message}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Errors Tab ───────────────────────────────────────────────────────────────

function ErrorsTab({ errors }: { errors: ChannelStatus[] }) {
  if (errors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: P.muted }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
        <div style={{ fontSize: '13px' }}>No errors on this listing</div>
      </div>
    )
  }

  return (
    <div>
      {errors.map((e, i) => (
        <div
          key={i}
          style={{ border: '1px solid rgba(125,42,26,0.12)', borderRadius: '2px', padding: '14px', marginBottom: '10px', background: 'rgba(125,42,26,0.04)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: P.ink, display: 'flex', alignItems: 'center' }}>{CHANNEL_SVG[e.channel_type] || null}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: P.ink }}>{CHANNEL_LABELS[e.channel_type] || e.channel_type}</span>
            </div>
            <StatusBadge status={e.status} />
          </div>
          <div style={{ fontSize: '12px', color: P.oxblood, lineHeight: 1.5, marginBottom: '10px' }}>{e.error_message}</div>
          <button
            style={{ padding: '6px 12px', background: P.ink, color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Fix →
          </button>
        </div>
      ))}
    </div>
  )
}
