import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Pencil,
  Play,
} from 'lucide-react'
import type { DeviceEvent, DeviceEventType } from 'shared/types'
import { cn } from 'renderer/lib/utils'

const EVENT_CONFIG: Record<
  DeviceEventType,
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

export function EventTimeline({ events }: { events: DeviceEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Brak zdarzeń.</p>
  }

  return (
    <div>
      {events.map((event, i) => {
        const cfg = EVENT_CONFIG[event.type]
        return (
          <div className="flex gap-4 relative" key={event.id}>
            {i < events.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
            )}
            <div
              className={cn(
                'relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                cfg.bg,
                cfg.text
              )}
            >
              {cfg.icon}
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
      })}
    </div>
  )
}
