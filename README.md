# Meridia

[![CI](https://github.com/npxsolutions/auxio/actions/workflows/ci.yml/badge.svg)](https://github.com/npxsolutions/auxio/actions/workflows/ci.yml)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Testing

Meridia has two test layers:

### Unit tests (Vitest)

Fast, deterministic, fully mocked. Run from a clean checkout in under 30 seconds.

```bash
npm test           # one-shot
npm run test:watch # watch mode
npm run test:ui    # interactive UI
```

Tests live alongside their subjects in `__tests__/` folders, e.g. `app/lib/sync/__tests__/jobs.test.ts`. Mock the Supabase client and `fetch` — never touch the live DB.

To write a new unit test:

1. Create `app/path/to/module/__tests__/my-module.test.ts`
2. `vi.mock('@supabase/supabase-js', () => ...)` to stub the DB client
3. `vi.stubGlobal('fetch', vi.fn(...))` for HTTP
4. Keep the whole suite under 2s — no real network or timers

### End-to-end tests (Playwright)

Smoke tests for critical user journeys. Require a running dev server.

```bash
npx playwright install --with-deps chromium   # one-time
npm run dev                                   # terminal A
npm run test:e2e                              # terminal B
```

Override the target with `PLAYWRIGHT_BASE_URL=https://preview-xyz.vercel.app npm run test:e2e` to run against a deployed preview. E2E is currently soft-fail in CI and only runs on pull requests until preview-URL wiring is finalised.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
