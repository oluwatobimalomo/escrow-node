import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatNaira } from '@/lib/escrow'
import { ImageOff } from 'lucide-react'
import type { ProductListing } from '@/lib/db/schema'

export function ListingCard({ listing }: { listing: ProductListing }) {
  return (
    <Link href={`/dashboard/marketplace/${listing.id}`}>
      <Card className="h-full gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
        {listing.image ? (
          <img
            src={listing.image}
            alt={listing.title}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-muted">
            <ImageOff className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        <div className="flex flex-col gap-1 p-3">
          <p className="truncate font-medium text-card-foreground">{listing.title}</p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatNaira(listing.price)}
          </p>
          {listing.quantity <= 3 && (
            <p className="text-xs text-warning-foreground">
              Only {listing.quantity} left
            </p>
          )}
        </div>
      </Card>
    </Link>
  )
}
