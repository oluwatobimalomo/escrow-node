'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/app/actions/transactions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ShoppingBag, Store } from 'lucide-react'

export function NewTransactionForm() {
  const router = useRouter()
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [counterpartyEmail, setCounterpartyEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { id } = await createTransaction({
        title,
        description,
        amount: Number.parseFloat(amount),
        role,
        counterpartyEmail,
      })
      router.push(`/dashboard/transactions/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">
            I am the
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: 'buyer', label: 'Buyer', icon: ShoppingBag },
                { value: 'seller', label: 'Seller', icon: Store },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors',
                  role === option.value
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <option.icon className="size-4" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">What is being sold?</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="e.g. iPhone 15 Pro, 256GB, Black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">
            Terms &amp; condition of the item{' '}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Condition, delivery method, inspection period..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount (NGN)</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="250000"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="counterparty">
            {role === 'buyer' ? "Seller's email" : "Buyer's email"}
          </Label>
          <Input
            id="counterparty"
            type="email"
            value={counterpartyEmail}
            onChange={(e) => setCounterpartyEmail(e.target.value)}
            required
            placeholder="them@example.com"
          />
          <p className="text-xs text-muted-foreground">
            They&apos;ll see this transaction when they sign in with this
            email.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create transaction'}
        </Button>
      </form>
    </Card>
  )
}
