import { NextResponse } from 'next/server'
import {
  markFundedFromVerifiedPayment,
} from '@/app/actions/transactions'
import {
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from '@/lib/paystack'
import { enforceRateLimit } from '@/lib/rate-limit'

// Paystack webhooks are the source of truth for funding a transaction — the
// browser callback (see /api/paystack/callback) is only a UX convenience
// for redirecting the user back, since a user can close the tab before the
// redirect ever fires.
export async function POST(request: Request) {
  try {
    await enforceRateLimit('system')
  } catch {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const reference = event.data?.reference
  if (event.event === 'charge.success' && reference) {
    // Re-verify against Paystack's API rather than trusting the webhook
    // payload alone — belt and braces against a spoofed or replayed event.
    const verified = await verifyPaystackTransaction(reference)
    if (verified.status === 'success') {
      await markFundedFromVerifiedPayment(reference)
    }
  }

  // Paystack retries on any non-2xx response, so always 200 once handled
  // (or intentionally ignored) to avoid retry storms.
  return NextResponse.json({ received: true })
}
