import { getMyProfile } from '@/app/actions/profile'
import { ProfileForm } from '@/components/dashboard/profile-form'
import { ChangePasswordForm } from '@/components/dashboard/change-password-form'
import { ReputationSummary } from '@/components/dashboard/reputation-summary'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export default async function ProfilePage() {
  const profile = await getMyProfile()

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {profile.image && <AvatarImage src={profile.image} alt={profile.name} />}
          <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Member since {new Date(profile.createdAt).toLocaleDateString()} ·{' '}
            <Link
              href={`/dashboard/users/${profile.id}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              View as others see it
            </Link>
          </p>
        </div>
      </div>

      <ReputationSummary
        avgRating={profile.avgRating}
        reviewCount={profile.reviewCount}
        completedCount={profile.completedCount}
        emailVerified={profile.emailVerified}
        walletLinked={profile.wallets.length > 0}
        recentReviews={profile.recentReviews}
      />

      <Card className="p-5">
        <h2 className="text-lg font-medium text-foreground mb-4">
          Edit profile
        </h2>
        <ProfileForm
          initialName={profile.name}
          initialBio={profile.bio}
          initialImage={profile.image}
        />
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-medium text-foreground mb-4">
          Linked wallets
        </h2>
        {profile.wallets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No wallet linked yet. Sign out and use &quot;Continue with
            wallet&quot; on the sign-in page to link one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profile.wallets.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="font-mono text-foreground">
                  {w.address.slice(0, 8)}...{w.address.slice(-6)}
                </span>
                {w.isPrimary && (
                  <span className="text-xs text-muted-foreground">Primary</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {profile.hasPassword && (
        <Card className="p-5">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Change password
          </h2>
          <ChangePasswordForm />
        </Card>
      )}
    </div>
  )
}
