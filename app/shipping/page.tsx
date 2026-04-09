'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

/* ── Types ── */
type ShipmentStatus = 'In Transit' | 'Delivered' | 'Out for Delivery' | 'Exception'
type RuleStatus = 'Active' | 'Inactive'

interface Carrier {
  id: string
  name: string
  description: string
  initials: string
  color: string
  bg: string
}

interface LabelOrder {
  orderNum: string
  customer: string
  items: number
  weight: string
  service: string
  cost: string
}

interface Shipment {
  tracking: string
  carrier: string
  service: string
  destination: string
  dispatched: string
  status: ShipmentStatus
}

interface ShippingRule {
  id: string
  description: string
  carrier: string
  status: RuleStatus
}

/* ── Static data ── */
const CARRIERS: Carrier[] = [
  { id: 'royalmail', name: 'Royal Mail',    description: "UK's national postal service",              initials: 'RM',  color: '#CC0000', bg: '#fff0f0' },
  { id: 'evri',      name: 'Evri',          description: 'Budget-friendly UK parcel delivery',         initials: 'EV',  color: '#9b1fe8', bg: '#f5f0fe' },
  { id: 'dhl',       name: 'DHL Express',   description: 'International express shipping',             initials: 'DHL', color: '#D40511', bg: '#fff0f0' },
  { id: 'ups',       name: 'UPS',           description: 'Reliable global shipping',                  initials: 'UPS', color: '#351C15', bg: '#fdf8f0' },
  { id: 'fedex',     name: 'FedEx',         description: 'Priority international delivery',           initials: 'FX',  color: '#4D148C', bg: '#f4f0fc' },
  { id: 'dpd',       name: 'DPD',           description: 'Next-day UK delivery with 1-hour windows',  initials: 'DPD', color: '#DC0032', bg: '#fff0f3' },
]

const LABEL_QUEUE: LabelOrder[] = [
  { orderNum: '#10421', customer: 'James Whitfield',   items: 2, weight: '1.2 kg', service: 'Royal Mail 2nd Class',    cost: '£3.20' },
  { orderNum: '#10422', customer: 'Priya Sharma',       items: 1, weight: '0.4 kg', service: 'Evri Standard',           cost: '£2.49' },
  { orderNum: '#10423', customer: 'Tom Brewster',       items: 3, weight: '3.8 kg', service: 'DPD Next Day',            cost: '£8.99' },
  { orderNum: '#10424', customer: 'Mei-Ling Xu',        items: 1, weight: '0.2 kg', service: 'Royal Mail Large Letter', cost: '£1.65' },
  { orderNum: '#10425', customer: 'Carlos Navarro',     items: 2, weight: '6.1 kg', service: 'DHL Express',             cost: '£18.50' },
]

const SHIPMENTS: Shipment[] = [
  { tracking: 'JD000960016523',   carrier: 'Royal Mail', service: '1st Class Signed',    destination: 'London, UK',       dispatched: '2026-04-07', status: 'Delivered' },
  { tracking: 'EV992837461GB',    carrier: 'Evri',       service: 'Standard Parcel',      destination: 'Manchester, UK',   dispatched: '2026-04-06', status: 'In Transit' },
  { tracking: '1Z999AA10123456',  carrier: 'UPS',        service: 'UPS Ground',           destination: 'Berlin, DE',       dispatched: '2026-04-05', status: 'Out for Delivery' },
  { tracking: 'DHL4839201740',    carrier: 'DHL',        service: 'Express Worldwide',    destination: 'New York, US',     dispatched: '2026-04-04', status: 'In Transit' },
  { tracking: 'JD000960082947',   carrier: 'Royal Mail', service: 'Tracked 48',           destination: 'Birmingham, UK',   dispatched: '2026-04-03', status: 'Delivered' },
  { tracking: 'FX7289340021',     carrier: 'FedEx',      service: 'Priority International', destination: 'Sydney, AU',     dispatched: '2026-04-02', status: 'Exception' },
]

