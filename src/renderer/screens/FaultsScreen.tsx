import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import type { FaultReport, FaultStatus } from 'shared/types'
import { cn } from 'renderer/lib/utils'

const STATUS_LABELS: Record<FaultStatus, string> = {
  pending: 'Nowe',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązane',
}

const STATUS_COLORS: Record<FaultStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  in_progress: 'bg-info/15 text-info',
  resolved: 'bg-success/15 text-success',
}

function formatRelative(iso: string): string {
  try {
    const dateObj = new Date(iso)
    const timeStr = dateObj.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })
    
    const diffMs = Date.now() - dateObj.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    
    if (diffMin < 1) return `Zgłoszono: przed chwilą (o ${timeStr})`
    if (diffMin < 60) return `Zgłoszono: ${diffMin} min. temu (o ${timeStr})`
    
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Zgłoszono: ${diffH} godz. temu (o ${timeStr})`
    
    const dateStr = dateObj.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return `Zgłoszono: ${dateStr} o ${timeStr}`
  } catch {
    return iso
  }
}

function sortFaults(faults: FaultReport[]): FaultReport[] {
  const order: Record<FaultStatus, number> = {
    in_progress: 0,
    pending: 1,
    resolved: 2,
  }
  return [...faults].sort((a, b) => {
    const diff = order[a.status] - order[b.status]
    if (diff !== 0) return diff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function FaultsScreen({
  canManage,
  onFaultCountChange,
}: {
  canManage: boolean
  onFaultCountChange?: (count: number) => void
}) {
  const [allFaults, setAllFaults] = useState<FaultReport[]>([])
  const [filter, setFilter] = useState<'all' | FaultStatus>('all')
  const [loading, setLoading] = useState(true)
  const [updatingFault, setUpdatingFault] = useState<{ id: number; status: FaultStatus } | null>(null)

  const load = async (silent = false) => {
    if (!canManage) {
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    try {
      const all = await window.faultAPI.getFaults()
      setAllFaults(all)
      const active = all.filter(fault => fault.status !== 'resolved')
      onFaultCountChange?.(active.length)
    } catch (error) {
      console.error('Failed to load faults in background:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const interval = setInterval(() => {
      load(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleStatusChange = async (id: number, status: FaultStatus) => {
    setUpdatingFault({ id, status })
    try {
      const updated = await window.faultAPI.updateFaultStatus(id, status)
      if (updated) {
        setAllFaults(prev => {
          const next = prev.map(fault => (fault.id === id ? updated : fault))
          const active = next.filter(fault => fault.status !== 'resolved')
          onFaultCountChange?.(active.length)
          return next
        })
      }
    } finally {
      setUpdatingFault(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-muted-foreground" size={20} />
      </div>
    )
  }

  const filteredFaults = sortFaults(
    allFaults.filter(fault => {
      if (filter === 'all') return true
      return fault.status === filter
    })
  )

  const countAll = allFaults.length
  const countPending = allFaults.filter(f => f.status === 'pending').length
  const countInProgress = allFaults.filter(f => f.status === 'in_progress').length
  const countResolved = allFaults.filter(f => f.status === 'resolved').length

  return (
    <div className="h-full overflow-hidden flex flex-col p-6">
      <div className="max-w-2xl w-full mx-auto flex flex-col h-full space-y-4">
        {/* Premium tabs selector */}
        <div className="flex border-b border-border shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "pb-3 px-4 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 cursor-pointer",
              filter === 'all'
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Wszystkie
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full font-bold text-muted-foreground">
              {countAll}
            </span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={cn(
              "pb-3 px-4 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 cursor-pointer",
              filter === 'pending'
                ? "border-warning text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Nowe
            <span className="text-[10px] px-1.5 py-0.5 bg-warning/15 text-warning rounded-full font-bold">
              {countPending}
            </span>
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={cn(
              "pb-3 px-4 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 cursor-pointer",
              filter === 'in_progress'
                ? "border-info text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            W trakcie
            <span className="text-[10px] px-1.5 py-0.5 bg-info/15 text-info rounded-full font-bold">
              {countInProgress}
            </span>
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={cn(
              "pb-3 px-4 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 cursor-pointer",
              filter === 'resolved'
                ? "border-success text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Rozwiązane
            <span className="text-[10px] px-1.5 py-0.5 bg-success/15 text-success rounded-full font-bold">
              {countResolved}
            </span>
          </button>
        </div>

        {/* Scrollable list content */}
        <div className="flex-1 overflow-auto space-y-3 pr-1">
          {filteredFaults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <AlertTriangle className="opacity-30" size={36} />
              <p className="text-sm">Brak usterek w tej kategorii</p>
            </div>
          ) : (
            filteredFaults.map(fault => (
              <div
                className="bg-card border border-border rounded-xl p-4 space-y-2"
                key={fault.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {fault.title}
                    </p>
                    {fault.device && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fault.device.name} · {fault.device.location}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      STATUS_COLORS[fault.status]
                    )}
                  >
                    {STATUS_LABELS[fault.status]}
                  </span>
                </div>

                {fault.description && (
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {fault.description}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{formatRelative(fault.created_at)}</p>
                    {fault.reported_by && (
                      <p>
                        {fault.reported_by}
                        {fault.contact ? ` · ${fault.contact}` : ''}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-2 shrink-0">
                      {/* Status: pending */}
                      {fault.status === 'pending' && (
                        <>
                          <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                            disabled={updatingFault !== null}
                            onClick={() =>
                              handleStatusChange(fault.id, 'in_progress')
                            }
                            type="button"
                          >
                            {updatingFault?.id === fault.id && updatingFault?.status === 'in_progress' ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Przyjmowanie…
                              </>
                            ) : (
                              'Przyjmij'
                            )}
                          </button>
                          <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                            disabled={updatingFault !== null}
                            onClick={() => handleStatusChange(fault.id, 'resolved')}
                            type="button"
                          >
                            {updatingFault?.id === fault.id && updatingFault?.status === 'resolved' ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Rozwiązywanie…
                              </>
                            ) : (
                              'Rozwiąż'
                            )}
                          </button>
                        </>
                      )}

                      {/* Status: in_progress */}
                      {fault.status === 'in_progress' && (
                        <>
                          <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-warning/10 hover:bg-warning/20 text-warning rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                            disabled={updatingFault !== null}
                            onClick={() =>
                              handleStatusChange(fault.id, 'pending')
                            }
                            type="button"
                          >
                            {updatingFault?.id === fault.id && updatingFault?.status === 'pending' ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Cofanie…
                              </>
                            ) : (
                              'Cofnij przyjęcie'
                            )}
                          </button>
                          <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                            disabled={updatingFault !== null}
                            onClick={() => handleStatusChange(fault.id, 'resolved')}
                            type="button"
                          >
                            {updatingFault?.id === fault.id && updatingFault?.status === 'resolved' ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Rozwiązywanie…
                              </>
                            ) : (
                              'Rozwiąż'
                            )}
                          </button>
                        </>
                      )}

                      {/* Status: resolved */}
                      {fault.status === 'resolved' && (
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-secondary hover:bg-border text-foreground rounded-lg border border-border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                          disabled={updatingFault !== null}
                          onClick={() =>
                            handleStatusChange(fault.id, 'pending')
                          }
                          type="button"
                        >
                          {updatingFault?.id === fault.id && updatingFault?.status === 'pending' ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
