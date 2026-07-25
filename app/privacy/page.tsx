import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              TrustLock
            </span>
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-16 md:px-6 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_li]:mt-1.5 [&_li]:leading-relaxed [&_strong]:text-foreground [&_strong]:font-medium">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: [DATE]</p>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 not-prose">
          <strong>Draft notice:</strong> this policy is a working draft
          written to align with the Nigeria Data Protection Act 2023 (NDPA)
          and NDPR principles, based on the data TrustLock actually
          collects and processes as of this writing. It has not been
          reviewed by a lawyer. Before relying on it publicly — and before
          handling real users' personal data at any scale — have it
          reviewed by a Nigerian data-protection counsel, and register with
          the Nigeria Data Protection Commission (NDPC) if your data
          processing volume requires it under the NDPA's filing
          thresholds.
        </div>

        <h2>1. Who we are</h2>
        <p>
          TrustLock ("we", "us") operates an escrow platform that holds
          payment between a buyer and seller until agreed delivery
          conditions are met. This policy explains what personal data we
          collect, why, how long we keep it, and what rights you have over
          it, in line with the Nigeria Data Protection Act 2023.
        </p>

        <h2>2. What we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> name, email address, and
            a hashed password (if you sign up with email/password) or a
            linked wallet address (if you sign in with a crypto wallet).
          </li>
          <li>
            <strong>Identity verification (optional):</strong> if you
            choose to verify your identity, we submit your Bank
            Verification Number (BVN) and date of birth to our payment
            processor (Paystack) for one-time verification. We do not
            store your BVN — only the verification outcome (verified or
            not), the date, and the name returned by the verification.
          </li>
          <li>
            <strong>Payout details (sellers only):</strong> bank account
            number, bank name, and the account name returned by our
            payment processor when you add a payout account.
          </li>
          <li>
            <strong>Transaction data:</strong> what you're buying or
            selling, the amount, counterparty email, delivery notes, and
            the full history of status changes on a transaction.
          </li>
          <li>
            <strong>Payment data:</strong> we do not store your card or
            bank transfer details directly — payments are processed by
            Paystack, a licensed payment service provider, and we retain
            only transaction references and outcomes.
          </li>
          <li>
            <strong>Profile content:</strong> anything you choose to add —
            a bio, avatar image URL.
          </li>
          <li>
            <strong>Technical data:</strong> IP address and basic request
            metadata, used only for rate-limiting and abuse prevention.
          </li>
        </ul>

        <h2>3. Why we process it (lawful basis)</h2>
        <ul>
          <li>
            <strong>Contract performance:</strong> account, transaction,
            and payout data are processed because they're necessary to
            provide the escrow service you've asked for.
          </li>
          <li>
            <strong>Consent:</strong> identity verification (BVN check) is
            optional and only performed when you actively choose to
            initiate it.
          </li>
          <li>
            <strong>Legitimate interest:</strong> rate-limiting/IP data is
            processed to prevent fraud and abuse of the platform.
          </li>
          <li>
            <strong>Legal obligation:</strong> transaction records may be
            retained to meet financial record-keeping obligations under
            Nigerian law.
          </li>
        </ul>

        <h2>4. Who we share it with</h2>
        <p>
          We share the minimum data necessary with the following
          processors to operate the service:
        </p>
        <ul>
          <li>
            <strong>Paystack</strong> — payment processing, identity
            (BVN) verification, and seller payouts.
          </li>
          <li>
            <strong>Resend</strong> — sending transactional emails
            (verification links, transaction status notifications).
          </li>
          <li>
            <strong>Our hosting and database providers</strong> — Vercel
            (application hosting) and Neon (database hosting), both of
            which store data on your behalf under their own security
            commitments.
          </li>
        </ul>
        <p>
          We do not sell personal data, and we do not share it with third
          parties for their own marketing purposes.
        </p>

        <h2>5. How long we keep it</h2>
        <p>
          Account and transaction data is retained for as long as your
          account is active, plus a reasonable period afterward for
          dispute resolution and financial record-keeping. Identity
          verification does not retain the BVN itself at any point — only
          the verification outcome persists. You may request account
          deletion at any time (see Section 7); some transaction records
          may be retained in anonymized or minimal form where required for
          legal/financial compliance even after account deletion.
        </p>

        <h2>6. Security</h2>
        <p>
          Passwords are stored hashed, never in plain text. Payment and
          bank details are handled by our licensed payment processor
          rather than stored directly on our servers. Access to
          administrative functions (dispute resolution, user management)
          is restricted to designated admin accounts.
        </p>

        <h2>7. Your rights</h2>
        <p>Under the Nigeria Data Protection Act, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data (via your profile settings, or by contacting us)</li>
          <li>Request deletion of your account and associated data</li>
          <li>Object to or restrict certain processing</li>
          <li>Withdraw consent for optional processing (e.g. identity verification) at any time going forward</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at [PRIVACY CONTACT
          EMAIL].
        </p>

        <h2>8. Public profile information</h2>
        <p>
          Your name, avatar, bio, transaction ratings, and verification
          badges (email/ID/wallet) are visible to other signed-in
          TrustLock users as part of the platform's trust and reputation
          system — this is a core function of an escrow service, not
          optional data sharing. This information is not indexed by
          public search engines or visible to non-users.
        </p>

        <h2>9. Changes to this policy</h2>
        <p>
          We'll update the date at the top of this page when this policy
          changes, and post material changes visibly rather than silently.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about this policy or your data can be sent to
          [PRIVACY CONTACT EMAIL].
        </p>
      </article>
    </main>
  )
}
