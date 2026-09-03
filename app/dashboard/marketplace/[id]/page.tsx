import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getListing } from '@/app/actions/listings'
import { BuyListingButton } from '@/components/dashboard/buy-listing-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatNaira } from '@/lib/escrow'
import { BadgeCheck, ImageOff } from 'lucide-react'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const listing = await getListing(id)
  if (!listing) notFound()

  const isOwnListing = listing.sellerId === session.user.id
  const soldOut = listing.quantity === 0 || !listing.active

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {listing.image ? (
        <img
          src={listing.image}
          alt={listing.title}
          className="max-h-96 w-full rounded-xl border border-border object-cover"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-muted">
          <ImageOff className="size-10 text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {listing.title}
        </h1>
        <p className="mt-1 font-mono text-xl font-semibold text-foreground">
          {formatNaira(listing.price)}
        </p>
      </div>

      {listing.seller && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar size="sm">
            {listing.seller.image && (
              <AvatarImage src={listing.seller.image} alt={listing.seller.name} />
            )}
            <AvatarFallback>{listing.seller.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          Sold by {listing.seller.name}
          {listing.seller.bvnVerified && (
            <Badge className="gap-1">
              <BadgeCheck className="size-3" aria-hidden="true" /> ID verified
            </Badge>
          )}
        </div>
      )}

      {listing.description && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {listing.description}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        {soldOut ? 'Sold out' : `${listing.quantity} in stock`}
      </p>

      {isOwnListing ? (
        <p className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
          This is your own listing — manage it from{' '}
          <a
            href={`/dashboard/listings/${listing.id}/edit`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            My listings
          </a>
          .
        </p>
      ) : soldOut ? (
        <p className="rounded-lg border border-border bg-secondary/30 p-3 text-center text-sm text-muted-foreground">
          This listing is no longer available.
        </p>
      ) : (
        <BuyListingButton listingId={listing.id} />
      )}
    </div>
  )
}
