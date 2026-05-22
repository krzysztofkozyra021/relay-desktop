import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Pencil,
  Play,
} from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import type { DeviceEvent, FaultReport, FaultStatus } from 'shared/types'
import { FaultStatusBadge } from './FaultStatusBadge'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const EVENT_CONFIG: Record<
  DeviceEvent['type'],
  { icon: React.ReactNode; bg: string; text: string }
> = {
  installation: {
    icon: <Play size={13} />,
    bg: 'bg-foreground/10',
    text: 'text-foreground',
  },
  fault_reported: {
    icon: <AlertTriangle size={13} />,
    bg: 'bg-warning/15',
    text: 'text-warning',
  },
  fault_resolved: {
    icon: <CheckCircle size={13} />,
    bg: 'bg-success/15',
    text: 'text-success',
  },
  edit: {
    icon: <Pencil size={13} />,
    bg: 'bg-info/15',
    text: 'text-info',
  },
  note: {
    icon: <MessageSquare size={13} />,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  },
}

type TimelineItem =
  | { kind: 'event'; data: DeviceEvent; at: string }
  | { kind: 'fault'; data: FaultReport; at: string }

type MergedTimelineProps = {
  canManage: boolean
  events: DeviceEvent[]
  faults: FaultReport[]
  onFaultStatusChange: (id: number, status: FaultStatus) => Promise<void>
}

export function MergedTimeline({
  canManage,
  events,
  faults,
  onFaultStatusChange,
}: MergedTimelineProps) {
  const items: TimelineItem[] = [
    ...events.map(event => ({
      kind: 'event' as const,
      data: event,
      at: event.created_at,
    })),
    ...faults.map(fault => ({
      kind: 'fault' as const,
      data: fault,
      at: fault.created_at,
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Brak zdarzeń.</p>
  }

  return (
    <div>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        if (item.kind === 'event') {
          const event = item.data
          const config = EVENT_CONFIG[event.type]
          return (
            <div className="flex gap-4 relative" key={`event-${event.id}`}>
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
              )}
              <div
                className={cn(
                  'relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                  config.bg,
                  config.text
                )}
              >
                {config.icon}
              </div>
              <div className="flex-1 pb-6">
                <p className="text-xs text-muted-foreground mb-0.5">
                  {formatDate(event.created_at)}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {event.title}
                </p>
                {event.description && (
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {event.description}
                  </p>
                )}
                {event.user && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Użytkownik: {event.user}
                  </p>
                )}
              </div>
            </div>
          )
        }

        const fault = item.data
        return (
          <div className="flex gap-4 relative" key={`fault-${fault.id}`}>
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
            )}
            <div className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-warning/15 text-warning">
              <AlertTriangle size={13} />
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {formatDate(fault.created_at)}
                </p>
                <FaultStatusBadge status={fault.status} />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {fault.title}
              </p>
              {fault.description && (
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {fault.description}
                </p>
              )}
              {fault.reported_by && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  Zgłaszający: {fault.reported_by}
                  {fault.contact ? ` · ${fault.contact}` : ''}
                </p>
              )}
              {canManage && fault.status !== 'resolved' && (
                <div className="flex gap-2 mt-2">
                  {fault.status === 'pending' && (
                    <button
                      className="px-2.5 py-1 text-xs font-medium bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors cursor-pointer"
                      onClick={() =>
                        onFaultStatusChange(fault.id, 'in_progress')
                      }
                      type="button"
                    >
                      Przyjmij
                    </button>
                  )}
                  <button
                    className="px-2.5 py-1 text-xs font-medium bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer"
                    onClick={() => onFaultStatusChange(fault.id, 'resolved')}
                    type="button"
                  >
                    Rozwiąż
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
