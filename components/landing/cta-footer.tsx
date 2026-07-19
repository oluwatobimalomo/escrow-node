import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaFooter() {
  return (
    <>
      <section className="border-t border-border bg-secondary/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center md:px-6 md:py-24">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            Your next transaction doesn&apos;t have to be a gamble
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Create a free account, invite the other party by email, and let
            escrow do the trusting for both of you.
          </p>
          <Button render={<Link href="/sign-up" />} size="lg">
            Create your free account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="font-medium text-foreground">TrustLock</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Secure escrow for Nigerian commerce.
          </p>
        </div>
      </footer>
    </>
  )
}
