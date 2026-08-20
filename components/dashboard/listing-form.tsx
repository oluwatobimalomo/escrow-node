'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { createListing, updateListing } from '@/app/actions/listings'
import { uploadImage, validateImageFile } from '@/lib/blob-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ImagePlus, X } from 'lucide-react'
import type { ProductListing } from '@/lib/db/schema'

export function ListingForm({ existing }: { existing?: ProductListing }) {
  const router = useRouter()
  const { data: session } = useSession()
  const isEdit = Boolean(existing)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [price, setPrice] = useState(existing ? existing.price : '')
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '1')
  const [active, setActive] = useState(existing?.active ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existing?.image ?? null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = (file: File | null) => {
    setError(null)
    if (!file) return
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
    setSaving(true)
    try {
      let image = existing?.image ?? undefined
      if (imageFile && session?.user?.id) {
        setUploadingImage(true)
        image = await uploadImage(imageFile, 'products', session.user.id)
        setUploadingImage(false)
      }

      if (isEdit && existing) {
        await updateListing(existing.id, {
          title,
          description,
          image,
          price: Number.parseFloat(price),
          quantity: Number.parseInt(quantity, 10),
          active,
        })
        router.push('/dashboard/listings')
      } else {
        const { id } = await createListing({
          title,
          description,
          image,
          price: Number.parseFloat(price),
          quantity: Number.parseInt(quantity, 10),
        })
        router.push(`/dashboard/marketplace/${id}`)
      }
      router.refresh()
    } catch (err) {
      setUploadingImage(false)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="listing-title">What are you selling?</Label>
        <Input
          id="listing-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. iPhone 13 Pro, 256GB"
          required
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="listing-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="listing-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Condition, what's included, anything a buyer should know."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="listing-image">
          Photo <span className="text-muted-foreground">(optional, recommended)</span>
        </Label>
        {imagePreview ? (
          <div className="relative w-fit">
            <img
              src={imagePreview}
              alt="Listing preview"
              className="h-32 w-32 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImageFile(null)
                setImagePreview(null)
              }}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="listing-image"
            className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:border-ring/40 hover:text-foreground"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            <span className="text-xs">Add photo</span>
          </label>
        )}
        <input
          id="listing-image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="listing-price">Price (NGN)</Label>
          <Input
            id="listing-price"
            type="number"
            min="1"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="listing-quantity">Quantity in stock</Label>
          <Input
            id="listing-quantity"
            type="number"
            min={isEdit ? '0' : '1'}
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      {isEdit && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Listing active</p>
            <p className="text-xs text-muted-foreground">
              Turn off to pause this listing without losing your stock count.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive((a) => !a)}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors',
              active ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform',
                active ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving} className="w-full">
        {uploadingImage
          ? 'Uploading photo...'
          : saving
            ? 'Saving...'
            : isEdit
              ? 'Save changes'
              : 'Publish listing'}
      </Button>
    </form>
  )
}
