/**
 * Registry of every Inngest function this app serves.
 *
 * To add a function:
 *   1. Define it in ./fn-{topic}.ts using inngest.createFunction(...)
 *   2. Import + add to the FUNCTIONS array below.
 *
 * The app/api/inngest/route.ts adapter passes this array straight to
 * `serve()`, so registration is a one-line change.
 */

import { retentionScanCronFn, retentionScanOrgFn } from './fn-retention-scan'
import {
  accountHealthRefreshFn,
  accountHealthStatusChangedFn,
  accountHealthScheduleFn,
} from './fn-account-health'
import { financesScheduleFn, financesReconcileFn } from './fn-finances'

export const FUNCTIONS = [
  retentionScanCronFn,
  retentionScanOrgFn,
  accountHealthScheduleFn,
  accountHealthRefreshFn,
  accountHealthStatusChangedFn,
  financesScheduleFn,
  financesReconcileFn,
]
