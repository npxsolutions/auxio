'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

interface PendingAction {
  id: string
  action_type: string
  title: string
  description: string
  reason: string
  profit_impact: number
  urgency: string
  created_at: string
}

const ACTION_ICONS: Record<string, string> = {
  reprice:          '💰',
  negative_keyword: '🚫',
  pause_campaign:   '⏸',
  reorder:          '📦',
  bid_adjustment:   '📈',
  default:          '⚡',
}

const URGENCY_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#fce8e6', color: '#c9372c' },
  high:     { bg: '#fff3e6', color: '#c97a2c' },
  medium:   { bg: '#fff9e6', color: '#b89a2c' },
  low:      { bg: '#f1f1ef', color: '#787774' },
}

export default function AgentPage() {
  const router = useRouter()
  const [actions, setActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('agent_pending_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('profit_impact', { ascending: false })

    setActions(data || [])
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function approve(actionId: string) {
    setActing(actionId)
    try {
      const res = await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId }),
      })
      if (res.ok) {
        setActions(prev => prev.filter(a => a.id !== actionId))
        showToast('Action approved and executed')
      } else {
        showToast('Failed to approve — please try again')
      }
    } catch {
      showToast('Error — please try again')
    } finally {
      setActing(null)
    }
  }

  async function dismiss(actionId: string) {
    setActing(actionId)
    try {
      const res = await fetch('/api/agent/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId }),
      })
      if (res.ok) {
        setActions(prev => prev.filter(a => a.id !== actionId))
        showToast('Action dismissed')
      } else {
        showToast('Failed to dismiss — please try again')
      }
    } catch {
      showToast('Error — please try again')
    } finally {
      setActing(null)
    }
  }

  const totalImpact = actions.reduce((sum, a) => sum + (a.profit_impact || 0), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f3ef', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#787774' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '760px' }}>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>Agent</h1>
            <p style={{ fontSize: '14px', color: '#787774' }}>Review and approve actions your AI agent wants to take.</p>
          </div>

          {actions.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#787774' }}>{actions.length} action{actions.length !== 1 ? 's' : ''} pending</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '2px' }}>Total potential impact</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f7b6c', letterSpacing: '-0.02em' }}>+£{totalImpact.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}

          {actions.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#191919', marginBottom: '6px' }}>All caught up</div>
              <div style={{ fontSize: '13px', color: '#787774' }}>No pending actions. Your agent will surface new recommendations as it monitors your business.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {actions.map(action => {
                const icon = ACTION_ICONS[action.action_type] || ACTION_ICONS.default
                const urgency = URGENCY_COLORS[action.urgency] || URGENCY_COLORS.low
                const isActing = acting === action.id

                return (
                  <div key={action.id} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#f5f3ef', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{action.title}</div>
                        <span style={{ background: urgency.bg, color: urgency.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                          {action.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#787774', marginBottom: '6px', lineHeight: 1.5 }}>{action.description}</div>
                      {action.reason && (
                        <div style={{ fontSize: '12px', color: '#9b9b98', fontStyle: 'italic' }}>"{action.reason}"</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                      {action.profit_impact > 0 && (
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f7b6c' }}>
                          +£{action.profit_impact.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => dismiss(action.id)}
                          disabled={isActing}
                          style={{ background: 'none', color: '#9b9b98', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: isActing ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => approve(action.id)}
                          disabled={isActing}
                          style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: isActing ? 'wait' : 'pointer', opacity: isActing ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}
                        >
                          {isActing ? 'Working...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
