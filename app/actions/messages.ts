'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, transactionMessages, user } from '@/lib/db/schema'
import { createNotification } from '@/lib/notify'
import { enforceRateLimit } from '@/lib/rate-limit'
import { asc, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

function isParty(tx: typeof transactions.$inferSelect, userId: string) {
  return tx.buyerId === userId || tx.sellerId === userId
}

/** Messages for a transaction, oldest first, with the sender's name attached. */
export async function getTransactionMessages(transactionId: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)
  if (!tx || !isParty(tx, me.id)) throw new Error('Not allowed')

  const messages = await db
    .select()
    .from(transactionMessages)
    .where(eq(transactionMessages.transactionId, transactionId))
    .orderBy(asc(transactionMessages.createdAt))

  const senderIds = [...new Set(messages.map((m) => m.senderId))]
  const senders = senderIds.length
    ? await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, senderIds))
    : []
  const nameById = new Map(senders.map((s) => [s.id, s.name]))

  return messages.map((m) => ({ ...m, senderName: nameById.get(m.senderId) ?? 'Unknown' }))
}

/**
 * Sends a message on a transaction. Only the two confirmed parties can
 * message each other -- an awaiting_acceptance invite has no confirmed
 * counterparty yet to message, so this throws until acceptance fills in
 * both buyerId and sellerId.
 */
export async function sendTransactionMessage(transactionId: string, body: string) {
  const me = await getSessionUser()
  await enforceRateLimit('general', me.id)
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Message cannot be empty')
  if (trimmed.length > 2000) throw new Error('Message is too long')

  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)
  if (!tx || !isParty(tx, me.id)) throw new Error('Not allowed')

  const otherPartyId = tx.buyerId === me.id ? tx.sellerId : tx.buyerId
  if (!otherPartyId) {
    throw new Error('Waiting on the other party to accept before you can message them')
  }

  await db.insert(transactionMessages).values({
    id: randomUUID(),
    transactionId,
    senderId: me.id,
    body: trimmed,
  })

  await createNotification({
    userId: otherPartyId,
    type: 'message',
    title: `New message on "${tx.title}"`,
    message: trimmed.length > 100 ? `${trimmed.slice(0, 100)}...` : trimmed,
    link: `/dashboard/transactions/${tx.id}`,
  })

  revalidatePath(`/dashboard/transactions/${transactionId}`)
}
