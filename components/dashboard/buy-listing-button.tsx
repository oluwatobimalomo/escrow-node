'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buyFromListing } from '@/app/actions/listings'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'

export function BuyListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async () => {
    if (
      !window.confirm(
        "Buy this item? Your payment will be held in escrow until you confirm delivery.",
      )
    )
      return
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
    <div className="flex flex-col gap-2">
      <Button onClick={handleBuy} disabled={loading} className="w-full">
        <ShoppingBag className="size-4" aria-hidden="true" />
        {loading ? 'Processing...' : 'Buy now'}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
