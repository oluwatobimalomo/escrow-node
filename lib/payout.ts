// Platform fee taken out of every payout to a seller. Configurable via env
// so it can change without a code deploy; defaults to 5% if unset.
const FEE_PERCENT = Number.parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '5')

// How long after a transaction completes before the payout actually fires.
// Kept at 48h deliberately: Vercel's Hobby-tier cron only runs once a day,
// so anything much shorter risks the cron missing the window and adding a
// near-24h delay on top. If this is ever moved to Vercel Pro (cron can run
// hourly or more often there), this can safely come down.
export const PAYOUT_COOLING_OFF_HOURS = 48

export function calculatePayout(amount: number) {
  const feeAmount = Math.round(amount * (FEE_PERCENT / 100) * 100) / 100
  const payoutAmount = Math.round((amount - feeAmount) * 100) / 100
  return { feeAmount, payoutAmount }
}

export function payoutScheduledFor(from: Date = new Date()) {
  return new Date(from.getTime() + PAYOUT_COOLING_OFF_HOURS * 60 * 60 * 1000)
}
