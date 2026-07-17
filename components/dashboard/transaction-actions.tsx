'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptTransaction,
  cancelTransaction,
  confirmDelivery,
  fundTransaction,
  markShipped,
  raiseDispute,
  resolveDispute,
  submitReview,
} from '@/app/actions/transactions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CheckCheck,
  HandCoins,
  Scale,
  ShieldAlert,
  Star,
  Truck,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  transactionId: string
  status: string
  myRole: 'buyer' | 'seller' | 'invited'
  invited: boolean
  isCreator: boolean
  hasOpenDispute: boolean
  openDisputeRaisedByMe: boolean
  hasMyReview: boolean
}

export function TransactionActions({
  transactionId,
  status,
  myRole,
  invited,
  isCreator,
  hasOpenDispute,
  openDisputeRaisedByMe,
  hasMyReview,
}: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shipNote, setShipNote] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDetails, setDisputeDetails] = useState('')
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [shipOpen, setShipOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setError(null)
    setPending(key)
    try {
      await fn()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(null)
    }
  }

  const actions: React.ReactNode[] = []

  if (invited && status === 'awaiting_acceptance') {
    actions.push(
      <Button
        key="accept"
        onClick={() => run('accept', () => acceptTransaction(transactionId))}
        disabled={pending !== null}
      >
        <CheckCheck className="size-4" aria-hidden="true" />
        {pending === 'accept' ? 'Accepting...' : 'Accept transaction'}
      </Button>,
    )
  }

  if (isCreator && ['awaiting_acceptance', 'accepted'].includes(status)) {
    actions.push(
      <Button
        key="cancel"
        variant="outline"
        onClick={() => run('cancel', () => cancelTransaction(transactionId))}
        disabled={pending !== null}
      >
        <X className="size-4" aria-hidden="true" />
        {pending === 'cancel' ? 'Cancelling...' : 'Cancel'}
      </Button>,
    )
  }

  if (myRole === 'buyer' && status === 'accepted') {
    actions.push(
      <Button
        key="fund"
        onClick={() => run('fund', () => fundTransaction(transactionId))}
        disabled={pending !== null}
      >
        <Wallet className="size-4" aria-hidden="true" />
        {pending === 'fund' ? 'Funding...' : 'Fund escrow'}
      </Button>,
    )
  }

  if (myRole === 'seller' && status === 'funded') {
    actions.push(
      <Dialog key="ship" open={shipOpen} onOpenChange={setShipOpen}>
        <DialogTrigger render={<Button disabled={pending !== null} />}>
          <Truck className="size-4" aria-hidden="true" />
          Mark as shipped
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as shipped</DialogTitle>
            <DialogDescription>
              Add delivery details so the buyer knows what to expect.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ship-note">
              Delivery note{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ship-note"
              value={shipNote}
              onChange={(e) => setShipNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Courier, tracking number, expected arrival..."
            />
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                await run('ship', () => markShipped(transactionId, shipNote))
                setShipOpen(false)
              }}
              disabled={pending !== null}
            >
              {pending === 'ship' ? 'Saving...' : 'Confirm shipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
  }

  if (myRole === 'buyer' && status === 'shipped') {
    actions.push(
      <Button
        key="deliver"
        onClick={() => run('deliver', () => confirmDelivery(transactionId))}
        disabled={pending !== null}
      >
        <HandCoins className="size-4" aria-hidden="true" />
        {pending === 'deliver'
          ? 'Releasing...'
          : 'Confirm delivery & release funds'}
      </Button>,
    )
  }

  if (
    ['funded', 'shipped'].includes(status) &&
    (myRole === 'buyer' || myRole === 'seller')
  ) {
    actions.push(
      <Dialog key="dispute" open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogTrigger
          render={<Button variant="outline" disabled={pending !== null} />}
        >
          <ShieldAlert className="size-4" aria-hidden="true" />
          Raise a dispute
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>
              This freezes the escrow. Funds stay locked until both parties
              settle.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dispute-reason">Reason</Label>
              <Input
                id="dispute-reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                maxLength={120}
                placeholder="e.g. Item not as described"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dispute-details">
                Details{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="dispute-details"
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Explain what happened..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                await run('dispute', () =>
                  raiseDispute(transactionId, disputeReason, disputeDetails),
                )
                setDisputeOpen(false)
              }}
              disabled={pending !== null || !disputeReason.trim()}
            >
              {pending === 'dispute' ? 'Submitting...' : 'Open dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
  }

  if (status === 'disputed' && hasOpenDispute && !openDisputeRaisedByMe) {
    actions.push(
      <Button
        key="resolve-release"
        onClick={() =>
          run('resolve-release', () =>
            resolveDispute(transactionId, 'release'),
          )
        }
        disabled={pending !== null}
      >
        <Scale className="size-4" aria-hidden="true" />
        {pending === 'resolve-release'
          ? 'Settling...'
          : 'Settle: release to seller'}
      </Button>,
      <Button
        key="resolve-refund"
        variant="outline"
        onClick={() =>
          run('resolve-refund', () => resolveDispute(transactionId, 'refund'))
        }
        disabled={pending !== null}
      >
        <Scale className="size-4" aria-hidden="true" />
        {pending === 'resolve-refund'
          ? 'Settling...'
          : 'Settle: refund the buyer'}
      </Button>,
    )
  }

  const canReview =
    ['completed', 'refunded'].includes(status) &&
    (myRole === 'buyer' || myRole === 'seller') &&
    !hasMyReview

  if (actions.length === 0 && !canReview && !error) {
    if (status === 'disputed' && openDisputeRaisedByMe) {
      return (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            You raised this dispute. The other party must agree to a settlement
            before funds can move.
          </p>
        </Card>
      )
    }
    if (['awaiting_acceptance', 'accepted', 'funded', 'shipped'].includes(status)) {
      return (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            Waiting on the other party. You&apos;ll be able to act at the next
            step.
          </p>
        </Card>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">{actions}</div>
      )}

      {canReview && (
        <Card className="gap-3 p-5">
          <p className="font-medium text-foreground">
            Rate your experience with the other party
          </p>
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Rating"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                onClick={() => setRating(value)}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    'size-6 transition-colors',
                    value <= rating
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/40 hover:text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Optional comment..."
          />
          <Button
            className="self-start"
            onClick={() =>
              run('review', () => submitReview(transactionId, rating, comment))
            }
            disabled={pending !== null || rating === 0}
          >
            {pending === 'review' ? 'Submitting...' : 'Submit review'}
          </Button>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
