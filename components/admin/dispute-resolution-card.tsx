'use client'

import { useState } from 'react'
import { adminResolveDispute } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNaira } from '@/lib/escrow'

type DisputeWithContext = {
  id: string
  reason: string
  details: string | null
  createdAt: Date
  transaction: {
    id: string
    code: string
    title: string
    amount: string
  }
  buyer: { id: string; name: string; email: string } | null
  seller: { id: string; name: string; email: string } | null
  raisedBy: { id: string; name: string; email: string } | null
}

export function DisputeResolutionCard({
  dispute,
}: {
  dispute: DisputeWithContext
}) {
  const [mode, setMode] = useState<'idle' | 'split'>('idle')
  const [splitAmount, setSplitAmount] = useState('')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = Number.parseFloat(dispute.transaction.amount)

  const resolve = async (
    outcome: 'release' | 'refund' | 'split',
    splitToBuyerNaira?: number,
  ) => {
    setError(null)
    setPending(outcome)
    try {
      await adminResolveDispute(dispute.id, outcome, {
        splitToBuyerNaira,
        note: note.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPending(null)
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">
            {dispute.transaction.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {dispute.transaction.code} · {formatNaira(dispute.transaction.amount)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          Raised {new Date(dispute.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Buyer
          </p>
          <p className="text-foreground">
            {dispute.buyer?.name ?? '—'}{' '}
            <span className="text-muted-foreground">
              ({dispute.buyer?.email ?? 'unknown'})
            </span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Seller
          </p>
          <p className="text-foreground">
            {dispute.seller?.name ?? '—'}{' '}
            <span className="text-muted-foreground">
              ({dispute.seller?.email ?? 'unknown'})
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Raised by {dispute.raisedBy?.name ?? 'unknown'} — {dispute.reason}
        </p>
        {dispute.details && (
          <p className="text-foreground whitespace-pre-wrap">
            {dispute.details}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`note-${dispute.id}`}>
          Resolution note (optional, logged on the transaction)
        </Label>
        <Textarea
          id={`note-${dispute.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. Reviewed shipping evidence provided by seller"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {mode === 'idle' ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => resolve('release')}
          >
            {pending === 'release' ? 'Releasing...' : 'Release to seller'}
          </Button>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => resolve('refund')}
          >
            {pending === 'refund' ? 'Refunding...' : 'Full refund to buyer'}
          </Button>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => setMode('split')}
          >
            Split...
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`split-${dispute.id}`}>
              Amount to refund to buyer (₦, out of {formatNaira(totalAmount)}
              ) — the remainder is left with the seller
            </Label>
            <Input
              id={`split-${dispute.id}`}
              type="number"
              min={1}
              max={totalAmount - 1}
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={pending !== null || !splitAmount}
              onClick={() => resolve('split', Number.parseFloat(splitAmount))}
            >
              {pending === 'split' ? 'Processing...' : 'Confirm split'}
            </Button>
            <Button
              variant="ghost"
              disabled={pending !== null}
              onClick={() => setMode('idle')}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
