'use client'

/**
 * /settings/team — team roster + pending invitations.
 *
 * Owner/admin can invite by email (role picker), revoke pending invitations,
 * and remove members. Phase 1 does NOT send invitation emails — the admin
 * copies the generated token and sends it themselves.
 */
'use client'

import { useEffect, useState } from 'react'
import { P, MONO } from '@/app/lib/design'

type Member = {
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  email: string | null
  accepted_at: string | null
  created_at: string
}

type Invitation = {
  id: string
  email: string
  role: string
  token: string
  expires_at: string | null
  accepted_at: string | null
  created_at: string
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastToken, setLastToken] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [role_, setMyRole] = useState<string | null>(null)

  async function refresh() {
    const [mRes, iRes, oRes] = await Promise.all([
      fetch('/api/org/members').then((r) => r.json()).catch(() => ({ members: [] })),
      fetch('/api/org/invitations').then((r) => r.json()).catch(() => ({ invitations: [] })),
      fetch('/api/org/list').then((r) => r.json()).catch(() => ({ orgs: [], activeOrgId: null })),
    ])
    setMembers(mRes.members ?? [])
    setInvites(iRes.invitations ?? [])
    const active = (oRes.orgs ?? []).find((o: any) => o.id === oRes.activeOrgId)
    setOrgName(active?.name ?? null)
    setMyRole(active?.role ?? null)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLastToken(null)
    setPending(true)
    try {
      const res = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Invite failed')
      setLastToken(json.invitation.token)
      setEmail('')
      await refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  async function handleRevoke(id: string) {
    setError(null)
    try {
      const res = await fetch('/api/org/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Revoke failed')
      }
      await refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member from the organization?')) return
    setError(null)
    try {
      const res = await fetch('/api/org/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Remove failed')
      }
      await refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const isAdmin = role_ === 'owner' || role_ === 'admin'

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4, color: P.ink, letterSpacing: '-0.02em' }}>
        Team
      </h1>
      <div style={{ ...MONO, fontSize: 11, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
        {orgName ?? '—'}
      </div>

      {isAdmin && (
        <section style={{ marginBottom: 40, padding: 20, border: `1px solid ${P.rule}`, background: '#fff' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: P.ink }}>Invite teammate</h2>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: '1 1 240px', padding: '8px 10px', border: `1px solid ${P.rule}`, fontSize: 13 }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              style={{ padding: '8px 10px', border: `1px solid ${P.rule}`, fontSize: 13 }}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={pending}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: P.ink,
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: pending ? 'default' : 'pointer',
              }}
            >
              {pending ? 'Inviting…' : 'Invite'}
            </button>
          </form>
          {lastToken && (
            <div style={{ marginTop: 12, padding: 12, background: P.bg, border: `1px solid ${P.rule}` }}>
              <div style={{ ...MONO, fontSize: 10, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Copy this link and send it to your teammate
              </div>
              <code style={{ fontSize: 12, wordBreak: 'break-all' }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/invite/${lastToken}` : `/invite/${lastToken}`}
              </code>
            </div>
          )}
          {error && <div style={{ color: P.oxblood, fontSize: 12, marginTop: 10 }}>{error}</div>}
        </section>
      )}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: P.ink }}>Members</h2>
        <div style={{ border: `1px solid ${P.rule}`, background: '#fff' }}>
          {members.length === 0 ? (
            <div style={{ padding: 16, color: P.muted, fontSize: 13 }}>No members yet.</div>
          ) : (
            members.map((m) => (
              <div
                key={m.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${P.rule}`,
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, fontSize: 13, color: P.ink }}>{m.email || m.user_id}</div>
                <div style={{ ...MONO, fontSize: 10, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 60 }}>
                  {m.role}
                </div>
                {isAdmin && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    style={{ fontSize: 11, color: P.oxblood, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {isAdmin && invites.filter((i) => !i.accepted_at).length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: P.ink }}>Pending invitations</h2>
          <div style={{ border: `1px solid ${P.rule}`, background: '#fff' }}>
            {invites
              .filter((i) => !i.accepted_at)
              .map((i) => (
                <div
                  key={i.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${P.rule}`,
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, fontSize: 13, color: P.ink }}>{i.email}</div>
                  <div style={{ ...MONO, fontSize: 10, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 60 }}>
                    {i.role}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${i.token}`)}
                    style={{ fontSize: 11, color: P.muted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Copy link
                  </button>
                  <button
                    onClick={() => handleRevoke(i.id)}
                    style={{ fontSize: 11, color: P.oxblood, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}
