/**
 * Interpretable, rule-based risk scoring for transactions -- deliberately
 * NOT a trained ML model. This project's real transaction volume (a few
 * dozen test transactions) is nowhere near enough to train or validate a
 * genuine classifier, and presenting one anyway would misrepresent what's
 * actually happening. This is a transparent, weighted-factor scorer: every
 * point contribution is a disclosed, fixed rule an admin can audit, which
 * is itself a legitimate and common pattern for early-stage fraud/risk
 * systems before enough labeled data exists for supervised learning.
 */

export type RiskFactor = {
  label: string
  points: number
  detail: string
}

export type RiskLevel = 'low' | 'medium' | 'high'

export type RiskAssessment = {
  score: number
  level: RiskLevel
  factors: RiskFactor[]
}

const LEVEL_THRESHOLDS = { medium: 25, high: 50 } as const

export function assessTransactionRisk(input: {
  amount: number
  isDirectInvite: boolean
  sellerAccountAgeDays: number
  sellerCompletedTransactionCount: number
  sellerReviewCount: number
  sellerAvgRating: number | null
  sellerDisputeCount: number
  sellerTotalFundedCount: number
  sellerBvnVerified: boolean
}): RiskAssessment {
  const factors: RiskFactor[] = []

  if (!input.sellerBvnVerified) {
    factors.push({
      label: 'Unverified seller identity',
      points: 15,
      detail: 'Seller has not completed BVN identity verification.',
    })
  }

  if (input.sellerAccountAgeDays < 7) {
    factors.push({
      label: 'New seller account',
      points: 15,
      detail: `Seller account is only ${Math.max(0, Math.floor(input.sellerAccountAgeDays))} day(s) old.`,
    })
  }

  if (input.sellerCompletedTransactionCount === 0) {
    factors.push({
      label: 'No completed transaction history',
      points: 12,
      detail: 'Seller has never successfully completed a transaction on TrustLock.',
    })
  }

  if (input.sellerReviewCount === 0) {
    factors.push({
      label: 'No reviews yet',
      points: 8,
      detail: 'No buyer has left a review for this seller.',
    })
  } else if (input.sellerAvgRating !== null && input.sellerAvgRating < 3) {
    factors.push({
      label: 'Low seller rating',
      points: 20,
      detail: `Seller's average rating is ${input.sellerAvgRating.toFixed(1)} out of 5.`,
    })
  }

  if (input.sellerTotalFundedCount > 0) {
    const disputeRate = input.sellerDisputeCount / input.sellerTotalFundedCount
    if (disputeRate > 0.3) {
      factors.push({
        label: 'High personal dispute rate',
        points: 25,
        detail: `${Math.round(disputeRate * 100)}% of this seller's funded transactions have involved a dispute.`,
      })
    }
  }

  if (input.isDirectInvite && input.amount > 500_000 && input.sellerReviewCount === 0) {
    factors.push({
      label: 'High-value direct invite from unproven seller',
      points: 20,
      detail:
        'This is a direct invite (not a marketplace listing) for a large amount, from a seller with no review history.',
    })
  }

  if (input.amount > 2_000_000) {
    factors.push({
      label: 'High transaction value',
      points: 10,
      detail: `Transaction amount (₦${input.amount.toLocaleString()}) is unusually large.`,
    })
  }

  const score = factors.reduce((sum, f) => sum + f.points, 0)
  const level: RiskLevel =
    score >= LEVEL_THRESHOLDS.high ? 'high' : score >= LEVEL_THRESHOLDS.medium ? 'medium' : 'low'

  return { score, level, factors }
}
