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

const ACTION_GRADIENTS: Record<string, { gradient: string; icon: string }> = {
  reprice:          { gradient: 'linear-gradient(135deg, #5b52f5 0%, #7c75f7 100%)', icon: '💰' },
  negative_keyword: { gradient: 'linear-gradient(135deg, #6b6e87 0%, #9496b0 100%)', icon: '🚫' },
  pause_campaign:   { gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', icon: '⏸' },
  reorder:          { gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', icon: '📦' },
  bid_adjustment:   { gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', icon: '📈' },
  default:          { gradient: 'linear-gradient(135deg, #5b52f5 0%, #7c75f7 100%)', icon: '⚡' },
}

const URGENCY_META: Record<string, { bg: string; color: string; border: string; cardBorder: string }> = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', cardBorder: '3px solid #dc2626' },
  high:     { bg: '#fffbeb', color: '#d97706', border: '#fde68a', cardBorder: '3px solid #d97706' },
  medium:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', cardBorder: '3px solid #5b52f5' },
  low:      { bg: '#f5f3ef', color: '#6b6e87', border: '#e8e5df', cardBorder: 'none' },
}

export default function AgentPage() {
  const router = useRouter()
  const [actions, setActions]   = useState<PendingAction[]>([])
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState<string | null>(null)
  const [toast, setToast]       = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
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

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg)
    setToastType(type)
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
        showToast('Action approved and executed', 'success')
      } else {
        showToast('Failed to approve — please try again', 'error')
      }
    } catch {
      showToast('Error — please try again', 'error')
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
        showToast('Action dismissed', 'success')
      } else {
        showToast('Failed to dismiss — please try again', 'error')
      }
    } catch {
      showToast('Error — please try again', 'error')
    } finally {
      setActing(null)
    }
  }

  const totalImpact = actions.reduce((sum, a) => sum + (a.profit_impact || 0), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f3ef', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 14, color: '#6b6e87' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'white', color: '#1a1b22',
          border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `3px solid ${toastType === 'success' ? '#059669' : '#dc2626'}`,
          fontFamily: 'inherit',
        }}>
          <span style={{ color: toastType === 'success' ? '#059669' : '#dc2626' }}>{toastType === 'success' ? '✓' : '✕'}</span>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '760px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Agent</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>Review and approve actions your AI agent wants to take.</p>
            </div>
          </div>

          {/* Total impact card */}
          {actions.length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e8e5df',
              borderLeft: '3px solid #5b52f5',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b6e87', fontWeight: 500 }}>
                  {actions.length} action{actions.length !== 1 ? 's' : ''} pending review
                </div>
                <div style={{ fontSize: 12, color: '#9496b0', marginTop: 2 }}>Approve to unlock this revenue</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>Total potential impact</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
                  +£{totalImpact.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {actions.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '56px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 56, height: 56, background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginBottom: 6 }}>All caught up</div>
              <div style={{ fontSize: 13, color: '#6b6e87', maxWidth: 360, margin: '0 auto' }}>No pending actions. Your agent will surface new recommendations as it monitors your business.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actions.map(action => {
                const actionMeta = ACTION_GRADIENTS[action.action_type] || ACTION_GRADIENTS.default
                const urgency = URGENCY_META[action.urgency] || URGENCY_META.low
                const isActing = acting === action.id

                return (
                  <div key={action.id} style={{
                    background: 'white',
                    border: '1px solid #e8e5df',
                    borderLeft: urgency.cardBorder,
                    borderRadius: 12,
                    padding: '20px',
                    display: 'flex',
                    gap: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                    {/* Gradient icon */}
                    <div style={{
                      width: 40,
                      height: 40,
                      background: actionMeta.gradient,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}>
                      {actionMeta.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1b22' }}>{action.title}</div>
                        <span style={{
                          background: urgency.bg,
                          color: urgency.color,
                          border: `1px solid ${urgency.border}`,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 100,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          flexShrink: 0,
                        }}>
                          {action.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b6e87', marginBottom: 6, lineHeight: 1.5 }}>{action.description}</div>
                      {action.reason && (
                        <div style={{ fontSize: 12, color: '#9496b0', fontStyle: 'italic' }}>"{action.reason}"</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                      {action.profit_impact > 0 && (
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#059669', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
                          +£{action.profit_impact.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => dismiss(action.id)}
                          disabled={isActing}
                          style={{
                            background: 'white', color: '#6b6e87',
                            border: '1px solid #e8e5df',
                            borderRadius: 8, padding: '7px 14px',
                            fontSize: 12, fontWeight: 500,
                            cursor: isActing ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => approve(action.id)}
                          disabled={isActing}
                          style={{
                            background: '#5b52f5', color: 'white',
                            border: 'none',
                            borderRadius: 8, padding: '7px 14px',
                            fontSize: 12, fontWeight: 600,
                            cursor: isActing ? 'wait' : 'pointer',
                            opacity: isActing ? 0.7 : 1,
                            fontFamily: 'inherit',
                          }}
                        >
                          {isActing ? 'Working…' : 'Approve'}
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
