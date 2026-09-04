import { ShieldCheck } from 'lucide-react'
import { TwoFactorVerifyForm } from '@/components/two-factor-verify-form'

export default function TwoFactorPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            TrustLock
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold text-foreground">
            Two-factor verification
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
          <TwoFactorVerifyForm />
        </div>
      </div>
    </div>
  )
}
