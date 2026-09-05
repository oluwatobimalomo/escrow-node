import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getTransactionDetail } from '@/app/actions/transactions'
import { formatNaira } from '@/lib/escrow'
import { PrintReceiptButton } from '@/components/print-receipt-button'
import { ShieldCheck } from 'lucide-react'

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { id } = await params
  // getTransactionDetail already enforces that only the two parties (or an
  // invited-but-not-yet-accepted counterparty) can see this transaction --
  // no separate authorization check needed here.
  const detail = await getTransactionDetail(id)
  if (!detail) notFound()

  const { transaction: tx, parties, me } = detail
  const buyer = parties.find((p) => p.id === tx.buyerId)
  const seller = parties.find((p) => p.id === tx.sellerId)
  const isSeller = tx.sellerId === me.id

  const generatedAt = new Date().toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const dateFmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a
          href={`/dashboard/transactions/${tx.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to transaction
        </a>
        <PrintReceiptButton />
      </div>

      <div className="rounded-xl border border-border bg-card p-8 print:rounded-none print:border-0">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              TrustLock
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Receipt</p>
            <p className="font-mono text-xs text-muted-foreground">{tx.code}</p>
          </div>
        </div>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{tx.title}</h1>
            {tx.description && (
              <p className="mt-1 text-sm text-muted-foreground">{tx.description}</p>
            )}
          </div>
          <p className="whitespace-nowrap font-mono text-2xl font-semibold text-foreground">
            {formatNaira(tx.amount)}
          </p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="mt-0.5 font-medium capitalize text-foreground">
              {tx.status.replace(/_/g, ' ')}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date created</dt>
            <dd className="mt-0.5 font-medium text-foreground">{dateFmt(tx.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Buyer</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {buyer?.name ?? tx.counterpartyEmail ?? '\u2014'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Seller</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {seller?.name ?? tx.counterpartyEmail ?? '\u2014'}
            </dd>
          </div>
          {tx.fundedAt && (
            <div>
              <dt className="text-muted-foreground">Funded</dt>
              <dd className="mt-0.5 font-medium text-foreground">{dateFmt(tx.fundedAt)}</dd>
            </div>
          )}
          {tx.shippedAt && (
            <div>
              <dt className="text-muted-foreground">Shipped</dt>
              <dd className="mt-0.5 font-medium text-foreground">{dateFmt(tx.shippedAt)}</dd>
            </div>
          )}
          {tx.releasedAt && (
            <div>
              <dt className="text-muted-foreground">Released</dt>
              <dd className="mt-0.5 font-medium text-foreground">{dateFmt(tx.releasedAt)}</dd>
            </div>
          )}
        </dl>

        {isSeller && tx.platformFeeAmount && (
          <div className="mt-6 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross amount</span>
              <span className="font-mono text-foreground">{formatNaira(tx.amount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span className="font-mono text-foreground">
                -{formatNaira(tx.platformFeeAmount)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
              <span className="text-foreground">Net payout</span>
              <span className="font-mono text-foreground">
                {formatNaira(tx.payoutAmount ?? '0')}
              </span>
            </div>
          </div>
        )}

        {tx.refundAmount && (
          <div className="mt-6 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refunded to buyer</span>
              <span className="font-mono text-foreground">{formatNaira(tx.refundAmount)}</span>
            </div>
          </div>
        )}

        <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          Generated by TrustLock on {generatedAt}. This receipt reflects the transaction
          state at the time of generation and is provided for recordkeeping purposes.
        </p>
      </div>
    </div>
  )
}
