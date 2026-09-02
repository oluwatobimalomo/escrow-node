'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buyFromListing } from '@/app/actions/listings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShoppingBag } from 'lucide-react'

export function BuyListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async () => {
    setError(null)
    setLoading(true)
    try {
      const { id } = await buyFromListing(listingId)
      router.push(`/dashboard/transactions/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete purchase')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        <ShoppingBag className="size-4" aria-hidden="true" />
        Buy now
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy this item?</DialogTitle>
          <DialogDescription>
            Your payment will be held in escrow until you confirm delivery.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button onClick={handleBuy} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm purchase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
