import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  FileText,
  Hash,
  MapPin,
  MessageSquare,
  Pencil,
  Play,
  Printer,
  Tag,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import type {
  Device,
  DeviceEvent,
  DeviceStatus,
  FaultReport,
  FaultStatus,
  UpdateDeviceInput,
} from 'shared/types'
import { QRPreview, exportDeviceQrAsPng } from '../components/ui/QRPreview'
import { StatusBadge } from '../components/device/StatusBadge'
import { FaultReportForm } from '../components/device/FaultReportForm'
import { cn } from 'renderer/lib/utils'

type Mode = 'view' | 'edit'

type Props = {
  deviceUuid: string
  user: string
  onBack: () => void
  onDeleted: () => void
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

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function DeviceDetail({
  deviceUuid,
  user,
  onBack: _onBack,
  onDeleted,
}: Props) {
  const [device, setDevice] = useState<Device | null>(null)
  const [events, setEvents] = useState<DeviceEvent[]>([])
  const [faults, setFaults] = useState<FaultReport[]>([])
  const [mode, setMode] = useState<Mode>('view')
  const [editData, setEditData] = useState<UpdateDeviceInput | null>(null)
  const [showFaultForm, setShowFaultForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [dev, evts, faultList] = await Promise.all([
      window.dbAPI.getDevice(deviceUuid),
      window.dbAPI.getEvents(deviceUuid),
      window.faultAPI.getDeviceFaults(deviceUuid),
    ])
    if (dev) setDevice(dev)
    setEvents(evts)
    setFaults(faultList)
  }

  useEffect(() => {
    load()
  }, [deviceUuid])

  const enterEdit = () => {
    if (!device) return
    setEditData({
      name: device.name,
      type: device.type,
      model: device.model ?? '',
      brand: device.brand ?? '',
      serial_number: device.serial_number ?? '',
      location: device.location,
      installation_date: toDateInput(device.installation_date),
      notes: device.notes ?? '',
      status: device.status,
    })
    setMode('edit')
  }

  const cancelEdit = () => {
    setMode('view')
    setEditData(null)
  }

  const saveEdit = async () => {
    if (!device || !editData) return
    setSaving(true)
    try {
      await window.dbAPI.updateDevice(device.uuid, editData)
      await window.dbAPI.addEvent({
        device_uuid: device.uuid,
        type: 'edit',
        title: 'Edytowano dane urządzenia',
        user,
      })
      await load()
      setMode('view')
      setEditData(null)
    } finally {
      setSaving(false)
    }
  }

  const handleFaultSubmit = async (description: string) => {
    if (!device) return
    await window.dbAPI.addEvent({
      device_uuid: device.uuid,
      type: 'fault_reported',
      title: 'Zgłoszono usterkę',
      description,
      user,
    })
    setShowFaultForm(false)
    await load()
  }

  const handleDelete = async () => {
    if (!device) return
    await window.dbAPI.deleteDevice(device.uuid)
    onDeleted()
  }

  const handleFaultStatusChange = async (id: number, status: FaultStatus) => {
    const updated = await window.faultAPI.updateFaultStatus(id, status)
    if (updated) {
      setFaults(prev => prev.map(f => (f.id === id ? updated : f)))
    }
  }

  const setEdit = <K extends keyof UpdateDeviceInput>(
    k: K,
    v: UpdateDeviceInput[K]
  ) => setEditData(p => (p ? { ...p, [k]: v } : p))

  if (!device) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Ładowanie…</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div className="h-full overflow-auto p-6 pb-28">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="print-area flex items-start gap-5">
            <div className="shrink-0 rounded-xl overflow-hidden border border-border">
              <QRPreview deviceId={device.uuid} size={104} />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {device.name}
                </h2>
                <div className="no-print flex gap-1.5 shrink-0">
                  {mode === 'view' ? (
                    <>
                      <IconBtn
                        icon={<Pencil size={14} />}
                        label="Edytuj"
                        onClick={enterEdit}
                      />
                      <IconBtn
                        icon={<Trash2 size={14} />}
                        label="Usuń"
                        onClick={() => setDeleteConfirm(true)}
                        variant="danger"
                      />
                    </>
                  ) : (
                    <>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-default"
                        disabled={saving}
                        onClick={saveEdit}
                        type="button"
                      >
                        <Check size={13} />
                        {saving ? 'Zapisywanie…' : 'Zapisz'}
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-border text-text-secondary text-xs font-semibold rounded-lg border border-border transition-colors cursor-pointer"
                        onClick={cancelEdit}
                        type="button"
                      >
                        <X size={13} />
                        Anuluj
                      </button>
                    </>
                  )}
                </div>
              </div>

              {mode === 'view' ? (
                <StatusBadge status={device.status} />
              ) : (
                editData && (
                  <select
                    className="px-2.5 py-1 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    onChange={e =>
                      setEdit('status', e.target.value as DeviceStatus)
                    }
                    value={editData.status}
                  >
                    <option value="active">Aktywne</option>
                    <option value="repair">W naprawie</option>
                    <option value="retired">Wycofane</option>
                  </select>
                )
              )}

              <div className="flex items-center gap-1 mt-2.5 text-xs text-muted-foreground">
                <Clock size={11} />
                Ostatnia edycja: {formatDate(device.updated_at)}
              </div>
              <div className="no-print flex items-center gap-3 mt-2">
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => exportDeviceQrAsPng(device.uuid)}
                  type="button"
                >
                  <Download size={11} />
                  Eksportuj PNG
                </button>
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Printer size={11} />
                  Drukuj naklejkę
                </button>
              </div>
            </div>
          </div>

          {deleteConfirm && (
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 bg-danger/5 border border-danger/30 rounded-xl">
              <p className="text-sm text-foreground">
                Na pewno usunąć{' '}
                <strong className="text-danger">{device.name}</strong>? Operacji
                nie można cofnąć.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  className="px-3 py-1.5 bg-secondary hover:bg-border text-text-secondary text-xs font-medium rounded-lg border border-border transition-colors cursor-pointer"
                  onClick={() => setDeleteConfirm(false)}
                  type="button"
                >
                  Anuluj
                </button>
                <button
                  className="px-3 py-1.5 bg-danger hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  onClick={handleDelete}
                  type="button"
                >
                  Usuń urządzenie
                </button>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Szczegóły
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              <DetailRow
                editMode={mode === 'edit'}
                icon={<Cpu size={15} />}
                label="Nazwa"
                onChange={v => setEdit('name', v)}
                value={mode === 'edit' ? (editData?.name ?? '') : device.name}
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<Tag size={15} />}
                label="Typ"
                onChange={v => setEdit('type', v)}
                value={mode === 'edit' ? (editData?.type ?? '') : device.type}
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<Wrench size={15} />}
                label="Marka"
                onChange={v => setEdit('brand', v)}
                value={
                  mode === 'edit'
                    ? (editData?.brand ?? '')
                    : (device.brand ?? '—')
                }
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<Wrench size={15} />}
                label="Model"
                onChange={v => setEdit('model', v)}
                value={
                  mode === 'edit'
                    ? (editData?.model ?? '')
                    : (device.model ?? '—')
                }
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<Hash size={15} />}
                label="Numer seryjny"
                onChange={v => setEdit('serial_number', v)}
                value={
                  mode === 'edit'
                    ? (editData?.serial_number ?? '')
                    : (device.serial_number ?? '—')
                }
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<MapPin size={15} />}
                label="Lokalizacja"
                onChange={v => setEdit('location', v)}
                value={
                  mode === 'edit' ? (editData?.location ?? '') : device.location
                }
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<Calendar size={15} />}
                inputType="date"
                label="Data instalacji"
                onChange={v => setEdit('installation_date', v)}
                value={
                  mode === 'edit'
                    ? (editData?.installation_date ?? '')
                    : device.installation_date
                      ? formatDate(device.installation_date)
                      : '—'
                }
              />
              <DetailRow
                editMode={mode === 'edit'}
                icon={<FileText size={15} />}
                label="Notatki"
                onChange={v => setEdit('notes', v)}
                value={
                  mode === 'edit'
                    ? (editData?.notes ?? '')
                    : (device.notes ?? '—')
                }
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Historia zdarzeń
            </h3>
            <MergedTimeline
              events={events}
              faults={faults}
              onFaultStatusChange={handleFaultStatusChange}
            />
          </section>

          {showFaultForm && (
            <FaultReportForm
              onClose={() => setShowFaultForm(false)}
              onSubmit={handleFaultSubmit}
            />
          )}
        </div>
      </div>

      {!showFaultForm && mode === 'view' && (
        <div className="absolute bottom-6 right-6">
          <button
            className="flex items-center gap-2 px-5 py-3 bg-warning hover:bg-amber-600 text-white font-semibold rounded-2xl shadow-lg transition-colors text-sm cursor-pointer"
            onClick={() => setShowFaultForm(true)}
            type="button"
          >
            <AlertTriangle size={16} />
            Zgłoś usterkę
          </button>
        </div>
      )}
    </div>
  )
}

