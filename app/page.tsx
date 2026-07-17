import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { CtaFooter } from '@/components/landing/cta-footer'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader isAuthed={Boolean(session?.user)} />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <CtaFooter />
      </main>
    </div>
  )
}
