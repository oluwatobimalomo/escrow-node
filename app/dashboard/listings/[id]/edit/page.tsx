import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getListing } from '@/app/actions/listings'
import { ListingForm } from '@/components/dashboard/listing-form'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const listing = await getListing(id)
  if (!listing || listing.sellerId !== session.user.id) notFound()

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Edit listing
        </h1>
        <p className="mt-1 text-muted-foreground">{listing.title}</p>
      </div>
      <ListingForm existing={listing} />
    </div>
  )
}
