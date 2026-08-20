import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatNaira } from '@/lib/escrow'
import { ArrowUpRight, Inbox, Lock } from 'lucide-react'
import type { Transaction } from '@/lib/db/schema'

export function TransactionEmptyState() {
  return (
    <Card className="mt-4 items-center gap-3 p-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Inbox className="size-6" aria-hidden="true" />
      </span>
      <p className="font-medium text-foreground">No transactions yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Create your first escrow transaction and invite the other party by
        email. Funds stay protected until delivery is confirmed.
      </p>
      <Button render={<Link href="/dashboard/new" />} className="mt-2">
        <Lock className="size-4" aria-hidden="true" />
        Start a protected transaction
      </Button>
    </Card>
  )
}

export function TransactionListItem({
  tx,
  myUserId,
}: {
  tx: Transaction
  myUserId: string
}) {
  const role =
    tx.buyerId === myUserId
      ? 'Buying'
      : tx.sellerId === myUserId
        ? 'Selling'
        : 'Invited'
  return (
    <li>
      <Link
        href={`/dashboard/transactions/${tx.id}`}
        className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-ring/40"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-card-foreground">
              {tx.title}
            </p>
            <StatusBadge status={tx.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {role} · <span className="font-mono">{tx.code}</span> ·{' '}
            {new Date(tx.createdAt).toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="font-mono font-semibold text-foreground">
            {formatNaira(tx.amount)}
          </p>
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    </li>
  )
}
