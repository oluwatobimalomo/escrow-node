import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStats, getMyTransactions } from '@/app/actions/transactions'
import { formatNaira } from '@/lib/escrow'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { ArrowUpRight, Inbox, Lock, Plus, Star } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [stats, txs] = await Promise.all([getMyStats(), getMyTransactions()])
  const me = session.user

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {me.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your escrow activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-2 p-5">
          <p className="text-sm text-muted-foreground">Held in escrow</p>
          <p className="font-mono text-2xl font-semibold text-foreground">
            {formatNaira(stats.inEscrow)}
          </p>
        </Card>
        <Card className="gap-2 p-5">
          <p className="text-sm text-muted-foreground">Active transactions</p>
          <p className="font-mono text-2xl font-semibold text-foreground">
            {stats.active}
          </p>
        </Card>
        <Card className="gap-2 p-5">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="font-mono text-2xl font-semibold text-foreground">
            {stats.completed}
          </p>
        </Card>
        <Card className="gap-2 p-5">
          <p className="text-sm text-muted-foreground">Your rating</p>
          <p className="flex items-center gap-1.5 font-mono text-2xl font-semibold text-foreground">
            {stats.rating ? (
              <>
                {stats.rating.toFixed(1)}
                <Star
                  className="size-5 fill-warning text-warning"
                  aria-hidden="true"
                />
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </Card>
      </div>

      <section aria-labelledby="transactions-heading">
        <div className="flex items-center justify-between">
          <h2
            id="transactions-heading"
            className="text-lg font-medium text-foreground"
          >
            Transactions
          </h2>
          <Button
            render={<Link href="/dashboard/new" />}
            variant="outline"
            size="sm"
          >
            <Plus className="size-4" aria-hidden="true" />
            New
          </Button>
        </div>

        {txs.length === 0 ? (
          <Card className="mt-4 items-center gap-3 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Inbox className="size-6" aria-hidden="true" />
            </span>
            <p className="font-medium text-foreground">No transactions yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first escrow transaction and invite the other party
              by email. Funds stay protected until delivery is confirmed.
            </p>
            <Button render={<Link href="/dashboard/new" />} className="mt-2">
              <Lock className="size-4" aria-hidden="true" />
              Start a protected transaction
            </Button>
          </Card>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {txs.map((tx) => {
              const role =
                tx.buyerId === me.id
                  ? 'Buying'
                  : tx.sellerId === me.id
                    ? 'Selling'
                    : 'Invited'
              return (
                <li key={tx.id}>
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
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
