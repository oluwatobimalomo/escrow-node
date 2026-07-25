import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FEE_TIERS, PAYOUT_COOLING_OFF_HOURS } from '@/lib/payout'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function PricingPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <main className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              TrustLock
            </span>
          </Link>
          <Button render={<Link href={session?.user ? '/dashboard' : '/sign-up'} />} size="sm">
            {session?.user ? 'Go to dashboard' : 'Get started'}
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Buyers pay the full agreed price — nothing added at checkout. The
            platform fee is deducted from the seller&apos;s payout once a
            transaction completes, and it scales down as the transaction
            size goes up.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">
                  Transaction amount
                </th>
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">
                  Platform fee
                </th>
              </tr>
            </thead>
            <tbody>
              {FEE_TIERS.map((tier) => (
                <tr key={tier.label} className="border-t border-border">
                  <td className="px-5 py-4 text-foreground">{tier.label}</td>
                  <td className="px-5 py-4 font-medium text-foreground">
                    {tier.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-medium text-card-foreground">
              Who pays the fee?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              The seller. Buyers always pay exactly the agreed transaction
              amount — no surprise charges at checkout.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-medium text-card-foreground">
              When does the seller get paid?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {PAYOUT_COOLING_OFF_HOURS} hours after the buyer confirms
              delivery. This short window lets either side flag a problem
              before funds leave escrow for good.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-secondary/40 p-6">
          <p className="text-foreground">
            No listing fees, no subscription. You only pay when a
            transaction actually completes.
          </p>
          <Button render={<Link href="/sign-up" />} size="lg">
            Create your free account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </main>
  )
}
