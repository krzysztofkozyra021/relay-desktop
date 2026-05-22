import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Pencil,
  Play,
  Loader2,
} from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import type { ApiUser, DeviceEvent, FaultReport, FaultStatus } from 'shared/types'
import { FaultStatusBadge } from './FaultStatusBadge'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const dateStr = d.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const timeStr = d.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${dateStr} o ${timeStr}`
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
  currentUser: ApiUser
  events: DeviceEvent[]
  faults: FaultReport[]
  onFaultStatusChange: (id: number, status: FaultStatus) => Promise<void>
  updatingFault?: { id: number; status: FaultStatus } | null
}

export function MergedTimeline({
  canManage,
  currentUser,
  events,
  faults,
  onFaultStatusChange,
  updatingFault = null,
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
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Brak zdarzeń.</p>
  }

  return (
    <div className="max-h-[380px] overflow-y-auto pr-3 border border-border/40 rounded-xl p-4 bg-card/50 custom-scrollbar">
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
              {canManage && (
                <div className="flex gap-2 mt-2">
                  {/* Status: pending */}
                  {fault.status === 'pending' && (
                    <>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                        disabled={updatingFault !== null}
                        onClick={() =>
                          onFaultStatusChange(fault.id, 'in_progress')
                        }
                        type="button"
                      >
                        {updatingFault?.id === fault.id &&
                        updatingFault?.status === 'in_progress' ? (
                          <>
                            <Loader2 className="animate-spin" size={12} />
                            Przyjmowanie…
                          </>
                        ) : (
                          'Przyjmij'
                        )}
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                        disabled={updatingFault !== null}
                        onClick={() =>
                          onFaultStatusChange(fault.id, 'resolved')
                        }
                        type="button"
                      >
                        {updatingFault?.id === fault.id &&
                        updatingFault?.status === 'resolved' ? (
                          <>
                            <Loader2 className="animate-spin" size={12} />
                            Rozwiązywanie…
                          </>
                        ) : (
                          'Rozwiąż'
                        )}
                      </button>
                    </>
                  )}

                  {/* Status: in_progress */}
                  {fault.status === 'in_progress' && (() => {
                    const acceptEvent = events.find(
                      e =>
                        e.title === 'Przyjęto usterkę' &&
                        e.description === `FaultReport updated: ${fault.title}`
                    )
                    const acceptedByOther =
                      acceptEvent &&
                      acceptEvent.user &&
                      acceptEvent.user !== currentUser.email &&
                      !currentUser.is_admin

                    if (acceptedByOther) {
                      return (
                        <span className="text-[11px] text-muted-foreground italic bg-secondary/35 px-2.5 py-1 rounded-lg border border-border/40">
                          Przyjęte przez: {acceptEvent.user}
                        </span>
                      )
                    }

                    return (
                      <>
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-warning/10 hover:bg-warning/20 text-warning rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                          disabled={updatingFault !== null}
                          onClick={() => onFaultStatusChange(fault.id, 'pending')}
                          type="button"
                        >
                          {updatingFault?.id === fault.id &&
                          updatingFault?.status === 'pending' ? (
                            <>
                              <Loader2 className="animate-spin" size={12} />
                              Cofanie…
                            </>
                          ) : (
                            'Cofnij przyjęcie'
                          )}
                        </button>
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                          disabled={updatingFault !== null}
                          onClick={() =>
                            onFaultStatusChange(fault.id, 'resolved')
                          }
                          type="button"
                        >
                          {updatingFault?.id === fault.id &&
                          updatingFault?.status === 'resolved' ? (
                            <>
                              <Loader2 className="animate-spin" size={12} />
                              Rozwiązywanie…
                            </>
                          ) : (
                            'Rozwiąż'
                          )}
                        </button>
                      </>
                    )
                  })()}

                  {/* Status: resolved */}
                  {fault.status === 'resolved' && (
                    <button
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-secondary hover:bg-border text-foreground rounded-lg border border-border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                      disabled={updatingFault !== null}
                      onClick={() => onFaultStatusChange(fault.id, 'pending')}
                      type="button"
                    >
                      {updatingFault?.id === fault.id &&
                      updatingFault?.status === 'pending' ? (
                        <>
                          <Loader2 className="animate-spin" size={12} />
                          Otwieranie…
                        </>
                      ) : (
                        'Otwórz ponownie'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
