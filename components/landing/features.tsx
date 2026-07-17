import { Lock, Scale, Smartphone, Star } from 'lucide-react'

const features = [
  {
    icon: Lock,
    title: 'Funds locked, not trusted',
    description:
      'Money never sits with the other party. It is held by the platform and only moves when the agreed conditions are met.',
  },
  {
    icon: Scale,
    title: 'Built-in dispute resolution',
    description:
      'If something goes wrong, either side can freeze the transaction and open a dispute. Funds stay locked until both parties settle.',
  },
  {
    icon: Star,
    title: 'Reputation you can check',
    description:
      'Every completed transaction earns a rating. See who you\u2019re dealing with before you commit a single naira.',
  },
  {
    icon: Smartphone,
    title: 'Made for how Nigeria trades',
    description:
      'Works on any phone, priced in naira, and designed for Instagram vendors, marketplace sellers, and everyday buyers.',
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          Trust is the product
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
          Nigerian e-commerce loses billions to payment fraud every year.
          TrustLock removes the leap of faith from every transaction.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-4 rounded-2xl border border-border bg-card p-6"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <feature.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-medium text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
