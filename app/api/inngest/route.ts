/**
 * Inngest serve endpoint.
 *
 * - In production: receives webhooks from Inngest cloud, verifies them with
 *   INNGEST_SIGNING_KEY, and dispatches to the matching function.
 * - In local dev: the Inngest dev server (npx inngest-cli@latest dev) calls
 *   this endpoint directly.
 *
 * Auth is handled by the SDK — do NOT add custom auth wrappers here.
 */

import { serve } from 'inngest/next'
import { inngest } from '@/app/lib/inngest/client'
import { FUNCTIONS } from '@/app/lib/inngest/functions'

export const runtime = 'nodejs'
export const maxDuration = 300

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: FUNCTIONS,
})
