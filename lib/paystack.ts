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

type PaystackRefundResponse = {
  status: boolean
  message: string
  data: {
    status: string
    transaction_reference: string
    amount: number
  }
}

/**
 * Refunds a previously verified charge, in full or in part. Used by admin
 * dispute resolution — see app/actions/admin.ts. `amountNaira` omitted
 * means a full refund; provided means a partial refund (the 'split'
 * outcome), leaving the remainder with the platform/seller.
 */
export async function refundPaystackTransaction(args: {
  reference: string
  amountNaira?: number
}): Promise<PaystackRefundResponse['data']> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: args.reference,
      ...(args.amountNaira != null
        ? { amount: Math.round(args.amountNaira * 100) }
        : {}),
    }),
  })

  const json = (await res.json()) as PaystackRefundResponse
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Could not process refund with Paystack')
  }
  return json.data
}

type PaystackBank = {
  name: string
  code: string
  active: boolean
}

/** Nigerian banks, for populating a bank-selection dropdown. */
export async function listNigerianBanks(): Promise<PaystackBank[]> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/bank?currency=NGN&country=nigeria`,
    { headers: { Authorization: `Bearer ${secretKey()}` } },
  )
  const json = (await res.json()) as {
    status: boolean
    message: string
    data: PaystackBank[]
  }
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Could not load bank list')
  }
  return json.data.filter((b) => b.active)
}

/**
 * Confirms an account number actually belongs to a named account at the
 * given bank, before it's saved as a payout destination. Never skip this —
 * it's the only thing standing between a typo'd account number and money
 * going to a stranger.
 */
export async function resolveBankAccount(args: {
  accountNumber: string
  bankCode: string
}): Promise<{ accountNumber: string; accountName: string }> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(args.accountNumber)}&bank_code=${encodeURIComponent(args.bankCode)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } },
  )
  const json = (await res.json()) as {
    status: boolean
    message: string
    data: { account_number: string; account_name: string }
  }
  if (!res.ok || !json.status) {
    throw new Error(
      json.message || 'Could not verify that account number — double check it',
    )
  }
  return {
    accountNumber: json.data.account_number,
    accountName: json.data.account_name,
  }
}

/** Registers a payout destination with Paystack once, reused for every transfer. */
export async function createTransferRecipient(args: {
  accountName: string
  accountNumber: string
  bankCode: string
}): Promise<{ recipientCode: string }> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name: args.accountName,
      account_number: args.accountNumber,
      bank_code: args.bankCode,
      currency: 'NGN',
    }),
  })
  const json = (await res.json()) as {
    status: boolean
    message: string
    data: { recipient_code: string }
  }
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Could not register payout account')
  }
  return { recipientCode: json.data.recipient_code }
}

type PaystackTransferResponse = {
  status: boolean
  message: string
  data: { status: string; reference: string; transfer_code: string }
}

/**
 * Sends money to a previously-created recipient. Requires Transfers to be
 * enabled on the Paystack account (Dashboard → Settings → Preferences),
 * and OTP-based transfer finalization turned OFF — an automated cron job
 * has no way to enter an OTP, so leaving that on will make every transfer
 * hang in a pending/otp state forever.
 */
export async function initiateTransfer(args: {
  recipientCode: string
  amountNaira: number
  reference: string
  reason: string
}): Promise<PaystackTransferResponse['data']> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(args.amountNaira * 100),
      recipient: args.recipientCode,
      reference: args.reference,
      reason: args.reason,
    }),
  })
  const json = (await res.json()) as PaystackTransferResponse
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Transfer failed')
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
