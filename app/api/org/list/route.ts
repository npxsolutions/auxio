/**
 * GET /api/org/list — returns the caller's orgs + the currently active one.
 * Powers the org switcher on AppSidebar.
 */

import { NextResponse } from 'next/server'
import { getActiveOrg, listUserOrgs } from '@/app/lib/org/context'

export async function GET() {
  try {
    const [active, orgs] = await Promise.all([getActiveOrg(), listUserOrgs()])
    return NextResponse.json({
      orgs,
      activeOrgId: active?.id ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
