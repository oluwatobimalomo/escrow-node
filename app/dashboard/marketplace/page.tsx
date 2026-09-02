import Link from 'next/link'
import { getActiveListings, getMyListings } from '@/app/actions/listings'
import { MarketplaceBrowser } from '@/components/dashboard/marketplace-browser'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Store } from 'lucide-react'

export default async function MarketplacePage() {
  const [listings, myListings] = await Promise.all([getActiveListings(), getMyListings()])
  const hasOwnListings = myListings.length > 0

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
          <p className="font-medium text-foreground">
            {hasOwnListings ? 'Nothing from other sellers yet' : 'Nothing listed yet'}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasOwnListings
              ? 'No other sellers have listed anything yet. You can view and manage your own listings from My listings.'
              : 'Be the first to publish something for sale.'}
          </p>
          <Button render={<Link href="/dashboard/listings/new" />} className="mt-2">
            <Plus className="size-4" aria-hidden="true" />
            {hasOwnListings ? 'Create another listing' : 'Create a listing'}
          </Button>
        </Card>
      ) : (
        <MarketplaceBrowser listings={listings} />
      )}
    </div>
  )
}
