import { getPublicProfile } from '@/app/actions/profile'
import { ReputationSummary } from '@/components/dashboard/reputation-summary'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { notFound } from 'next/navigation'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getPublicProfile(id).catch(() => null)
  if (!profile) notFound()

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {profile.image && <AvatarImage src={profile.image} alt={profile.name} />}
          <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {profile.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {profile.bio}
        </p>
      )}

      <ReputationSummary
        avgRating={profile.avgRating}
        reviewCount={profile.reviewCount}
        completedCount={profile.completedCount}
        emailVerified={profile.emailVerified}
        walletLinked={profile.walletLinked}
        recentReviews={profile.recentReviews}
      />
    </div>
  )
}
