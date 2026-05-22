import { cn } from 'renderer/lib/utils'
import type { FaultStatus } from 'shared/types'

const FAULT_STATUS_LABELS: Record<FaultStatus, string> = {
  pending: 'Nowe',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązane',
}

const FAULT_STATUS_COLORS: Record<FaultStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  in_progress: 'bg-info/15 text-info',
  resolved: 'bg-success/15 text-success',
}

export function FaultStatusBadge({ status }: { status: FaultStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        FAULT_STATUS_COLORS[status]
      )}
    >
      {FAULT_STATUS_LABELS[status]}
    </span>
  )
}
