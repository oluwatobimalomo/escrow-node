'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, disputes } from '@/lib/db/schema'
import { headers } from 'next/headers'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Admin access required')
  return session.user
}

// Statuses where money has actually moved into escrow -- excludes
// awaiting_acceptance/accepted (nothing funded yet) and cancelled (never
// funded). This is the standard definition of GMV for an escrow platform:
// value that actually flowed through the system, regardless of how each
// transaction was ultimately resolved.
const IN_ESCROW_STATUSES = ['funded', 'shipped', 'disputed', 'completed', 'refunded']

/**
 * Platform-wide metrics for the admin analytics page. Computed from a
 * single full scan of the transactions table -- fine at this project's
 * current scale; if the table grows large enough for this to matter,
 * this is the first place to add proper SQL aggregation instead of
 * pulling every row into memory.
 */
export async function getAdminAnalytics() {
  await requireAdmin()

  const rows = await db
    .select({
      status: transactions.status,
      amount: transactions.amount,
      platformFeeAmount: transactions.platformFeeAmount,
      payoutAmount: transactions.payoutAmount,
      payoutStatus: transactions.payoutStatus,
      createdAt: transactions.createdAt,
    })
    .from(transactions)

  const inEscrowRows = rows.filter((r) => IN_ESCROW_STATUSES.includes(r.status))
  const gmv = inEscrowRows.reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)

  const totalFeesCollected = rows
    .filter((r) => r.status === 'completed' || r.status === 'refunded')
    .reduce((sum, r) => sum + Number.parseFloat(r.platformFeeAmount ?? '0'), 0)

  const totalPaidOut = rows
    .filter((r) => r.payoutStatus === 'paid')
    .reduce((sum, r) => sum + Number.parseFloat(r.payoutAmount ?? '0'), 0)

  const statusCounts: Record<string, number> = {}
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  }

  const allDisputes = await db.select({ status: disputes.status }).from(disputes)
  const openDisputes = allDisputes.filter((d) => d.status === 'open').length

  // Dispute rate: of transactions that ever reached escrow, what fraction
  // had a dispute raised at some point. A transaction can only be
  // disputed after being funded, so inEscrowRows.length is the right
  // denominator rather than all transactions ever created.
  const disputeRate = inEscrowRows.length > 0 ? (allDisputes.length / inEscrowRows.length) * 100 : 0
  const takeRate = gmv > 0 ? (totalFeesCollected / gmv) * 100 : 0

  const monthlyMap = new Map<string, number>()
  for (const r of inEscrowRows) {
    const d = new Date(r.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number.parseFloat(r.amount))
  }
  const monthlyGmv = [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6)

  return {
    gmv,
    totalTransactions: rows.length,
    totalFeesCollected,
    totalPaidOut,
    statusCounts,
    totalDisputesRaised: allDisputes.length,
    openDisputes,
    disputeRate,
    takeRate,
    monthlyGmv,
  }
}
