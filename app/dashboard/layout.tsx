import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStats } from '@/app/actions/transactions'
import { getMyListings } from '@/app/actions/listings'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  // Drives which nav items show up — a buyer-only account doesn't need a
  // "Dispatch products" link, for instance. See the answered requirement:
  // sidebar/stats adapt to whether this person is currently a buyer,
  // seller, or both, based on their actual transactions. Having a
  // published listing counts as "being a seller" too, even before their
  // first sale — otherwise "My listings" would be unreachable right after
  // publishing one.
  const [stats, myListings] = await Promise.all([getMyStats(), getMyListings()])
  const isSeller = stats.seller.total > 0 || myListings.length > 0

  return (
    <DashboardShell
      isSeller={isSeller}
      isAdmin={session.user.role === 'admin'}
      toDispatchCount={stats.seller.toDispatch}
    >
      {children}
    </DashboardShell>
  )
}
