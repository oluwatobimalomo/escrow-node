import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, type TransactionStatus } from '@/lib/escrow'
import { cn } from '@/lib/utils'

const styles: Record<TransactionStatus, string> = {
  awaiting_acceptance: 'bg-secondary text-secondary-foreground',
  accepted: 'bg-accent text-accent-foreground',
  funded: 'bg-warning text-warning-foreground',
  shipped: 'bg-warning text-warning-foreground',
  completed: 'bg-success text-success-foreground',
  disputed: 'bg-destructive text-white',
  refunded: 'bg-accent text-accent-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status }: { status: string }) {
  const s = status as TransactionStatus
  return (
    <Badge className={cn('border-transparent', styles[s] ?? '')}>
      {STATUS_LABELS[s] ?? status}
    </Badge>
  )
}
