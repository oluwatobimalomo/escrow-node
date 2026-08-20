import { ListingForm } from '@/components/dashboard/listing-form'

export default function NewListingPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New listing
        </h1>
        <p className="mt-1 text-muted-foreground">
          Publish something for sale. Buyers can find it on the marketplace
          and purchase it directly — no invite needed.
        </p>
      </div>
      <ListingForm />
    </div>
  )
}
