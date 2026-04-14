# Experiments log

A running ledger of every live/completed experiment. Append rows as you ship.

## How to run a new experiment (3 lines)

```tsx
import { useFlag, trackConversion } from '@/app/lib/ab'
const showB = useFlag('my-flag-name', false)
return showB ? <VariantB/> : <VariantA/>  // and call trackConversion('signup') on success
```

Then create the flag in PostHog (Feature Flags → New), set rollout %, and log the row below.

## Log

| Name | Flag | Hypothesis | Start | End | Winner | Effect | Next action |
|------|------|------------|-------|-----|--------|--------|-------------|
| Hero headline — "global commerce" | `hero-headline-v2` | Specifying "global" over "modern" will raise hero CTR because it cues the ICP (cross-border sellers). | 2026-04-13 | — | — | — | Run at 50/50 for 2 weeks on v8 landing. Default OFF until flag created in PostHog. |
