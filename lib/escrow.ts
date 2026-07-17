export type TransactionStatus =
  | 'awaiting_acceptance'
  | 'accepted'
  | 'funded'
  | 'shipped'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled'

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  awaiting_acceptance: 'Awaiting acceptance',
  accepted: 'Awaiting payment',
  funded: 'In escrow',
  shipped: 'Shipped',
  completed: 'Completed',
  disputed: 'Disputed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

export const STATUS_DESCRIPTIONS: Record<TransactionStatus, string> = {
  awaiting_acceptance:
    'Waiting for the other party to accept this transaction.',
  accepted: 'Both parties agreed. The buyer can now fund the escrow.',
  funded:
    'Funds are held securely in escrow. The seller can now ship the item.',
  shipped:
    'The seller has dispatched the item. The buyer confirms delivery to release funds.',
  completed: 'Delivery confirmed and funds released to the seller.',
  disputed:
    'A dispute is open. Funds stay locked until the dispute is resolved.',
  refunded: 'The dispute was resolved in favour of the buyer and refunded.',
  cancelled: 'This transaction was cancelled before funding.',
}

export function formatNaira(amount: string | number) {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function generateTransactionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TL-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
