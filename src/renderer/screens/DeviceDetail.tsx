import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Cpu,
  Download,
  FileText,
  Hash,
  MapPin,
  Pencil,
  Tag,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import type {
  Device,
  DeviceEvent,
  DeviceStatus,
  UpdateDeviceInput,
} from 'shared/types'
import { QRPreview, exportDeviceQrAsPng } from '../components/ui/QRPreview'
import { StatusBadge } from '../components/device/StatusBadge'
import { EventTimeline } from '../components/device/EventTimeline'
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
  const [mode, setMode] = useState<Mode>('view')
  const [editData, setEditData] = useState<UpdateDeviceInput | null>(null)
  const [showFaultForm, setShowFaultForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [dev, evts] = await Promise.all([
      window.dbAPI.getDevice(deviceUuid),
      window.dbAPI.getEvents(deviceUuid),
    ])
    if (dev) setDevice(dev)
    setEvents(evts)
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
          {/* Device header */}
          <div className="flex items-start gap-5">
            <div className="shrink-0 rounded-xl overflow-hidden border border-border">
              <QRPreview deviceId={device.uuid} size={104} />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {device.name}
                </h2>
                <div className="flex gap-1.5 shrink-0">
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
              <button
                className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => exportDeviceQrAsPng(device.uuid)}
                type="button"
              >
                <Download size={11} />
                Eksportuj QR jako PNG
              </button>
            </div>
          </div>

          {/* Delete confirmation */}
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

          {/* Szczegóły */}
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

          {/* Historia zdarzeń */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Historia zdarzeń
            </h3>
            <EventTimeline events={events} />
          </section>

          {showFaultForm && (
            <FaultReportForm
              onClose={() => setShowFaultForm(false)}
              onSubmit={handleFaultSubmit}
            />
          )}
        </div>
      </div>

      {/* FAB */}
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
