import crypto from 'crypto'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is not set. Add it to your environment to accept payments.',
    )
  }
  return key
}

type PaystackInitializeResponse = {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

type PaystackVerifyResponse = {
  status: boolean
  message: string
  data: {
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    currency: string
    customer: { email: string }
    metadata: Record<string, unknown> | null
  }
}

/**
 * Starts a Paystack charge for funding an escrow transaction.
 * `amountNaira` is the human-facing amount (e.g. 25000 for ₦25,000) —
 * Paystack's API takes the amount in kobo, so it's multiplied by 100 here.
 */
export async function initializePaystackTransaction(args: {
  email: string
  amountNaira: number
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}): Promise<PaystackInitializeResponse['data']> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: args.email,
      amount: Math.round(args.amountNaira * 100),
      currency: 'NGN',
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    }),
  })

  const json = (await res.json()) as PaystackInitializeResponse
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Could not start payment with Paystack')
  }
  return json.data
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResponse['data']> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
    },
  )

  const json = (await res.json()) as PaystackVerifyResponse
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Could not verify payment with Paystack')
  }
  return json.data
}

/**
 * Paystack signs webhook bodies with HMAC-SHA512 over the raw request body,
 * using the secret key. Always verify this before trusting a webhook —
 * anyone can POST to a public URL claiming a payment succeeded.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false
  const expected = crypto
    .createHmac('sha512', secretKey())
    .update(rawBody)
    .digest('hex')
  // Lengths match (both hex SHA-512 digests) so timingSafeEqual is safe here.
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
