'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payoutAccounts } from '@/lib/db/schema'
import {
  listNigerianBanks,
  resolveBankAccount,
  createTransferRecipient,
} from '@/lib/paystack'
import { enforceRateLimit } from '@/lib/rate-limit'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function getBankList() {
  await getSessionUser()
  return listNigerianBanks()
}

export async function getMyPayoutAccount() {
  const me = await getSessionUser()
  const [acct] = await db
    .select()
    .from(payoutAccounts)
    .where(eq(payoutAccounts.userId, me.id))
    .limit(1)
  return acct ?? null
}

/**
 * Verifies the account number/bank combination resolves to a real named
 * account, without saving anything yet — lets the UI show "confirm this is
 * you: JOHN A DOE" before committing.
 */
export async function verifyBankAccount(accountNumber: string, bankCode: string) {
  const me = await getSessionUser()
  await enforceRateLimit('money', me.id)
  if (!/^\d{10}$/.test(accountNumber)) {
    throw new Error('Account number should be 10 digits')
  }
  return resolveBankAccount({ accountNumber, bankCode })
}

export async function savePayoutAccount(
  accountNumber: string,
  bankCode: string,
  bankName: string,
) {
  const me = await getSessionUser()
  await enforceRateLimit('money', me.id)

  // Re-resolve server-side rather than trusting whatever the client
  // displayed after verifyBankAccount — the two calls are seconds apart at
  // most, but this is the step where a mismatch would actually cost money.
  const resolved = await resolveBankAccount({ accountNumber, bankCode })

  const { recipientCode } = await createTransferRecipient({
    accountName: resolved.accountName,
    accountNumber: resolved.accountNumber,
    bankCode,
  })

  const existing = await db
    .select({ id: payoutAccounts.id })
    .from(payoutAccounts)
    .where(eq(payoutAccounts.userId, me.id))
    .limit(1)

  if (existing[0]) {
    await db
      .update(payoutAccounts)
      .set({
        bankCode,
        bankName,
        accountNumber: resolved.accountNumber,
        accountName: resolved.accountName,
        paystackRecipientCode: recipientCode,
      })
      .where(eq(payoutAccounts.id, existing[0].id))
  } else {
    await db.insert(payoutAccounts).values({
      id: randomUUID(),
      userId: me.id,
      bankCode,
      bankName,
      accountNumber: resolved.accountNumber,
      accountName: resolved.accountName,
      paystackRecipientCode: recipientCode,
    })
  }

  revalidatePath('/dashboard/profile')
  return resolved
}
