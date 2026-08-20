import Link from 'next/link'
import { getDispatchQueue } from '@/app/actions/transactions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/escrow'
import { PackageCheck, Truck } from 'lucide-react'

export default async function DispatchPage() {
  const queue = await getDispatchQueue()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dispatch products
        </h1>
        <p className="mt-1 text-muted-foreground">
          Sales that are funded and waiting for you to ship. Funds are
          already secured in escrow — mark each as shipped once it's on its
          way.
        </p>
      </div>

      {queue.length === 0 ? (
        <Card className="items-center gap-3 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <PackageCheck className="size-6" aria-hidden="true" />
          </span>
          <p className="font-medium text-foreground">Nothing to dispatch</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When a buyer funds one of your sales, it'll show up here so you
            know what to ship next.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.map((tx) => (
            <li key={tx.id}>
              <Card className="flex-row items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-card-foreground">
                    {tx.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{tx.code}</span>
                    {tx.fundedAt && (
                      <>
                        {' · Funded '}
                        {new Date(tx.fundedAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-mono font-semibold text-foreground">
                    {formatNaira(tx.amount)}
                  </p>
                  <Button
                    render={<Link href={`/dashboard/transactions/${tx.id}`} />}
                    size="sm"
                  >
                    <Truck className="size-4" aria-hidden="true" />
                    Mark shipped
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
