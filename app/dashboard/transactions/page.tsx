import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyTransactions } from '@/app/actions/transactions'
import { TransactionsFilterList } from '@/components/dashboard/transactions-filter-list'

export default async function TransactionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const txs = await getMyTransactions()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Transactions
        </h1>
        <p className="mt-1 text-muted-foreground">
          Every escrow transaction you're a party to.
        </p>
      </div>

      <TransactionsFilterList txs={txs} myUserId={session.user.id} />
    </div>
  )
}
