import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatNaira } from '@/lib/escrow'
import { BadgeCheck, ImageOff, Star } from 'lucide-react'
import { categoryLabel } from '@/lib/listing-categories'
import type { ProductListing } from '@/lib/db/schema'

type ListingWithRating = ProductListing & {
  sellerRating?: { avg: number | null; count: number }
  sellerName?: string | null
  sellerVerified?: boolean
}

export function ListingCard({ listing }: { listing: ListingWithRating }) {
  const rating = listing.sellerRating
  return (
    <Link href={`/dashboard/marketplace/${listing.id}`}>
      <Card className="h-full gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
        <div className="relative">
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
          {listing.category && (
            <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
              {categoryLabel(listing.category)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 p-3">
          <p className="truncate font-medium text-card-foreground">{listing.title}</p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatNaira(listing.price)}
          </p>
          {(listing.sellerName || (rating && rating.count > 0)) && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {listing.sellerName && (
                <span className="flex min-w-0 items-center gap-0.5">
                  <span className="truncate">{listing.sellerName}</span>
                  {listing.sellerVerified && (
                    <BadgeCheck
                      className="size-3 shrink-0 text-primary"
                      aria-label="ID verified"
                    />
                  )}
                </span>
              )}
              {rating && rating.count > 0 && (
                <span className="flex shrink-0 items-center gap-0.5">
                  <Star className="size-3 fill-warning text-warning" aria-hidden="true" />
                  {rating.avg?.toFixed(1)} ({rating.count})
                </span>
              )}
            </p>
          )}
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
