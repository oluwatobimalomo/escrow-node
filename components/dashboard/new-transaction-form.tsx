'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { createTransaction } from '@/app/actions/transactions'
import { uploadImage, validateImageFile } from '@/lib/blob-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { getFeeTier } from '@/lib/payout'
import { formatNaira } from '@/lib/escrow'
import { ImagePlus, ShoppingBag, Store, X } from 'lucide-react'

export function NewTransactionForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [counterpartyEmail, setCounterpartyEmail] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImageSelect = (file: File | null) => {
    setError(null)
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }
    const problem = validateImageFile(file)
    if (problem) {
      setError(problem)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let image: string | undefined
      if (imageFile && session?.user?.id) {
        setUploadingImage(true)
        image = await uploadImage(imageFile, 'products', session.user.id)
        setUploadingImage(false)
      }
      const { id } = await createTransaction({
        title,
        description,
        image,
        amount: Number.parseFloat(amount),
        role,
        counterpartyEmail,
      })
      router.push(`/dashboard/transactions/${id}`)
    } catch (err) {
      setUploadingImage(false)
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
          <Label htmlFor="product-image">
            Photo of the product{' '}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          {imagePreview ? (
            <div className="relative w-fit">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-32 w-32 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => handleImageSelect(null)}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="product-image"
              className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:border-ring/40 hover:text-foreground"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              <span className="text-xs">Add photo</span>
            </label>
          )}
          <input
            id="product-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Shown on the transaction page and included in the emails sent to
            both parties. JPEG, PNG, WebP, or GIF, up to 5MB.
          </p>
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
          {role === 'seller' && Number.parseFloat(amount) > 0 && (
            <p className="text-xs text-muted-foreground">
              You&apos;d receive{' '}
              {formatNaira(
                Number.parseFloat(amount) *
                  (1 - getFeeTier(Number.parseFloat(amount)).percent / 100),
              )}{' '}
              after the {getFeeTier(Number.parseFloat(amount)).percent}%
              platform fee, 48 hours after delivery is confirmed.{' '}
              <a href="/pricing" target="_blank" className="underline underline-offset-4">
                Full pricing
              </a>
              .
            </p>
          )}
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
          {uploadingImage
            ? 'Uploading photo...'
            : loading
              ? 'Creating...'
              : 'Create transaction'}
        </Button>
      </form>
    </Card>
  )
}
