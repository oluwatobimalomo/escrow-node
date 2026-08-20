import Link from 'next/link'
import { getMyPayoutAccount } from '@/app/actions/payout-accounts'
import { getPayoutHistory } from '@/app/actions/transactions'
import { PayoutAccountForm } from '@/components/dashboard/payout-account-form'
import { Card } from '@/components/ui/card'
import { formatNaira } from '@/lib/escrow'
import { Inbox } from 'lucide-react'

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  paid: 'Paid',
  blocked_no_bank_details: 'Blocked — no bank details',
  failed: 'Failed',
}

const PAYOUT_STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-warning text-warning-foreground',
  paid: 'bg-success text-success-foreground',
  blocked_no_bank_details: 'bg-destructive text-white',
  failed: 'bg-destructive text-white',
}

export default async function PaymentsPage() {
  const [payoutAccount, history] = await Promise.all([
    getMyPayoutAccount(),
    getPayoutHistory(),
  ])

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Payments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your payout bank account and a record of every sale that has
          reached the payout stage.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-medium text-foreground mb-1">
          Payout account
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Where you receive money when you sell. Add this before your first
          sale — payouts are held until it's on file.
        </p>
        <PayoutAccountForm existing={payoutAccount} />
      </Card>

      <section aria-labelledby="payout-history-heading">
        <h2
          id="payout-history-heading"
          className="text-lg font-medium text-foreground mb-4"
        >
          Payout history
        </h2>

        {history.length === 0 ? (
          <Card className="items-center gap-3 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Inbox className="size-6" aria-hidden="true" />
            </span>
            <p className="font-medium text-foreground">No payouts yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once a buyer confirms delivery on one of your sales, it shows up
              here as the payout moves from scheduled to paid.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((tx) => (
              <li key={tx.id}>
                <Link
                  href={`/dashboard/transactions/${tx.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-ring/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-card-foreground">
                      {tx.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-mono">{tx.code}</span>
                      {tx.payoutScheduledAt && (
                        <>
                          {' · '}
                          {new Date(tx.payoutScheduledAt).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-mono font-semibold text-foreground">
                      {formatNaira(tx.payoutAmount ?? tx.amount)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        PAYOUT_STATUS_STYLES[tx.payoutStatus ?? ''] ??
                        'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {PAYOUT_STATUS_LABELS[tx.payoutStatus ?? ''] ?? tx.payoutStatus}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
