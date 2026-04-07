'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

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
}

type DensityMode = 'compact' | 'comfortable' | 'spacious'
type SortField = 'title' | 'price' | 'quantity' | 'status' | 'created_at' | null
type SortDir = 'asc' | 'desc'
type SidePanelTab = 'details' | 'channels' | 'errors'

type FilterState = {
  status: string
  channel: string
  priceMin: string
  priceMax: string
  hasErrors: boolean
  health: string
  search: string
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

const ALL_COLUMNS = ['image', 'sku', 'price', 'stock', 'condition', 'brand', 'category', 'channels', 'status', 'created']

const DEFAULT_COLUMNS = ['image', 'sku', 'price', 'stock', 'channels', 'status']

const DENSITY_ROW_HEIGHT: Record<DensityMode, number> = {
  compact: 32,
  comfortable: 44,
  spacious: 56,
}

const STATUS_COLOUR: Record<string, string> = {
  published: '#0f7b6c',
  failed: '#c9372c',
  pending: '#9b9b98',
  draft: '#9b9b98',
}

const CHANNEL_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  amazon: 'Amazon',
  ebay: 'eBay',
}

const CHANNEL_STYLE: Record<string, { bg: string; color: string }> = {
  shopify: { bg: '#e8f1fb', color: '#2383e2' },
  ebay: { bg: '#fff0e6', color: '#d9730d' },
  amazon: { bg: '#fff3e6', color: '#d9730d' },
}

