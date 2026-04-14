'use client'

// [components/Experiment] — declarative A/B split. Renders children only when the
// flag state matches the requested variant.
//   <Experiment flag="hero-headline-v2" variant="A"><Control/></Experiment>
//   <Experiment flag="hero-headline-v2" variant="B"><Treatment/></Experiment>
import type { ReactNode } from 'react'
import { useFlag, type FlagKey } from '../lib/ab'

export function Experiment({
  flag,
  variant,
  children,
}: {
  flag: FlagKey
  variant: 'A' | 'B'
  children: ReactNode
}) {
  const enabled = useFlag(flag, false)
  const show = variant === 'B' ? enabled : !enabled
  if (!show) return null
  return <>{children}</>
}
