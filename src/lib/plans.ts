// Frontend plan catalog, DERIVED from the canonical single source: src/data/pricing.json.
// Do not hardcode prices here. Edit src/data/pricing.json and run `npm run gen:truth`
// (the same source also generates the checkout/webhook cents and the fleet product-truth.json).
//
// JSON cannot represent Infinity, so the canonical file stores maxLocations: null for
// "unlimited"; we map null -> Infinity here to preserve the existing `maxLocations < Infinity`
// comparisons used across the UI.
import pricing from '@/data/pricing.json'

export type PlanId = keyof typeof pricing.plans

export interface Plan {
  name: string
  price: number
  interval: null
  monitors: number
  maxLocations: number
  checkInterval: number
  cooldown: number
  channels: string[]
  features: string[]
}

export const PLANS = Object.fromEntries(
  Object.entries(pricing.plans).map(([id, p]) => [
    id,
    {
      name: p.name,
      price: p.priceCents / 100,
      interval: null,
      monitors: p.monitors,
      maxLocations: p.maxLocations === null ? Infinity : p.maxLocations,
      checkInterval: p.checkInterval,
      cooldown: p.cooldown,
      channels: p.channels,
      features: p.features,
    } as Plan,
  ])
) as Record<PlanId, Plan>
