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
  Pencil,
  Printer,
  Tag,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import type {
  ApiUser,
  Device,
  DeviceEvent,
  DeviceStatus,
  FaultReport,
  FaultStatus,
  UpdateDeviceInput,
} from 'shared/types'
import { canManageFaults } from 'shared/utils'
import { QRPreview, exportDeviceQrAsPng } from '../components/ui/QRPreview'
import { StatusBadge } from '../components/device/StatusBadge'
import { FaultReportForm } from '../components/device/FaultReportForm'
import { DetailRow } from '../components/device/DetailRow'
import { IconBtn } from '../components/device/IconBtn'
import { MergedTimeline } from '../components/device/MergedTimeline'

type Mode = 'view' | 'edit'

type Props = {
  deviceUuid: string
  user: ApiUser
  onBack: () => void
  onDeleted: () => void
  onSyncNeeded?: () => void
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
  onSyncNeeded,
}: Props) {
  const canManage = canManageFaults(user)
  const [device, setDevice] = useState<Device | null>(null)
  const [events, setEvents] = useState<DeviceEvent[]>([])
  const [faults, setFaults] = useState<FaultReport[]>([])
  const [mode, setMode] = useState<Mode>('view')
  const [editData, setEditData] = useState<UpdateDeviceInput | null>(null)
  const [showFaultForm, setShowFaultForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [updatingFault, setUpdatingFault] = useState<{
    id: number
    status: FaultStatus
  } | null>(null)

  const load = async () => {
    const [deviceData, eventsList, faultList] = await Promise.all([
      window.dbAPI.getDevice(deviceUuid),
      window.dbAPI.getEvents(deviceUuid),
      window.faultAPI.getDeviceFaults(deviceUuid),
    ])
    if (deviceData) setDevice(deviceData)
    setEvents(eventsList)
    setFaults(faultList)
  }

  useEffect(() => {
    load()

    const interval = setInterval(() => {
      load()
    }, 30000)

    return () => clearInterval(interval)
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
      await load()
      setMode('view')
      setEditData(null)
      onSyncNeeded?.()
    } finally {
      setSaving(false)
    }
  }

  const handleFaultSubmit = async (input: {
    title: string
    description: string
  }): Promise<boolean> => {
    if (!device) return false
    const created = await window.faultAPI.createFault(device.uuid, {
      title: input.title,
      description: input.description || undefined,
      reported_by: user.name || undefined,
      contact: user.email || undefined,
    })
    if (!created) return false
    setShowFaultForm(false)

    if (device.status === 'active') {
      await window.dbAPI.updateDevice(device.uuid, {
        name: device.name,
        type: device.type,
        model: device.model ?? '',
        brand: device.brand ?? '',
        serial_number: device.serial_number ?? '',
        location: device.location,
        installation_date: toDateInput(device.installation_date),
        notes: device.notes ?? '',
        status: 'repair',
      })
    }

    await load()
    onSyncNeeded?.()
    return true
  }

  const handleDelete = async () => {
    if (!device) return
    setDeleting(true)
    try {
      await window.dbAPI.deleteDevice(device.uuid)
      onDeleted()
    } catch (error) {
      console.error(error)
      setDeleting(false)
    }
  }

  const handleFaultStatusChange = async (id: number, status: FaultStatus) => {
    setUpdatingFault({ id, status })
    try {
      const updated = await window.faultAPI.updateFaultStatus(id, status)
      if (updated) {
        setFaults(prev => {
          const next = prev.map(f => (f.id === id ? updated : f))

          if (device && device.status !== 'retired') {
            const activeFaults = next.filter(f => f.status !== 'resolved')

            let nextDeviceStatus: DeviceStatus = device.status
            if (activeFaults.length > 0) {
              nextDeviceStatus = 'repair'
            } else {
              nextDeviceStatus = 'active'
            }

            if (nextDeviceStatus !== device.status) {
              window.dbAPI
                .updateDevice(device.uuid, {
                  name: device.name,
                  type: device.type,
                  model: device.model ?? '',
                  brand: device.brand ?? '',
                  serial_number: device.serial_number ?? '',
                  location: device.location,
                  installation_date: toDateInput(device.installation_date),
                  notes: device.notes ?? '',
                  status: nextDeviceStatus,
                })
                .then(() => load())
            }
          }
          return next
        })
        await load()
        onSyncNeeded?.()
      }
    } finally {
      setUpdatingFault(null)
    }
  }

  const setEdit = <Key extends keyof UpdateDeviceInput>(
    key: Key,
    value: UpdateDeviceInput[Key]
  ) => setEditData(prev => (prev ? { ...prev, [key]: value } : prev))

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
          {device.status === 'active' &&
            faults.filter(f => f.status !== 'resolved').length === 0 && (
              <div className="no-print flex items-center gap-2.5 px-4 py-3 bg-success/10 border border-success/30 rounded-xl text-success">
                <CheckCircle className="shrink-0" size={18} />
                <div>
                  <p className="text-sm font-semibold">
                    Urządzenie działa prawidłowo
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Brak aktywnych usterek.
                  </p>
                </div>
              </div>
            )}
          {device.status === 'retired' && (
            <div className="no-print flex items-center justify-between gap-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl">
              <div className="flex items-center gap-2.5 text-danger">
                <AlertTriangle className="shrink-0" size={18} />
                <div>
                  <p className="text-sm font-semibold">
                    Urządzenie wycofane z użytku
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dane są dostępne wyłącznie w trybie podglądu (tylko do
                    odczytu).
                  </p>
                </div>
              </div>
              {canManage && (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-danger text-white hover:bg-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                  disabled={restoring}
                  onClick={async () => {
                    setRestoring(true)
                    try {
                      const hasActiveFaults = faults.some(f => f.status !== 'resolved')
                      await window.dbAPI.updateDevice(device.uuid, {
                        name: device.name,
                        type: device.type,
                        model: device.model ?? '',
                        brand: device.brand ?? '',
                        serial_number: device.serial_number ?? '',
                        location: device.location,
                        installation_date: toDateInput(device.installation_date),
                        notes: device.notes ?? '',
                        status: hasActiveFaults ? 'repair' : 'active',
                      })
                      await load()
                      onSyncNeeded?.()
                    } finally {
                      setRestoring(false)
                    }
                  }}
                  type="button"
                >
                  {restoring ? 'Przywracanie…' : 'Przywróć do użytku'}
                </button>
              )}
            </div>
          )}

          {device.status === 'repair' &&
            (() => {
              const inProgressFaults = faults.filter(
                f => f.status === 'in_progress'
              )
              const activeCount = faults.filter(
                f => f.status !== 'resolved'
              ).length

              const newestInProgress = [...inProgressFaults].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )[0]

              const lastUserEvent = events.find(
                e => e.user && e.user !== 'System' && e.user !== 'Anonim'
              )
              const repairTech = lastUserEvent
                ? lastUserEvent.user
                : 'Serwisant'

              return (
                <div className="no-print flex items-start gap-3.5 px-4 py-3.5 bg-warning/10 border border-warning/30 rounded-xl text-warning">
                  <Wrench className="shrink-0 mt-0.5" size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Urządzenie w naprawie
                      </p>
                      {activeCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-warning/20 rounded-full shrink-0">
                          Aktywne usterki: {activeCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {newestInProgress ? (
                        <>
                          <strong className="text-warning font-medium">
                            {repairTech}
                          </strong>{' '}
                          podjął się naprawy najnowszego zgłoszenia:{' '}
                          <span className="italic text-foreground">
                            „{newestInProgress.title}”
                          </span>
                          .
                        </>
                      ) : activeCount > 0 ? (
                        <>
                          Zgłoszono nowe usterki, oczekujące na podjęcie naprawy
                          przez serwisanta.
                        </>
                      ) : (
                        <>
                          Trwają prace serwisowe nad tym urządzeniem (brak
                          aktywnych szczegółowych zgłoszeń w toku).
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )
            })()}

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
                    device.status !== 'retired' && (
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
                    )
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
                  className="px-3 py-1.5 bg-secondary hover:bg-border text-text-secondary text-xs font-medium rounded-lg border border-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                  disabled={deleting}
                  onClick={() => setDeleteConfirm(false)}
                  type="button"
                >
                  Anuluj
                </button>
                <button
                  className="px-3 py-1.5 bg-danger hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                  disabled={deleting}
                  onClick={handleDelete}
                  type="button"
                >
                  {deleting ? 'Usuwanie…' : 'Usuń urządzenie'}
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
              canManage={canManage && device.status !== 'retired'}
              currentUser={user}
              events={events}
              faults={faults}
              onFaultStatusChange={handleFaultStatusChange}
              updatingFault={updatingFault}
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

      {!showFaultForm && mode === 'view' && device.status !== 'retired' && (
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
