import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStats, getMyTransactions } from '@/app/actions/transactions'
import { Button } from '@/components/ui/button'
import { RoleStats } from '@/components/dashboard/role-stats'
import {
  TransactionEmptyState,
  TransactionListItem,
} from '@/components/dashboard/transaction-list'
import { ArrowRight, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [stats, txs] = await Promise.all([getMyStats(), getMyTransactions()])
  const me = session.user
  const dashboardTitle = stats.seller.total > 0 && stats.buyer.total === 0
    ? 'Seller dashboard'
    : stats.buyer.total > 0 && stats.seller.total === 0
      ? 'Buyer dashboard'
      : 'Dashboard'
  const recent = txs.slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {dashboardTitle}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {me.name.split(' ')[0]} — here&apos;s an overview of
          your escrow activity.
        </p>
      </div>

      <RoleStats buyer={stats.buyer} seller={stats.seller} rating={stats.rating} />

      <section aria-labelledby="transactions-heading">
        <div className="flex items-center justify-between">
          <h2
            id="transactions-heading"
            className="text-lg font-medium text-foreground"
          >
            Recent transactions
          </h2>
          <div className="flex items-center gap-2">
            {txs.length > 5 && (
              <Button
                render={<Link href="/dashboard/transactions" />}
                variant="ghost"
                size="sm"
              >
                View all
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              render={<Link href="/dashboard/new" />}
              variant="outline"
              size="sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              New
            </Button>
          </div>
        </div>

        {recent.length === 0 ? (
          <TransactionEmptyState />
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recent.map((tx) => (
              <TransactionListItem key={tx.id} tx={tx} myUserId={me.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
