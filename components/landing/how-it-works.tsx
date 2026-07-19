import { FileCheck, HandCoins, PackageCheck, Wallet } from 'lucide-react'

const steps = [
  {
    icon: FileCheck,
    title: 'Agree on terms',
    description:
      'Buyer or seller creates a transaction with the item, price, and the other party\u2019s email. Both sides accept before anything moves.',
  },
  {
    icon: Wallet,
    title: 'Buyer funds escrow',
    description:
      'The buyer pays into TrustLock \u2014 not to the seller. The money is locked and neither party can touch it.',
  },
  {
    icon: PackageCheck,
    title: 'Seller ships',
    description:
      'With payment guaranteed, the seller dispatches the item and adds delivery details for the buyer to track.',
  },
  {
    icon: HandCoins,
    title: 'Funds released',
    description:
      'The buyer confirms delivery and the funds are instantly released to the seller. Disagreement? Open a dispute \u2014 funds stay locked until it\u2019s resolved.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            Four steps to a safe transaction
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            TrustLock sits between buyer and seller so neither side has to
            trust a stranger — only the process.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-lg font-medium text-card-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
