'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setListingActive } from '@/app/actions/listings'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/escrow'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import type { ProductListing } from '@/lib/db/schema'

export function MyListingRow({ listing }: { listing: ProductListing }) {
  const router = useRouter()
  const [active, setActiveState] = useState(listing.active)
  const [pending, setPending] = useState(false)
  const soldOut = listing.quantity === 0

  const toggle = async () => {
    setPending(true)
    try {
      await setListingActive(listing.id, !active)
      setActiveState((a) => !a)
      router.refresh()
    } catch {
      // Leave state as-is; the button will just show the pre-toggle state.
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="flex-row items-center gap-4 p-4">
      {listing.image && (
        <img
          src={listing.image}
          alt=""
          className="size-16 shrink-0 rounded-lg border border-border object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-card-foreground">{listing.title}</p>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              soldOut
                ? 'bg-secondary text-secondary-foreground'
                : active
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {soldOut ? 'Sold out' : active ? 'Active' : 'Paused'}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatNaira(listing.price)} · {listing.quantity} in stock
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!soldOut && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={toggle}
          >
            {active ? 'Pause' : 'Activate'}
          </Button>
        )}
        <Button
          render={<Link href={`/dashboard/listings/${listing.id}/edit`} />}
          variant="ghost"
          size="sm"
        >
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </Button>
      </div>
    </Card>
  )
}