const RULES: ShippingRule[] = [
  { id: 'r1', description: 'Orders under 2 kg',      carrier: 'Evri Standard',                status: 'Active' },
  { id: 'r2', description: 'International orders',   carrier: 'DHL Express',                  status: 'Active' },
  { id: 'r3', description: 'Next-day orders',        carrier: 'Royal Mail Special Delivery',  status: 'Active' },
]

/* ── Status badge config ── */
const SHIPMENT_STATUS_STYLES: Record<ShipmentStatus, { bg: string; color: string; border: string }> = {
  'Delivered':       { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  'In Transit':      { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Out for Delivery':{ bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Exception':       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

function ShipmentBadge({ status }: { status: ShipmentStatus }) {
  const s = SHIPMENT_STATUS_STYLES[status]
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '3px 9px', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

/* ── Carrier logo area ── */
function CarrierLogo({ carrier }: { carrier: Carrier }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: carrier.bg,
      border: `1px solid ${carrier.color}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: carrier.initials.length > 2 ? 9 : 12,
      fontWeight: 800, color: carrier.color,
      letterSpacing: '-0.02em', flexShrink: 0,
    }}>
      {carrier.initials}
    </div>
  )
}

/* ── Page ── */
export default function ShippingPage() {
  useRouter()

  /* Carrier connect state: carrierId → { open: bool, apiKey: string, accountNo: string, saved: bool } */
  const [carrierForms, setCarrierForms] = useState<Record<string, { open: boolean; apiKey: string; accountNo: string; saved: boolean }>>(() =>
    Object.fromEntries(CARRIERS.map(c => [c.id, { open: false, apiKey: '', accountNo: '', saved: false }]))
  )

  const [rules, setRules] = useState<ShippingRule[]>(RULES)
  const [hoveredLabelRow, setHoveredLabelRow] = useState<string | null>(null)
  const [hoveredShipRow, setHoveredShipRow] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function toggleCarrierForm(id: string) {
    setCarrierForms(prev => ({
      ...prev,
      [id]: { ...prev[id], open: !prev[id].open },
    }))
  }

  function saveCarrier(id: string) {
    setCarrierForms(prev => ({
      ...prev,
      [id]: { ...prev[id], open: false, saved: true },
    }))
    const carrier = CARRIERS.find(c => c.id === id)
    showToast(`${carrier?.name} connected successfully`)
  }

  function toggleRule(id: string) {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r
    ))
  }

  const connectedCount = Object.values(carrierForms).filter(f => f.saved).length

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 11px',
    border: '1px solid #e8e5df',
    borderRadius: 7,
    fontSize: 13,
    color: '#1a1b22',
    background: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#9496b0',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: 'white', border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 10,
          padding: '14px 18px', fontSize: 13, fontWeight: 500, color: '#1a1b22',
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: '3px solid #059669',
        }}>
          <span style={{ color: '#059669' }}>✓</span> {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: 1060 }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Shipping</h1>
            <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>
              Connect carriers, print labels and track shipments in one place.
            </p>
          </div>

          {/* ══════════════════════════════
              CARRIER CONNECTIONS
          ══════════════════════════════ */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Section header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={sectionLabel}>Carrier connections</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginTop: 4 }}>
                  {connectedCount === 0 ? 'No carriers connected' : `${connectedCount} carrier${connectedCount !== 1 ? 's' : ''} connected`}
                </div>
                <div style={{ fontSize: 13, color: '#6b6e87', marginTop: 2 }}>
                  Connect your carrier accounts to print labels and track shipments.
                </div>
              </div>
              {connectedCount > 0 && (
                <span style={{
                  background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                  borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '4px 12px',
                }}>
                  {connectedCount} active
                </span>
              )}
            </div>

            {/* Carrier grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#f0ede8' }}>
              {CARRIERS.map(carrier => {
                const cf = carrierForms[carrier.id]
                const isSaved = cf.saved
                return (
                  <div key={carrier.id} style={{ background: 'white', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <CarrierLogo carrier={carrier} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1b22', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {carrier.name}
                          {isSaved && (
                            <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>
                              Connected
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b6e87', lineHeight: 1.4 }}>{carrier.description}</div>
                      </div>
                    </div>

                    {/* Connect form (inline) */}
                    {cf.open && !isSaved && (
                      <div style={{ marginBottom: 12, padding: '14px', background: '#fafaf9', borderRadius: 8, border: '1px solid #e8e5df' }}>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                            API Key
                          </label>
                          <input
                            style={inputStyle}
                            placeholder="Enter API key"
                            value={cf.apiKey}
                            onChange={e => setCarrierForms(prev => ({ ...prev, [carrier.id]: { ...prev[carrier.id], apiKey: e.target.value } }))}
                          />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                            Account Number
                          </label>
                          <input
                            style={inputStyle}
                            placeholder="Enter account number"
                            value={cf.accountNo}
                            onChange={e => setCarrierForms(prev => ({ ...prev, [carrier.id]: { ...prev[carrier.id], accountNo: e.target.value } }))}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => saveCarrier(carrier.id)}
                            style={{
                              background: '#5b52f5', color: 'white', border: 'none', borderRadius: 7,
                              padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => toggleCarrierForm(carrier.id)}
                            style={{
                              background: 'white', color: '#6b6e87', border: '1px solid #e8e5df', borderRadius: 7,
                              padding: '8px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => isSaved ? undefined : toggleCarrierForm(carrier.id)}
                      style={{
                        background: isSaved ? '#f5f3ef' : '#5b52f5',
                        color: isSaved ? '#9496b0' : 'white',
                        border: isSaved ? '1px solid #e8e5df' : 'none',
                        borderRadius: 7, padding: '8px 14px',
                        fontSize: 12, fontWeight: 600,
                        cursor: isSaved ? 'default' : 'pointer',
                        fontFamily: 'inherit', width: '100%',
                      }}
                    >
                      {isSaved ? 'Connected' : cf.open ? 'Cancel' : 'Connect API'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ══════════════════════════════
              LABEL QUEUE
          ══════════════════════════════ */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={sectionLabel}>Label queue</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginTop: 4 }}>Ready to ship</div>
                <div style={{ fontSize: 13, color: '#6b6e87', marginTop: 2 }}>Orders awaiting labels</div>
              </div>
              <button
                onClick={() => showToast('Printing all labels…')}
                style={{
                  background: '#5b52f5', color: 'white', border: 'none', borderRadius: 8,
                  padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="10" height="7" rx="1"/>
                  <path d="M4 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  <path d="M4 10h6"/>
                </svg>
                Print all labels
              </button>
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 1.4fr 60px 80px 1fr 80px 110px',
              padding: '10px 24px',
              borderBottom: '1px solid #f0ede8',
              background: '#fafaf9',
            }}>
              {['Order #', 'Customer', 'Items', 'Weight', 'Service', 'Cost', 'Action'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>

            {LABEL_QUEUE.map((order, i) => {
              const isHovered = hoveredLabelRow === order.orderNum
              return (
                <div
                  key={order.orderNum}
                  onMouseEnter={() => setHoveredLabelRow(order.orderNum)}
                  onMouseLeave={() => setHoveredLabelRow(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1.4fr 60px 80px 1fr 80px 110px',
                    padding: '13px 24px',
                    borderBottom: i < LABEL_QUEUE.length - 1 ? '1px solid #f0ede8' : 'none',
                    alignItems: 'center',
                    background: isHovered ? '#f9f8f6' : 'white',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#5b52f5', fontFamily: 'ui-monospace, monospace' }}>{order.orderNum}</div>
                  <div style={{ fontSize: 13, color: '#1a1b22', fontWeight: 500 }}>{order.customer}</div>
                  <div style={{ fontSize: 13, color: '#6b6e87' }}>{order.items}</div>
                  <div style={{ fontSize: 13, color: '#6b6e87', fontFamily: 'ui-monospace, monospace' }}>{order.weight}</div>
                  <div style={{ fontSize: 12, color: '#6b6e87' }}>{order.service}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', fontFamily: 'ui-monospace, monospace' }}>{order.cost}</div>
                  <div>
                    <button
                      onClick={() => showToast(`Printing label for ${order.orderNum}…`)}
                      style={{
                        background: 'white', color: '#5b52f5',
                        border: '1px solid #5b52f5', borderRadius: 7,
                        padding: '7px 12px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="10" height="7" rx="1"/>
                        <path d="M4 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        <path d="M4 10h6"/>
                      </svg>
                      Print label
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ══════════════════════════════
              RECENT SHIPMENTS
          ══════════════════════════════ */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8' }}>
              <div style={sectionLabel}>Recent shipments</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginTop: 4 }}>Shipment tracker</div>
              <div style={{ fontSize: 13, color: '#6b6e87', marginTop: 2 }}>Live status across all carriers</div>
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '160px 90px 1fr 1fr 95px 130px',
              padding: '10px 24px',
              borderBottom: '1px solid #f0ede8',
              background: '#fafaf9',
            }}>
              {['Tracking #', 'Carrier', 'Service', 'Destination', 'Dispatched', 'Status'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>

            {SHIPMENTS.map((s, i) => {
              const isHovered = hoveredShipRow === s.tracking
              return (
                <div
                  key={s.tracking}
                  onMouseEnter={() => setHoveredShipRow(s.tracking)}
                  onMouseLeave={() => setHoveredShipRow(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 90px 1fr 1fr 95px 130px',
                    padding: '13px 24px',
                    borderBottom: i < SHIPMENTS.length - 1 ? '1px solid #f0ede8' : 'none',
                    alignItems: 'center',
                    background: isHovered ? '#f9f8f6' : 'white',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#5b52f5', fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.tracking}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6e87', fontWeight: 500 }}>{s.carrier}</div>
                  <div style={{ fontSize: 12, color: '#6b6e87' }}>{s.service}</div>
                  <div style={{ fontSize: 13, color: '#1a1b22', fontWeight: 500 }}>{s.destination}</div>
                  <div style={{ fontSize: 12, color: '#9496b0' }}>
                    {new Date(s.dispatched).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div><ShipmentBadge status={s.status} /></div>
                </div>
              )
            })}
          </div>

          {/* ══════════════════════════════
              SHIPPING RULES
          ══════════════════════════════ */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={sectionLabel}>Shipping rules</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginTop: 4 }}>Routing rules</div>
                <div style={{ fontSize: 13, color: '#6b6e87', marginTop: 2 }}>
                  Automatically select the best carrier based on order criteria
                </div>
              </div>
              <button
                onClick={() => showToast('Rule builder coming soon')}
                style={{
                  background: 'white', color: '#5b52f5', border: '1px solid #5b52f5',
                  borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add rule
              </button>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rules.map(rule => {
                const isActive = rule.status === 'Active'
                return (
                  <div
                    key={rule.id}
                    style={{
                      border: `1px solid ${isActive ? '#e8e5df' : '#f0ede8'}`,
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      background: isActive ? 'white' : '#fafaf9',
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    {/* Active indicator dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: isActive ? '#059669' : '#9496b0',
                      boxShadow: isActive ? '0 0 0 3px #a7f3d040' : 'none',
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 2 }}>
                        {rule.description}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6e87' }}>
                        Route to: <span style={{ fontWeight: 600, color: '#5b52f5' }}>{rule.carrier}</span>
                      </div>
                    </div>

                    <span style={{
                      background: isActive ? '#ecfdf5' : '#f5f3ef',
                      color: isActive ? '#059669' : '#9496b0',
                      border: `1px solid ${isActive ? '#a7f3d0' : '#e8e5df'}`,
                      borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '3px 9px',
                    }}>
                      {rule.status}
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => showToast('Rule editor coming soon')}
                      style={{
                        background: 'white', color: '#6b6e87', border: '1px solid #e8e5df',
                        borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2l2 2L4 10H2V8L8 2z"/>
                      </svg>
                      Edit
                    </button>

                    {/* Toggle button */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      style={{
                        background: isActive ? '#fef2f2' : '#ecfdf5',
                        color: isActive ? '#dc2626' : '#059669',
                        border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                        borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
