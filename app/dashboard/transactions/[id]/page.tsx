import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTransactionDetail } from '@/app/actions/transactions'
import {
  formatNaira,
  STATUS_DESCRIPTIONS,
  type TransactionStatus,
} from '@/lib/escrow'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { TransactionActions } from '@/components/dashboard/transaction-actions'
import { ArrowLeft, Star } from 'lucide-react'

const EVENT_LABELS: Record<string, string> = {
  created: 'Transaction created',
  accepted: 'Terms accepted',
  funded: 'Escrow funded',
  shipped: 'Item shipped',
  delivered: 'Delivery confirmed',
  released: 'Funds released',
  disputed: 'Dispute raised',
  dispute_resolved: 'Dispute resolved',
  cancelled: 'Transaction cancelled',
  reviewed: 'Review submitted',
}

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await getTransactionDetail(id)
  if (!detail) notFound()

  const { transaction: tx, events, disputes, reviews, parties, me, invited } =
    detail
  const buyer = parties.find((p) => p.id === tx.buyerId)
  const seller = parties.find((p) => p.id === tx.sellerId)
  const myRole = tx.buyerId === me.id ? 'buyer' : tx.sellerId === me.id ? 'seller' : 'invited'
  const openDispute = disputes.find((d) => d.status === 'open') ?? null
  const myReview = reviews.find((r) => r.reviewerId === me.id) ?? null

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            {tx.title}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {tx.code}
          </p>
        </div>
        <StatusBadge status={tx.status} />
      </div>

      <Card className="mt-6 gap-0 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Escrow amount</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-foreground">
              {formatNaira(tx.amount)}
            </p>
          </div>
          <p className="max-w-[16rem] text-right text-sm text-muted-foreground">
            {STATUS_DESCRIPTIONS[tx.status as TransactionStatus]}
          </p>
        </div>

        <Separator className="my-5" />

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Buyer</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {buyer ? buyer.name : (tx.creatorRole === 'seller' ? tx.counterpartyEmail : '—')}
              {tx.buyerId === me.id && (
                <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Seller</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {seller ? seller.name : (tx.creatorRole === 'buyer' ? tx.counterpartyEmail : '—')}
              {tx.sellerId === me.id && (
                <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
              )}
            </dd>
          </div>
          {tx.description && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Terms</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-foreground">
                {tx.description}
              </dd>
            </div>
          )}
          {tx.deliveryNote && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Delivery note</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-foreground">
                {tx.deliveryNote}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="mt-6">
        <TransactionActions
          transactionId={tx.id}
          status={tx.status}
          myRole={myRole}
          invited={invited}
          isCreator={tx.creatorId === me.id}
          openDisputeRaisedByMe={openDispute?.raisedById === me.id}
          hasOpenDispute={Boolean(openDispute)}
          hasMyReview={Boolean(myReview)}
        />
      </div>

      {openDispute && (
        <Card className="mt-6 gap-2 border-destructive/40 p-5">
          <p className="text-sm font-medium text-destructive">Open dispute</p>
          <p className="font-medium text-foreground">{openDispute.reason}</p>
          {openDispute.details && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {openDispute.details}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Raised{' '}
            {new Date(openDispute.createdAt).toLocaleString('en-NG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </Card>
      )}

      {reviews.length > 0 && (
        <section className="mt-8" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="text-lg font-medium text-foreground">
            Reviews
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {reviews.map((review) => {
              const reviewer = parties.find((p) => p.id === review.reviewerId)
              return (
                <li key={review.id}>
                  <Card className="gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {reviewer?.name ?? 'Participant'}
                        {review.reviewerId === me.id && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      <span
                        className="flex items-center gap-0.5"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < review.rating
                                ? 'size-3.5 fill-warning text-warning'
                                : 'size-3.5 text-muted-foreground/40'
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-lg font-medium text-foreground">
          Timeline
        </h2>
        <ol className="mt-3 flex flex-col">
          {events.map((event, i) => (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                {i < events.length - 1 && (
                  <span className="w-px flex-1 bg-border" aria-hidden="true" />
                )}
              </div>
              <div className="pb-6">
                <p className="text-sm font-medium text-foreground">
                  {EVENT_LABELS[event.type] ?? event.type}
                </p>
                {event.note && (
                  <p className="text-sm text-muted-foreground">{event.note}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
