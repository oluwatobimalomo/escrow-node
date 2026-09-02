import { Check } from 'lucide-react'
import type { TransactionStatus } from '@/lib/escrow'

type StepperTx = {
  // Drizzle infers this column as plain `string`, not the narrower
  // TransactionStatus union — matches the existing `tx.status as
  // TransactionStatus` cast already used elsewhere on this page.
  status: string
  buyerId: string | null
  sellerId: string | null
  fundedAt: Date | string | null
  shippedAt: Date | string | null
}

const BASE_STEPS = ['Created', 'Accepted', 'Funded', 'Shipped', 'Completed'] as const

const BRANCH_LABEL: Partial<Record<TransactionStatus, string>> = {
  disputed: 'Disputed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

const BRANCH_DOT_CLASS: Partial<Record<TransactionStatus, string>> = {
  disputed: 'bg-destructive text-white',
  refunded: 'border border-border bg-secondary text-secondary-foreground',
  cancelled: 'border border-border bg-secondary text-secondary-foreground',
}

/**
 * Horizontal progress indicator for the main escrow lifecycle. Built from
 * the transaction's own fields (buyerId/sellerId, fundedAt, shippedAt)
 * rather than parsing status alone — those are the actual source of truth
 * and stay monotonically true even after a dispute, so a transaction that
 * was already shipped before a dispute was raised still shows "Shipped" as
 * done rather than resetting. Disputed/refunded/cancelled render as an
 * extra step appended after whatever real progress was made, rather than
 * forcing those outcomes into the 5-step happy path.
 */
export function TransactionStepper({ tx }: { tx: StepperTx }) {
  const status = tx.status as TransactionStatus
  const doneFlags = [
    true, // "Created" — a transaction row existing at all means this happened
    Boolean(tx.buyerId && tx.sellerId),
    Boolean(tx.fundedAt),
    Boolean(tx.shippedAt),
    status === 'completed',
  ]
  const branchLabel = BRANCH_LABEL[status]

  let lastDoneIndex = 0
  doneFlags.forEach((done, i) => {
    if (done) lastDoneIndex = i
  })
  const currentIndex =
    !branchLabel && lastDoneIndex < BASE_STEPS.length - 1 ? lastDoneIndex + 1 : -1

  return (
    <ol className="flex items-start" aria-label="Transaction progress">
      {BASE_STEPS.map((label, i) => {
        const done = doneFlags[i]
        const isCurrent = i === currentIndex
        const isLastBaseStep = i === BASE_STEPS.length - 1

        return (
          <li key={label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  done
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border border-border bg-background text-muted-foreground'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              {!isLastBaseStep && (
                <span
                  className={`mx-1 h-px flex-1 ${
                    doneFlags[i + 1] ? 'bg-primary' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className={`mt-1.5 text-center text-[11px] leading-tight ${
                done || isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </li>
        )
      })}
      {branchLabel && (
        <li className="flex flex-none flex-col items-center">
          <div className="flex items-center">
            <span className="mx-1 h-px w-4 bg-border" aria-hidden="true" />
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${BRANCH_DOT_CLASS[status]}`}
              aria-hidden="true"
            >
              !
            </span>
          </div>
          <span className="mt-1.5 text-center text-[11px] leading-tight font-medium text-foreground">
            {branchLabel}
          </span>
        </li>
      )}
    </ol>
  )
}
