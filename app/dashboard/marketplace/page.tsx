import Link from 'next/link'
import { getActiveListings } from '@/app/actions/listings'
import { ListingCard } from '@/components/dashboard/listing-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Store } from 'lucide-react'

export default async function MarketplacePage() {
  const listings = await getActiveListings()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Marketplace
          </h1>
          <p className="mt-1 text-muted-foreground">
            Browse what's for sale. Buy directly — payment goes into escrow
            until you confirm delivery.
          </p>
        </div>
        <Button render={<Link href="/dashboard/listings/new" />} variant="outline" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Sell something
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="items-center gap-3 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Store className="size-6" aria-hidden="true" />
          </span>
          <p className="font-medium text-foreground">Nothing listed yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Be the first to publish something for sale.
          </p>
          <Button render={<Link href="/dashboard/listings/new" />} className="mt-2">
            <Plus className="size-4" aria-hidden="true" />
            Create a listing
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
