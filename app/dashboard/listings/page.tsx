import Link from 'next/link'
import { getMyListings } from '@/app/actions/listings'
import { MyListingRow } from '@/components/dashboard/my-listing-row'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Store } from 'lucide-react'

export default async function MyListingsPage() {
  const listings = await getMyListings()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My listings
          </h1>
          <p className="mt-1 text-muted-foreground">
            What you have for sale on the marketplace.
          </p>
        </div>
        <Button render={<Link href="/dashboard/listings/new" />} size="sm">
          <Plus className="size-4" aria-hidden="true" />
          New listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="items-center gap-3 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Store className="size-6" aria-hidden="true" />
          </span>
          <p className="font-medium text-foreground">Nothing listed yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Publish a listing and buyers can find and purchase it directly
            from the marketplace, funds secured in escrow the same as any
            other transaction.
          </p>
          <Button render={<Link href="/dashboard/listings/new" />} className="mt-2">
            <Plus className="size-4" aria-hidden="true" />
            Create your first listing
          </Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <MyListingRow listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
