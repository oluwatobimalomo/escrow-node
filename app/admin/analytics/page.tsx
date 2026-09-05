import { getAdminAnalytics } from '@/app/actions/admin-analytics'
import { Card } from '@/components/ui/card'
import { formatNaira } from '@/lib/escrow'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatMonth(key: string) {
  const [year, month] = key.split('-')
  return `${MONTH_LABELS[Number.parseInt(month, 10) - 1]} ${year}`
}

export default async function AdminAnalyticsPage() {
  const a = await getAdminAnalytics()
  const maxMonthly = Math.max(1, ...a.monthlyGmv.map(([, v]) => v))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide activity across all transactions, all time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Gross merchandise value</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {formatNaira(a.gmv)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total transactions</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {a.totalTransactions}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Platform revenue</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {formatNaira(a.totalFeesCollected)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Take rate</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {a.takeRate.toFixed(2)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Dispute rate</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {a.disputeRate.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {a.openDisputes} currently open
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Paid out to sellers</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {formatNaira(a.totalPaidOut)}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-medium text-foreground">GMV by month</h2>
        {a.monthlyGmv.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-3">
            {a.monthlyGmv.map(([month, value]) => (
              <div key={month} className="flex flex-1 flex-col items-center gap-2 self-stretch">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary"
                    style={{ height: `${Math.max(4, (value / maxMonthly) * 100)}%` }}
                    title={formatNaira(value)}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{formatMonth(month)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-medium text-foreground">Transactions by status</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(a.statusCounts).map(([status, count]) => (
            <div key={status} className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground capitalize">
                {status.replace(/_/g, ' ')}
              </dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-foreground">{count}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
