import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Integration-test config.
 *
 * Targets `tests/rls/**` — runs real queries against a disposable Supabase
 * project. Requires TEST_SUPABASE_URL + TEST_SUPABASE_SERVICE_KEY in env.
 *
 * Run with: `npx vitest run --config vitest.integration.config.ts`.
 * Keep separate from the main unit-test run so CI without test-db credentials
 * stays green.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/rls/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
