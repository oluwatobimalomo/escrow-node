import { listOpenDisputes } from '@/app/actions/admin'
import { DisputeResolutionCard } from '@/components/admin/dispute-resolution-card'

export default async function AdminDisputesPage() {
  const disputes = await listOpenDisputes()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Open disputes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {disputes.length === 0
            ? 'No open disputes right now.'
            : `${disputes.length} dispute${disputes.length === 1 ? '' : 's'} waiting on a decision.`}
        </p>
      </div>

      {disputes.length > 0 && (
        <div className="flex flex-col gap-4">
          {disputes.map((d) => (
            <DisputeResolutionCard key={d.id} dispute={d} />
          ))}
        </div>
      )}
    </div>
  )
}
