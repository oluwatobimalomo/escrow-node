import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { markFundedFromVerifiedPayment } from '@/app/actions/transactions'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { enforceRateLimit } from '@/lib/rate-limit'

// This route only runs when the buyer's browser is redirected back from
// Paystack's checkout page. It is a UX shortcut (skip straight to a "funded"
// view instead of waiting on the webhook) — the webhook remains the
// authoritative source of truth, since this redirect can be skipped
// entirely (closed tab, browser crash, etc.).
export async function GET(request: Request) {
  try {
    await enforceRateLimit('system')
  } catch {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const url = new URL(request.url)
  const reference = url.searchParams.get('reference') ?? url.searchParams.get('trxref')

  const [tx] = reference
    ? await db
        .select()
        .from(transactions)
        .where(eq(transactions.paystackReference, reference))
        .limit(1)
    : []

  if (!reference || !tx) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  try {
    const verified = await verifyPaystackTransaction(reference)
    if (verified.status === 'success') {
      await markFundedFromVerifiedPayment(reference)
      return NextResponse.redirect(
        new URL(`/dashboard/transactions/${tx.id}?funded=1`, request.url),
      )
    }
  } catch {
    // fall through — webhook will still reconcile this if it later succeeds
  }

  return NextResponse.redirect(
    new URL(`/dashboard/transactions/${tx.id}?funded=0`, request.url),
  )
}
