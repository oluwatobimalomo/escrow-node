import Link from 'next/link'
import { ArrowRight, Lock, ShieldCheck, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
      <div className="flex flex-col items-start gap-6">
        <Badge variant="secondary" className="gap-1.5">
          <Lock className="size-3" aria-hidden="true" />
          Escrow-protected payments for Nigeria
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground text-balance md:text-5xl lg:text-6xl">
          Buy and sell online without the fear of fraud
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
          TrustLock holds the buyer&apos;s payment in secure escrow and only
          releases it to the seller when delivery is confirmed. No more
          &ldquo;pay before delivery&rdquo; scams.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button render={<Link href="/sign-up" />} size="lg">
            Start a protected transaction
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button
            render={<a href="#how-it-works" />}
            variant="outline"
            size="lg"
          >
            See how it works
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Free to try. No card required to create an account.
        </p>
      </div>

      {/* Mock escrow transaction card */}
      <div className="relative" aria-hidden="true">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  iPhone 15 Pro — Lagos pickup
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  TL-8KX2M4QP
                </p>
              </div>
            </div>
            <Badge className="bg-warning text-warning-foreground">
              In escrow
            </Badge>
          </div>

          <div className="mt-6 rounded-xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Amount held</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-foreground">
              {'\u20A6'}1,250,000
            </p>
          </div>

          <ul className="mt-6 flex flex-col gap-4">
            <li className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Lock className="size-3.5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">
                  Payment secured
                </p>
                <p className="text-xs text-muted-foreground">
                  Funds locked in escrow
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Done</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Truck className="size-3.5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">
                  Item shipped
                </p>
                <p className="text-xs text-muted-foreground">
                  GIG Logistics — tracking added
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Done</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary text-muted-foreground">
                <ShieldCheck className="size-3.5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">
                  Buyer confirms delivery
                </p>
                <p className="text-xs text-muted-foreground">
                  Funds released to seller
                </p>
              </div>
              <span className="text-xs font-medium text-primary">Pending</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
