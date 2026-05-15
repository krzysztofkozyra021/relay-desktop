import type { DeviceStatus } from 'shared/types'
import { cn } from 'renderer/lib/utils'

const STATUS_CONFIG: Record<
  DeviceStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Aktywne',
    className: 'bg-success/10 text-success border-success/30',
  },
  repair: {
    label: 'W naprawie',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  retired: {
    label: 'Wycofane',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

export function StatusBadge({ status }: { status: DeviceStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold',
        className
      )}
    >
      {label}
    </span>
  )
}
