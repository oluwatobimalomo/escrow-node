import Link from 'next/link'
import { getRiskScoredTransactions } from '@/app/actions/admin-risk'
import { Card } from '@/components/ui/card'
import { formatNaira } from '@/lib/escrow'

const LEVEL_STYLES: Record<string, string> = {
  high: 'border-destructive/40 bg-destructive/5',
  medium: 'border-warning/40 bg-warning/5',
  low: 'border-border',
}

export default async function AdminRiskPage() {
  const scored = await getRiskScoredTransactions()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Risk monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active transactions (funded, shipped, or disputed), ranked by an interpretable risk
          score. Every factor below is a fixed, disclosed rule — not a black-box prediction —
          so you can see exactly why a transaction was flagged.
        </p>
      </div>

      {scored.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active transactions right now.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {scored.map((s) => (
            <Card key={s.transactionId} className={`p-4 ${LEVEL_STYLES[s.level]}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/transactions/${s.transactionId}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {s.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{s.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {formatNaira(s.amount)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {s.level} risk &middot; score {s.score}
                  </p>
                </div>
              </div>
              {s.factors.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                  {s.factors.map((f, i) => (
                    <li key={i} className="text-sm text-foreground">
                      <span className="font-medium">{f.label}</span>{' '}
                      <span className="text-muted-foreground">
                        (+{f.points}) — {f.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  No risk factors triggered.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