const CHANNEL_ICONS: Record<string, string> = {
  shopify: '🛍️',
  amazon: '📦',
  ebay: '🛒',
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all',
  channel: 'all',
  priceMin: '',
  priceMax: '',
  hasErrors: false,
  health: 'all',
  search: '',
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
  const color = STATUS_COLOUR[status] || '#9b9b98'
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        color,
        background: color + '18',
        padding: '2px 7px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

function ChannelDot({ channel, cs }: { channel: string; cs?: ChannelStatus }) {
  const colour = cs ? (STATUS_COLOUR[cs.status] || '#9b9b98') : '#e0e0dc'
  const style = CHANNEL_STYLE[channel]
  return (
    <div
      title={cs ? `${CHANNEL_LABELS[channel] || channel}: ${cs.status}` : `${CHANNEL_LABELS[channel] || channel}: not published`}
      style={{
        width: '22px',
        height: '22px',
        borderRadius: '5px',
        background: cs && style ? style.bg : '#f1f1ef',
        border: `1px solid ${colour}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        flexShrink: 0,
      }}
    >
      {CHANNEL_ICONS[channel]}
    </div>
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
          fontFamily: 'Inter, sans-serif',
          color: '#191919',
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
        color: '#191919',
        cursor: 'text',
        padding: '1px 4px',
        borderRadius: '3px',
        border: '1px solid transparent',
        display: 'inline-block',
        minWidth: '40px',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8e5' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent' }}
    >
      {prefix}{type === 'number' && prefix === '£' ? Number(value).toFixed(2) : value}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const router = useRouter()

  // Core data
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

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
    setDensity(lsGet('auxio_density', 'comfortable'))
    setVisibleColumns(lsGet('auxio_columns', DEFAULT_COLUMNS))
    const saved = lsGet<SavedView[]>('auxio_views', [])
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
    if (sortField) {
      out = [...out].sort((a, b) => {
        let av: any = a[sortField as keyof Listing]
        let bv: any = b[sortField as keyof Listing]
        if (typeof av === 'string') av = av.toLowerCase()
        if (typeof bv === 'string') bv = bv.toLowerCase()
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return out
  }, [listings, filters, sortField, sortDir])

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
    lsSet('auxio_views', userViews)
    setActiveViewId(view.id)
    setNewViewName('')
    setSaveViewOpen(false)
    showToast(`View "${view.name}" saved`)
  }

  function deleteView(id: string) {
    const userViews = views.filter(v => v.id !== '__all__' && v.id !== id)
    setViews([DEFAULT_VIEWS[0], ...userViews])
    lsSet('auxio_views', userViews)
    if (activeViewId === id) applyView(DEFAULT_VIEWS[0])
  }

  // ── Column persistence ────────────────────────────────────────────────────────

  function toggleColumn(col: string) {
    setVisibleColumns(prev => {
      const next = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
      lsSet('auxio_columns', next)
      return next
    })
  }

  // ── Density persistence ───────────────────────────────────────────────────────

  function setDensityAndSave(d: DensityMode) {
    setDensity(d)
    lsSet('auxio_density', d)
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
    if (visibleColumns.includes('image')) parts.push('44px')
    parts.push('1fr') // title always visible
    if (visibleColumns.includes('sku')) parts.push('90px')
    if (visibleColumns.includes('price')) parts.push('80px')
    if (visibleColumns.includes('stock')) parts.push('70px')
    if (visibleColumns.includes('condition')) parts.push('100px')
    if (visibleColumns.includes('brand')) parts.push('100px')
    if (visibleColumns.includes('category')) parts.push('110px')
    if (visibleColumns.includes('channels')) parts.push('110px')
    if (visibleColumns.includes('status')) parts.push('100px')
    if (visibleColumns.includes('created')) parts.push('110px')
    return parts.join(' ')
  }

  const gridCols = buildGridCols()
  const rowH = DENSITY_ROW_HEIGHT[density]

  // ── Sort indicator ────────────────────────────────────────────────────────────

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span style={{ color: '#ccc', fontSize: '10px', marginLeft: '4px' }}>↕</span>
    return <span style={{ color: '#191919', fontSize: '10px', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
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
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
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
          background: 'white',
          borderLeft: '1px solid #e8e8e5',
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
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', margin: 0, letterSpacing: '-0.02em' }}>Listings</h1>
              <p style={{ fontSize: '13px', color: '#787774', margin: '4px 0 0' }}>
                {listings.length} listing{listings.length !== 1 ? 's' : ''} · create once, publish everywhere
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => router.push('/listings/import')}
                style={{ padding: '9px 16px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Import CSV
              </button>
              <button
                onClick={() => router.push('/listings/new')}
                style={{ padding: '9px 18px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                + New listing
              </button>
            </div>
          </div>

          {/* ── Saved View Tabs ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #e8e8e5', paddingBottom: '0' }}>
            {views.map(view => (
              <div key={view.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => applyView(view)}
                  style={{
                    padding: '7px 14px',
                    fontSize: '13px',
                    fontWeight: activeViewId === view.id ? 600 : 500,
                    color: activeViewId === view.id ? '#191919' : '#787774',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeViewId === view.id ? '2px solid #191919' : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b98', fontSize: '12px', padding: '0 4px', marginLeft: '-6px' }}
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
                style={{ padding: '6px 10px', fontSize: '12px', color: '#787774', background: 'none', border: '1px dashed #e8e8e5', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                + Save view
              </button>
              {saveViewOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e8e8e5', borderRadius: '8px', padding: '12px', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', width: '220px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#787774', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Save current view</div>
                  <input
                    autoFocus
                    value={newViewName}
                    onChange={e => setNewViewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveCurrentView()}
                    placeholder="View name..."
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button onClick={saveCurrentView} style={{ flex: 1, padding: '6px', background: '#191919', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save</button>
                    <button onClick={() => setSaveViewOpen(false)} style={{ flex: 1, padding: '6px', background: 'white', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '280px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9b9b98', fontSize: '13px' }}>⌕</span>
              <input
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                placeholder="Search title, SKU, brand..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', background: 'white', boxSizing: 'border-box' }}
              />
            </div>

            {/* Filter dropdown */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterPanelOpen(v => !v)}
                style={{
                  padding: '8px 14px',
                  background: activeFilterChips.length > 0 ? '#191919' : 'white',
                  color: activeFilterChips.length > 0 ? 'white' : '#191919',
                  border: '1px solid #e8e8e5',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Filter{activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''} ▾
              </button>

              {filterPanelOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', width: '280px', minWidth: '260px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#787774', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filters</div>

                  {/* Status */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '6px' }}>Status</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {['all', 'draft', 'published', 'failed', 'missing_images'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateFilter('status', s)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            border: `1px solid ${filters.status === s ? '#191919' : '#e8e8e5'}`,
                            borderRadius: '5px',
                            background: filters.status === s ? '#191919' : 'white',
                            color: filters.status === s ? 'white' : '#787774',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
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
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '6px' }}>Channel</label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {['all', 'shopify', 'ebay', 'amazon'].map(ch => (
                        <button
                          key={ch}
                          onClick={() => updateFilter('channel', ch)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            border: `1px solid ${filters.channel === ch ? '#191919' : '#e8e8e5'}`,
                            borderRadius: '5px',
                            background: filters.channel === ch ? '#191919' : 'white',
                            color: filters.channel === ch ? 'white' : '#787774',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
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
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '6px' }}>Price Range</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Min £"
                        value={filters.priceMin}
                        onChange={e => updateFilter('priceMin', e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                      />
                      <span style={{ color: '#9b9b98', fontSize: '12px' }}>–</span>
                      <input
                        type="number"
                        placeholder="Max £"
                        value={filters.priceMax}
                        onChange={e => updateFilter('priceMax', e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Has errors + Not published */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#191919' }}>
                      <input type="checkbox" checked={filters.hasErrors} onChange={e => updateFilter('hasErrors', e.target.checked)} style={{ accentColor: '#191919' }} />
                      Has channel errors
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#191919' }}>
                      <input
                        type="checkbox"
                        checked={filters.health === 'incomplete'}
                        onChange={e => updateFilter('health', e.target.checked ? 'incomplete' : 'all')}
                        style={{ accentColor: '#191919' }}
                      />
                      Not published anywhere
                    </label>
                  </div>

                  {activeFilterChips.length > 0 && (
                    <button onClick={clearAllFilters} style={{ fontSize: '12px', color: '#c9372c', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, padding: '0' }}>
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Column visibility */}
            <div ref={colMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setColMenuOpen(v => !v)}
                style={{ padding: '8px 14px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Columns ▾
              </button>
              {colMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '12px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '170px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#787774', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Columns</div>
                  {ALL_COLUMNS.map(col => (
                    <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: '#191919' }}>
                      <input type="checkbox" checked={visibleColumns.includes(col)} onChange={() => toggleColumn(col)} style={{ accentColor: '#191919' }} />
                      {col.charAt(0).toUpperCase() + col.slice(1)}
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
                style={{ padding: '8px 12px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                ☰
              </button>
              {densityOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '8px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '150px' }}>
                  {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDensityAndSave(d)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: density === d ? '#f5f3ef' : 'none',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: density === d ? 600 : 400,
                        color: '#191919',
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
                    background: '#f1f1ef',
                    border: '1px solid #e8e8e5',
                    borderRadius: '20px',
                    fontSize: '12px',
                    color: '#191919',
                    fontWeight: 500,
                  }}
                >
                  {chip.label}
                  <button
                    onClick={() => {
                      if (chip.key === 'hasErrors') updateFilter('hasErrors', false)
                      else if (chip.key === 'health') updateFilter('health', 'all')
                      else updateFilter(chip.key, chip.key === 'status' || chip.key === 'channel' ? 'all' : '')
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#787774', fontSize: '14px', lineHeight: 1, padding: '0', display: 'flex', alignItems: 'center' }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button onClick={clearAllFilters} style={{ fontSize: '12px', color: '#787774', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
                Clear all
              </button>
            </div>
          )}

          {/* ── Bulk action bar ── */}
          {someSelected && (
            <div style={{ background: '#191919', color: 'white', borderRadius: '9px', padding: '10px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{selected.size} selected</span>

              {/* Select all results */}
              {selected.size < filtered.length && (
                <button
                  onClick={selectAllResults}
                  style={{ fontSize: '12px', color: '#9b9b98', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}
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
                        style={{ padding: '4px 9px', background: on ? 'rgba(255,255,255,0.15)' : 'transparent', color: on ? 'white' : '#666', border: `1px solid ${on ? 'rgba(255,255,255,0.3)' : '#444'}`, borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch] || ch}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Bulk Edit dropdown */}
              <div ref={bulkEditRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setBulkEditMenuOpen(v => !v)}
                  style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Edit Field ▾
                </button>
                {bulkEditMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '8px', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '200px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#787774', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Edit field</div>
                    {(['price', 'quantity', 'condition', 'brand', 'category'] as BulkEditField[]).map(f => (
                      <button
                        key={f!}
                        onClick={() => { setBulkEditField(f); setBulkEditValue('') }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: bulkEditField === f ? '#f5f3ef' : 'none', border: 'none', borderRadius: '6px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', cursor: 'pointer', fontWeight: bulkEditField === f ? 600 : 400 }}
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
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={applyBulkEdit}
                          style={{ width: '100%', marginTop: '6px', padding: '7px', background: '#191919', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
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
                  style={{ padding: '7px 14px', background: '#0f7b6c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: (bulkPublishing || bulkChannels.size === 0) ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: bulkChannels.size === 0 ? 0.5 : 1 }}
                >
                  {bulkPublishing ? 'Publishing...' : `Publish${bulkChannels.size ? ' to ' + Array.from(bulkChannels).map(c => CHANNEL_LABELS[c] || c).join(' + ') : '…'}`}
                </button>
                <button
                  onClick={bulkDelete}
                  disabled={bulkDeleting}
                  style={{ padding: '7px 14px', background: '#c9372c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: bulkDeleting ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  {bulkDeleting ? 'Deleting...' : `Delete (${selected.size})`}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  style={{ padding: '7px 12px', background: 'none', color: '#9b9b98', border: '1px solid #444', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Table / Empty states ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9b9b98', fontSize: '14px' }}>Loading...</div>
          ) : filtered.length === 0 && listings.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e8e5', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#191919', margin: '0 0 8px' }}>No listings yet</h2>
              <p style={{ fontSize: '13px', color: '#787774', margin: '0 0 24px' }}>Create your first listing and publish it to Shopify, eBay, and Amazon in one go.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => router.push('/listings/import')} style={{ padding: '10px 18px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Import CSV</button>
                <button onClick={() => router.push('/listings/new')} style={{ padding: '10px 20px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Create listing</button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e8e8e5', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#9b9b98' }}>No listings match these filters</div>
              <button onClick={clearAllFilters} style={{ marginTop: '10px', fontSize: '13px', color: '#2383e2', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e8e8e5', overflow: 'hidden' }}>

              {/* Sticky header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                alignItems: 'center',
                gap: '10px',
                padding: '0 16px',
                height: '36px',
                borderBottom: '1px solid #e8e8e5',
                background: '#fafafa',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <div onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} style={{ accentColor: '#191919', cursor: 'pointer' }} />
                </div>
                {visibleColumns.includes('image') && <div />}
                <HeaderCell label="Product" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                {visibleColumns.includes('sku') && <HeaderCell label="SKU" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('price') && <HeaderCell label="Price" field="price" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('stock') && <HeaderCell label="Stock" field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('condition') && <HeaderCell label="Condition" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('brand') && <HeaderCell label="Brand" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('category') && <HeaderCell label="Category" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('channels') && <HeaderCell label="Channels" field={null} sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('status') && <HeaderCell label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
                {visibleColumns.includes('created') && <HeaderCell label="Created" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />}
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
                      background: isSelected ? '#f0f4ff' : selectedListing?.id === listing.id ? '#fafafa' : 'white',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected && selectedListing?.id !== listing.id) (e.currentTarget as HTMLDivElement).style.background = '#fafafa' }}
                    onMouseLeave={e => { if (!isSelected && selectedListing?.id !== listing.id) (e.currentTarget as HTMLDivElement).style.background = 'white' }}
                  >
                    {/* Checkbox */}
                    <div onClick={e => toggleOne(listing.id, e)}>
                      <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: '#191919', cursor: 'pointer' }} />
                    </div>

                    {/* Thumbnail */}
                    {visibleColumns.includes('image') && (
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f1ef', overflow: 'hidden', flexShrink: 0 }}>
                        {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                    )}

                    {/* Title */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
                      {density !== 'compact' && (
                        <div style={{ fontSize: '11px', color: '#9b9b98', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {[listing.condition, listing.brand].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>

                    {/* SKU */}
                    {visibleColumns.includes('sku') && (
                      <div style={{ fontSize: '12px', color: '#787774', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      <div style={{ fontSize: '12px', color: '#787774', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.condition || '—'}
                      </div>
                    )}

                    {/* Brand */}
                    {visibleColumns.includes('brand') && (
                      <div style={{ fontSize: '12px', color: '#787774', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.brand || '—'}
                      </div>
                    )}

                    {/* Category */}
                    {visibleColumns.includes('category') && (
                      <div style={{ fontSize: '12px', color: '#787774', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      <div style={{ fontSize: '12px', color: '#9b9b98', whiteSpace: 'nowrap' }}>{fmtDate(listing.created_at)}</div>
                    )}
                  </div>
                )
              })}

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f1ef', background: '#fafafa' }}>
                <div style={{ fontSize: '13px', color: '#787774' }}>
                  Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} listings
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                    style={{ padding: '4px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', background: 'white', cursor: 'pointer' }}
                  >
                    {[25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ padding: '5px 10px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', cursor: page === 1 ? 'default' : 'pointer', background: 'white', color: page === 1 ? '#ccc' : '#191919' }}
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
                            border: `1px solid ${page === pageNum ? '#191919' : '#e8e8e5'}`,
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            background: page === pageNum ? '#191919' : 'white',
                            color: page === pageNum ? 'white' : '#191919',
                            fontWeight: page === pageNum ? 600 : 400,
                          }}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    {totalPages > 7 && page < totalPages - 3 && (
                      <>
                        <span style={{ color: '#9b9b98', fontSize: '12px' }}>...</span>
                        <button onClick={() => setPage(totalPages)} style={{ padding: '5px 9px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', cursor: 'pointer', background: 'white', color: '#191919' }}>{totalPages}</button>
                      </>
                    )}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{ padding: '5px 10px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', cursor: page === totalPages ? 'default' : 'pointer', background: 'white', color: page === totalPages ? '#ccc' : '#191919' }}
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
        fontSize: '11px',
        fontWeight: 700,
        color: active ? '#191919' : '#787774',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
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
        <span style={{ color: active ? '#191919' : '#ccc', fontSize: '10px' }}>
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

  const tabStyle = (t: SidePanelTab) => ({
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: tab === t ? 600 : 500,
    color: tab === t ? '#191919' : '#787774',
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${tab === t ? '#191919' : 'transparent'}`,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '-1px',
  })

  return (
    <>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid #e8e8e5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#191919', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
            {listing.sku && <div style={{ fontSize: '12px', color: '#9b9b98', marginTop: '2px', fontFamily: 'monospace' }}>{listing.sku}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
            <button onClick={onNavigate} title="Open full page" style={{ background: 'none', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: '#787774', fontFamily: 'Inter, sans-serif' }}>↗</button>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '14px', color: '#787774' }}>×</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: 'none' }}>
          <button style={tabStyle('details')} onClick={() => setTab('details')}>Details</button>
          <button style={tabStyle('channels')} onClick={() => setTab('channels')}>
            Channels {listing.listing_channels?.length > 0 && <span style={{ fontSize: '11px', color: '#9b9b98', marginLeft: '3px' }}>({listing.listing_channels.length})</span>}
          </button>
          <button style={tabStyle('errors')} onClick={() => setTab('errors')}>
            Errors {errors.length > 0 && <span style={{ fontSize: '11px', background: '#c9372c18', color: '#c9372c', padding: '1px 5px', borderRadius: '10px', marginLeft: '4px' }}>{errors.length}</span>}
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
    return { fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '3px' }
  }
  function valStyle() {
    return { fontSize: '13px', color: '#191919', fontWeight: 500 }
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
              <div key={i} style={{ width: '72px', height: '72px', borderRadius: '8px', overflow: 'hidden', background: '#f1f1ef', border: '1px solid #e8e8e5' }}>
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
              style={{ padding: '5px 8px', border: '1px solid #2383e2', borderRadius: '5px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', width: '100px' }}
            />
            <button onClick={() => { onSave('price', parseFloat(priceVal)); setEditPrice(false) }} style={{ padding: '5px 10px', background: '#191919', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save</button>
            <button onClick={() => { setEditPrice(false); setPriceVal(String(listing.price)) }} style={{ padding: '5px 10px', background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...valStyle(), fontSize: '16px', fontWeight: 700 }}>£{Number(listing.price).toFixed(2)}</span>
            <button onClick={() => setEditPrice(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b98', fontSize: '12px', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>Edit</button>
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
              style={{ padding: '5px 8px', border: '1px solid #2383e2', borderRadius: '5px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', width: '80px' }}
            />
            <button onClick={() => { onSave('quantity', parseFloat(stockVal)); setEditStock(false) }} style={{ padding: '5px 10px', background: '#191919', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save</button>
            <button onClick={() => { setEditStock(false); setStockVal(String(listing.quantity)) }} style={{ padding: '5px 10px', background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...valStyle(), color: listing.quantity === 0 ? '#c9372c' : '#191919', fontWeight: listing.quantity === 0 ? 700 : 500 }}>
              {listing.quantity === 0 ? 'Out of stock' : `${listing.quantity} units`}
            </span>
            <button onClick={() => setEditStock(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b98', fontSize: '12px', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>Edit</button>
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
        const style = CHANNEL_STYLE[ch] || { bg: '#f1f1ef', color: '#191919' }
        const connected = connectedChannels.includes(ch)
        return (
          <div
            key={ch}
            style={{
              border: '1px solid #e8e8e5',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '10px',
              background: cs ? '#fafafa' : 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cs ? '8px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                  {CHANNEL_ICONS[ch]}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{CHANNEL_LABELS[ch] || ch}</span>
                {!connected && <span style={{ fontSize: '11px', color: '#9b9b98' }}>(not connected)</span>}
              </div>
              {cs ? (
                <StatusBadge status={cs.status} />
              ) : (
                <span style={{ fontSize: '12px', color: '#9b9b98' }}>Not published</span>
              )}
            </div>
            {cs && (
              <div style={{ fontSize: '12px', color: '#787774' }}>
                {cs.last_synced_at && <div>Last sync: {fmtDate(cs.last_synced_at)}</div>}
                {cs.channel_url && (
                  <a href={cs.channel_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2383e2', textDecoration: 'none', marginTop: '3px', display: 'inline-block' }}>
                    View on {CHANNEL_LABELS[ch]} →
                  </a>
                )}
                {cs.error_message && (
                  <div style={{ marginTop: '6px', padding: '6px 8px', background: '#c9372c10', border: '1px solid #c9372c20', borderRadius: '5px', color: '#c9372c', fontSize: '12px' }}>
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
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9b9b98' }}>
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
          style={{ border: '1px solid #c9372c20', borderRadius: '8px', padding: '14px', marginBottom: '10px', background: '#c9372c08' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>{CHANNEL_ICONS[e.channel_type] || '❌'}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{CHANNEL_LABELS[e.channel_type] || e.channel_type}</span>
            </div>
            <StatusBadge status={e.status} />
          </div>
          <div style={{ fontSize: '12px', color: '#c9372c', lineHeight: 1.5, marginBottom: '10px' }}>{e.error_message}</div>
          <button
            style={{ padding: '6px 12px', background: '#191919', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Fix →
          </button>
        </div>
      ))}
    </div>
  )
}
