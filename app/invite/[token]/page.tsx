'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-client'
import { P, MONO } from '@/app/lib/design'

type Invitation = {
  id: string
  email: string
  role: string
  expires_at: string | null
  accepted: boolean
  expired: boolean
  organization_name: string | null
}

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = params?.token as string | undefined

  const [invite, setInvite] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const sb = createClient()
    ;(async () => {
      const {
        data: { user: authUser },
      } = await sb.auth.getUser()
      setUser(authUser ? { id: authUser.id, email: authUser.email ?? null } : null)

      if (!token) {
        setError('Missing invitation token')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/org/invitations?token=${encodeURIComponent(token)}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Invitation not found')
        setInvite(json.invitation)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  async function handleAccept() {
    if (!token) return
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch('/api/org/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Accept failed')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAccepting(false)
    }
  }

  function handleSignIn() {
    const next = typeof window !== 'undefined' ? window.location.pathname : '/'
    router.push(`/login?next=${encodeURIComponent(next)}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bg, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: `1px solid ${P.rule}`, padding: 32 }}>
        <div style={{ ...MONO, fontSize: 10, color: P.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Invitation
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: P.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Join a team on Palvento
        </h1>

        {loading && <div style={{ color: P.muted, fontSize: 13 }}>Loading…</div>}

        {invite && !loading && (
          <>
            <div style={{ marginBottom: 20, padding: 16, background: P.bg, border: `1px solid ${P.rule}` }}>
              <div style={{ fontSize: 14, color: P.ink, marginBottom: 4 }}>
                <strong>{invite.organization_name ?? 'an organization'}</strong> has invited you
              </div>
              <div style={{ fontSize: 13, color: P.muted }}>
                as <strong>{invite.role}</strong> — invite sent to {invite.email}
              </div>
            </div>

            {invite.accepted && (
              <div style={{ color: P.muted, fontSize: 13, marginBottom: 16 }}>
                This invitation was already accepted.
              </div>
            )}
            {invite.expired && (
              <div style={{ color: P.oxblood, fontSize: 13, marginBottom: 16 }}>
                This invitation has expired. Ask the admin for a new one.
              </div>
            )}

            {!invite.accepted && !invite.expired && (
              <>
                {!user && (
                  <>
                    <p style={{ fontSize: 13, color: P.muted, marginBottom: 16 }}>
                      Sign in with <strong>{invite.email}</strong> to accept.
                    </p>
                    <button
                      onClick={handleSignIn}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        background: P.ink,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Sign in
                    </button>
                  </>
                )}

                {user && user.email?.toLowerCase() !== invite.email.toLowerCase() && (
                  <div style={{ color: P.oxblood, fontSize: 13, marginBottom: 16 }}>
                    You're signed in as {user.email}, but this invite is for {invite.email}.
                    Sign out and sign in with {invite.email}.
                  </div>
                )}

                {user && user.email?.toLowerCase() === invite.email.toLowerCase() && (
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: P.ink,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: accepting ? 'default' : 'pointer',
                    }}
                  >
                    {accepting ? 'Accepting…' : 'Accept invitation'}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {error && (
          <div style={{ color: P.oxblood, fontSize: 13, marginTop: 16 }}>{error}</div>
        )}
      </div>
    </div>
  )
}
