'use client'

/**
 * OrgSwitcher — dropdown to switch active organization.
 *
 * Mounts at the top of AppSidebar. Reads the list of orgs + the current active
 * one from props (server-rendered in the sidebar) and posts to the
 * `switchOrganization` Server Action. After a successful switch, router.refresh
 * forces the layout to re-read the new context.
 */

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { switchOrganization } from '../actions/org/switch'
import { P, MONO } from '../lib/design'

export type OrgRow = {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

interface Props {
  orgs: OrgRow[]
  activeOrgId: string | null
}

export default function OrgSwitcher({ orgs, activeOrgId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const active = orgs.find((o) => o.id === activeOrgId) ?? orgs[0] ?? null

  // Single org and an owner → nothing to switch. Collapse to a static label.
  if (!active) return null
  const solo = orgs.length <= 1

  function handleSelect(id: string) {
    setError(null)
    setOpen(false)
    startTransition(async () => {
      const res = await switchOrganization(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div style={{ position: 'relative', padding: '0 4px 10px' }}>
      <button
        onClick={() => !solo && setOpen((o) => !o)}
        disabled={solo || pending}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 10px',
          background: 'transparent',
          border: `1px solid ${P.rule}`,
          borderRadius: 0,
          cursor: solo ? 'default' : 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              ...MONO,
              fontSize: 9,
              fontWeight: 600,
              color: P.muted,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Organization
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: P.ink,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {active.name}
          </div>
        </div>
        {!solo && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={P.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 3 3-3" />
          </svg>
        )}
      </button>

      {open && !solo && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% - 4px)',
            left: 4,
            right: 4,
            zIndex: 50,
            background: '#fff',
            border: `1px solid ${P.rule}`,
            boxShadow: '0 10px 30px -12px rgba(0,0,0,0.25)',
          }}
        >
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => handleSelect(o.id)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '10px 12px',
                border: 'none',
                borderBottom: `1px solid ${P.rule}`,
                background: o.id === active.id ? P.bg : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, color: P.ink, fontWeight: 500 }}>{o.name}</span>
              <span
                style={{ ...MONO, fontSize: 9, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                {o.role}
              </span>
            </button>
          ))}
          <a
            href="/settings/team"
            style={{
              display: 'block',
              padding: '10px 12px',
              fontSize: 12,
              color: P.muted,
              textDecoration: 'none',
              background: P.bg,
            }}
          >
            Manage team →
          </a>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: P.oxblood, marginTop: 6, padding: '0 4px' }}>{error}</div>
      )}
      {pending && (
        <div style={{ ...MONO, fontSize: 9, color: P.muted, marginTop: 4, padding: '0 4px', letterSpacing: '0.08em' }}>
          Switching…
        </div>
      )}
    </div>
  )
}
