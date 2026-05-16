import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { FaultReport, FaultStatus } from 'shared/types'
import { cn } from 'renderer/lib/utils'

const STATUS_LABELS: Record<FaultStatus, string> = {
  pending: 'Oczekuje',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązana',
}

const STATUS_COLORS: Record<FaultStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  in_progress: 'bg-info/15 text-info',
  resolved: 'bg-success/15 text-success',
}

function formatRelative(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'przed chwilą'
    if (diffMin === 1) return '1 minutę temu'
    if (diffMin < 60) return `${diffMin} minut temu`
    const diffH = Math.floor(diffMin / 60)
    if (diffH === 1) return '1 godzinę temu'
    if (diffH < 24) return `${diffH} godzin temu`
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
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
  onFaultCountChange,
}: {
  onFaultCountChange?: (count: number) => void
}) {
  const [faults, setFaults] = useState<FaultReport[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const all = await window.faultAPI.getFaults()
    const active = all.filter(f => f.status !== 'resolved')
    setFaults(sortFaults(active))
    onFaultCountChange?.(active.length)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleStatusChange = async (id: number, status: FaultStatus) => {
    const updated = await window.faultAPI.updateFaultStatus(id, status)
    if (updated) {
      setFaults(prev => {
        const next = prev.map(f => (f.id === id ? updated : f))
        const active = next.filter(f => f.status !== 'resolved')
        onFaultCountChange?.(active.length)
        return sortFaults(active)
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-muted-foreground" size={20} />
      </div>
    )
  }

  if (faults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <AlertTriangle className="opacity-30" size={36} />
        <p className="text-sm">Brak aktywnych usterek</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-3">
        {faults.map(fault => (
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
              <div className="flex gap-2 shrink-0">
                {fault.status === 'pending' && (
                  <button
                    className="px-3 py-1.5 text-xs font-medium bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors cursor-pointer"
                    onClick={() => handleStatusChange(fault.id, 'in_progress')}
                    type="button"
                  >
                    Przyjmij
                  </button>
                )}
                <button
                  className="px-3 py-1.5 text-xs font-medium bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer"
                  onClick={() => handleStatusChange(fault.id, 'resolved')}
                  type="button"
                >
                  Rozwiąż
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
