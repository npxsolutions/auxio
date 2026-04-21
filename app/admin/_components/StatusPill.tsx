import { theme } from '../_lib/theme'

const COLORS: Record<string, { bg: string; fg: string }> = {
  new:        { bg: 'rgba(232,134,63,$1)',  fg: theme.cobalt },
  reviewing:  { bg: 'rgba(180,120,20,0.12)', fg: '#8a5a10' },
  approved:   { bg: 'rgba(31,122,74,0.14)',  fg: theme.success },
  scheduled:  { bg: 'rgba(31,122,74,0.14)',  fg: theme.success },
  completed:  { bg: 'rgba(11,15,26,0.08)',   fg: theme.ink },
  rejected:   { bg: 'rgba(180,50,31,0.12)',  fg: theme.danger },
  cancelled:  { bg: 'rgba(180,50,31,0.12)',  fg: theme.danger },
  no_show:    { bg: 'rgba(180,50,31,0.12)',  fg: theme.danger },
  archived:   { bg: 'rgba(11,15,26,0.06)',   fg: theme.inkMuted },
  active:     { bg: 'rgba(31,122,74,0.14)',  fg: theme.success },
  revoked:    { bg: 'rgba(180,50,31,0.12)',  fg: theme.danger },
}

export function StatusPill({ value }: { value: string | null | undefined }) {
  const v = (value ?? 'unknown').toLowerCase()
  const c = COLORS[v] ?? { bg: 'rgba(11,15,26,0.06)', fg: theme.inkMuted }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontFamily: theme.sans,
      }}
    >
      {v.replace(/_/g, ' ')}
    </span>
  )
}
