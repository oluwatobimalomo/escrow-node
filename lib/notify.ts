import { db } from '@/lib/db'
import { user, transactions } from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'
import { formatNaira } from '@/lib/escrow'
import { eq, inArray } from 'drizzle-orm'

type TxRow = typeof transactions.$inferSelect

function baseUrl() {
  const url =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
  return url.startsWith('http') ? url : `https://${url}`
}

function shell(heading: string, bodyHtml: string, txId: string) {
  const link = `${baseUrl()}/dashboard/transactions/${txId}`
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">${heading}</h2>
      ${bodyHtml}
      <p style="margin: 24px 0;">
        <a href="${link}"
           style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View transaction
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">
        You're receiving this because you're part of a TrustLock escrow
        transaction. If a link doesn't work, sign in and check your
        dashboard directly.
      </p>
    </div>
  `
}

async function partiesOf(tx: TxRow) {
  const ids = [tx.buyerId, tx.sellerId].filter((id): id is string => Boolean(id))
  if (ids.length === 0) return []
  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(inArray(user.id, ids))
}

/** Sends to every known party on the transaction except the actor who triggered the event, if given. */
async function notifyParties(
  tx: TxRow,
  actorId: string | null,
  subject: string,
  html: string,
) {
  try {
    const parties = await partiesOf(tx)
    const recipients = parties.filter((p) => p.id !== actorId)
    await Promise.all(
      recipients.map((p) =>
        sendEmail({ to: p.email, subject, html }).catch((err) =>
          console.error(`Notification email failed for ${p.email}:`, err),
        ),
      ),
    )
  } catch (err) {
    // Notifications are best-effort — a failure here should never surface
    // to the person performing the underlying action.
    console.error('notifyParties failed:', err)
  }
}

export async function notifyTransactionInvited(tx: TxRow) {
  // The invited counterparty may not have an account yet, so this goes to
  // counterpartyEmail directly rather than through notifyParties (which
  // only knows about users already on the transaction row).
  const inviterRole = tx.creatorRole === 'buyer' ? 'seller' : 'buyer'
  await sendEmail({
    to: tx.counterpartyEmail!,
    subject: `You've been invited to a TrustLock transaction`,
    html: shell(
      `You're invited as the ${inviterRole}`,
      `<p style="color:#444;line-height:1.5;">Someone has invited you to "${tx.title}" for ${formatNaira(tx.amount)} on TrustLock. Sign in (or create an account with this email) to accept.</p>`,
      tx.id,
    ),
  }).catch((err) => console.error('Invite email failed:', err))
}

export async function notifyTransactionAccepted(tx: TxRow, actorId: string) {
  await notifyParties(
    tx,
    actorId,
    `Transaction accepted — ${tx.title}`,
    shell(
      'Terms accepted',
      `<p style="color:#444;line-height:1.5;">The other party accepted "${tx.title}". Next step: the buyer funds the escrow.</p>`,
      tx.id,
    ),
  )
}

export async function notifyTransactionFunded(tx: TxRow) {
  await notifyParties(
    tx,
    null,
    `Escrow funded — ${tx.title}`,
    shell(
      'Funds secured in escrow',
      `<p style="color:#444;line-height:1.5;">${formatNaira(tx.amount)} is now held in escrow for "${tx.title}". The seller can proceed with shipping/delivery.</p>`,
      tx.id,
    ),
  )
}

export async function notifyTransactionShipped(tx: TxRow, actorId: string) {
  await notifyParties(
    tx,
    actorId,
    `Marked as shipped — ${tx.title}`,
    shell(
      'Item marked as shipped',
      `<p style="color:#444;line-height:1.5;">The seller marked "${tx.title}" as shipped. Confirm delivery once you receive it to release the funds.</p>`,
      tx.id,
    ),
  )
}

export async function notifyTransactionCompleted(tx: TxRow, actorId: string) {
  await notifyParties(
    tx,
    actorId,
    `Delivery confirmed — ${tx.title}`,
    shell(
      'Delivery confirmed, funds released',
      `<p style="color:#444;line-height:1.5;">Delivery for "${tx.title}" was confirmed and the escrow has been released. Payout amount: ${tx.payoutAmount ? formatNaira(tx.payoutAmount) : formatNaira(tx.amount)}.</p>`,
      tx.id,
    ),
  )
}

export async function notifyTransactionCancelled(tx: TxRow, actorId: string) {
  await notifyParties(
    tx,
    actorId,
    `Transaction cancelled — ${tx.title}`,
    shell(
      'Transaction cancelled',
      `<p style="color:#444;line-height:1.5;">"${tx.title}" was cancelled before funding.</p>`,
      tx.id,
    ),
  )
}

export async function notifyDisputeRaised(tx: TxRow, actorId: string, reason: string) {
  await notifyParties(
    tx,
    actorId,
    `Dispute raised — ${tx.title}`,
    shell(
      'A dispute has been raised',
      `<p style="color:#444;line-height:1.5;">A dispute was raised on "${tx.title}": <em>${reason}</em>. Funds are on hold until it's resolved.</p>`,
      tx.id,
    ),
  )
}

export async function notifyDisputeResolved(
  tx: TxRow,
  actorId: string | null,
  outcome: 'release' | 'refund' | 'split',
  isAdminForced: boolean,
) {
  const outcomeText =
    outcome === 'release'
      ? 'funds released to the seller'
      : outcome === 'refund'
        ? 'funds refunded to the buyer'
        : 'funds split between buyer and seller'
  await notifyParties(
    tx,
    actorId,
    `Dispute resolved — ${tx.title}`,
    shell(
      'Dispute resolved',
      `<p style="color:#444;line-height:1.5;">The dispute on "${tx.title}" was resolved${isAdminForced ? ' by an administrator' : ' by mutual agreement'}: ${outcomeText}.</p>`,
      tx.id,
    ),
  )
}

export async function notifyPayoutSent(tx: TxRow) {
  if (!tx.sellerId) return
  const [seller] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, tx.sellerId))
    .limit(1)
  if (!seller) return
  await sendEmail({
    to: seller.email,
    subject: `Payout sent — ${tx.title}`,
    html: shell(
      'Payout sent',
      `<p style="color:#444;line-height:1.5;">${tx.payoutAmount ? formatNaira(tx.payoutAmount) : ''} has been sent to your bank account for "${tx.title}".</p>`,
      tx.id,
    ),
  }).catch((err) => console.error('Payout notification failed:', err))
}
