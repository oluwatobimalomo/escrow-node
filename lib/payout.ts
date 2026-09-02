// Tiered platform fee — lower percentage on larger transactions, matching
// how escrow pricing typically works in this market (a flat 5% on a
// ₦2,000,000 transaction is a very different cost than 5% on ₦20,000).
// Override any threshold/rate via env if pricing needs to change without a
// deploy; otherwise this schedule is the default.
//
// This same array powers the /pricing page — if you edit it, the public
// pricing table updates automatically, so it can't drift out of sync with
// what's actually charged.
export type FeeTier = { upTo: number | null; percent: number; label: string }

export const FEE_TIERS: FeeTier[] = [
  { upTo: 50_000, percent: 3, label: 'Up to ₦50,000' },
  { upTo: 250_000, percent: 2, label: '₦50,001 – ₦250,000' },
  { upTo: 1_000_000, percent: 1.5, label: '₦250,001 – ₦1,000,000' },
  { upTo: null, percent: 1, label: 'Above ₦1,000,000' },
]

export function getFeeTier(amount: number): FeeTier {
  return FEE_TIERS.find((t) => t.upTo === null || amount <= t.upTo)!
}

// How long after a transaction completes before the payout actually fires.
// Kept at 48h deliberately: Vercel's Hobby-tier cron only runs once a day,
// so anything much shorter risks the cron missing the window and adding a
// near-24h delay on top. If this is ever moved to Vercel Pro (cron can run
// hourly or more often there), this can safely come down.
export const PAYOUT_COOLING_OFF_HOURS = 48

export function calculatePayout(amount: number) {
  const tier = getFeeTier(amount)
  const feeAmount = Math.round(amount * (tier.percent / 100) * 100) / 100
  const payoutAmount = Math.round((amount - feeAmount) * 100) / 100
  return { feeAmount, payoutAmount, feePercent: tier.percent }
}

export function payoutScheduledFor(from: Date = new Date()) {
  return new Date(from.getTime() + PAYOUT_COOLING_OFF_HOURS * 60 * 60 * 1000)
}

// If a buyer never confirms delivery and never disputes, funds shouldn't
// stay stuck in escrow indefinitely with no recourse for the seller. The
// payouts cron auto-releases to the seller this many days after the ship
// date if the buyer has taken no action. A dispute raised at any point
// before the cron actually runs always takes priority — see
// autoReleaseStaleShipments in app/actions/transactions.ts.
export const AUTO_RELEASE_DAYS = 7

