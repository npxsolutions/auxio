// Shared owner-allowlist helper for the admin panel.
// Matches the pattern used in /api/admin/sync-health.
//
// An authenticated user is an "owner" when:
//   - their id equals ADMIN_OWNER_ID, OR
//   - their email is in ADMIN_OWNER_EMAILS (comma-separated).

export function isOwner(email: string | null | undefined, id: string | null | undefined): boolean {
  if (id && process.env.ADMIN_OWNER_ID && id === process.env.ADMIN_OWNER_ID) return true
  if (!email) return false
  const list = (process.env.ADMIN_OWNER_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}
