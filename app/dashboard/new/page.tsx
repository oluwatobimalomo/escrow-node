import { getRecentCounterparties } from '@/app/actions/transactions'
import { NewTransactionForm } from '@/components/dashboard/new-transaction-form'

export default async function NewTransactionPage() {
  const recentCounterparties = await getRecentCounterparties()
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New escrow transaction
      </h1>
      <p className="mt-1 text-muted-foreground">
        Set the terms and invite the other party by email. Nothing moves until
        both sides accept.
      </p>
      <div className="mt-6">
        <NewTransactionForm recentCounterparties={recentCounterparties} />
      </div>
    </div>
  )
}