const FAULT_STATUS_LABELS: Record<FaultStatus, string> = {
  pending: 'Oczekuje',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązana',
}

const FAULT_STATUS_COLORS: Record<FaultStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  in_progress: 'bg-info/15 text-info',
  resolved: 'bg-success/15 text-success',
}

function FaultStatusBadge({ status }: { status: FaultStatus }) {
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

const EVENT_CFG: Record<
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

function MergedTimeline({
  events,
  faults,
  onFaultStatusChange,
}: {
  events: DeviceEvent[]
  faults: FaultReport[]
  onFaultStatusChange: (id: number, status: FaultStatus) => Promise<void>
}) {
  const items: TimelineItem[] = [
    ...events.map(e => ({ kind: 'event' as const, data: e, at: e.created_at })),
    ...faults.map(f => ({ kind: 'fault' as const, data: f, at: f.created_at })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Brak zdarzeń.</p>
  }

  return (
    <div>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        if (item.kind === 'event') {
          const e = item.data
          const cfg = EVENT_CFG[e.type]
          return (
            <div className="flex gap-4 relative" key={`event-${e.id}`}>
              {!isLast && (
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
                  {formatDate(e.created_at)}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {e.title}
                </p>
                {e.description && (
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {e.description}
                  </p>
                )}
                {e.user && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Użytkownik: {e.user}
                  </p>
                )}
              </div>
            </div>
          )
        }
        const f = item.data
        return (
          <div className="flex gap-4 relative" key={`fault-${f.id}`}>
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
            )}
            <div className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-warning/15 text-warning">
              <AlertTriangle size={13} />
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {formatDate(f.created_at)}
                </p>
                <FaultStatusBadge status={f.status} />
              </div>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              {f.description && (
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {f.description}
                </p>
              )}
              {f.reported_by && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  Zgłaszający: {f.reported_by}
                  {f.contact ? ` · ${f.contact}` : ''}
                </p>
              )}
              {f.status !== 'resolved' && (
                <div className="flex gap-2 mt-2">
                  {f.status === 'pending' && (
                    <button
                      className="px-2.5 py-1 text-xs font-medium bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors cursor-pointer"
                      onClick={() => onFaultStatusChange(f.id, 'in_progress')}
                      type="button"
                    >
                      Przyjmij
                    </button>
                  )}
                  <button
                    className="px-2.5 py-1 text-xs font-medium bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors cursor-pointer"
                    onClick={() => onFaultStatusChange(f.id, 'resolved')}
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

function IconBtn({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
        variant === 'danger'
          ? 'bg-danger/5 hover:bg-danger/10 text-danger border-danger/30'
          : 'bg-secondary hover:bg-border text-text-secondary border-border hover:text-foreground'
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

function DetailRow({
  icon,
  label,
  value,
  editMode = false,
  onChange,
  inputType = 'text',
}: {
  icon: React.ReactNode
  label: string
  value: string
  editMode?: boolean
  onChange?: (v: string) => void
  inputType?: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm text-muted-foreground w-28 shrink-0">
        {label}:
      </span>
      {editMode ? (
        <input
          className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          onChange={e => onChange?.(e.target.value)}
          type={inputType}
          value={value}
        />
      ) : (
        <span className="flex-1 text-sm font-semibold text-foreground text-right truncate">
          {value}
        </span>
      )}
    </div>
  )
}
