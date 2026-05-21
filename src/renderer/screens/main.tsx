import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, FlaskConical, Plus, RefreshCw } from 'lucide-react'
import type { ApiUser, Device } from 'shared/types'
import { Sidebar } from 'renderer/components/layout/Sidebar'
import { DeviceForm } from '../components/DeviceForm'
import { DeviceList } from '../components/device/DeviceList'
import { DeviceDetail } from './DeviceDetail'
import { FaultsScreen } from './FaultsScreen'
import { seedTestDevices } from '../debug/testData'

const IS_TEST = import.meta.env.VITE_APP_DEBUG === 'test'
const LAST_SYNC_KEY = 'relay:lastSynced'

type Mode = 'list' | 'add' | 'detail' | 'faults'

function formatLastSync(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'przed chwilą'
  if (diffMin === 1) return '1 minutę temu'
  if (diffMin < 60) return `${diffMin} minut temu`
  const diffH = Math.floor(diffMin / 60)
  if (diffH === 1) return '1 godzinę temu'
  if (diffH < 24) return `${diffH} godzin temu`
  return date.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MainScreen({
  user,
  onLogout,
}: {
  user: ApiUser
  onLogout: () => void
}) {
  const [mode, setMode] = useState<Mode>('list')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [activeFaultCount, setActiveFaultCount] = useState(0)
  const [lastSynced, setLastSynced] = useState<Date | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY)
    return stored ? new Date(stored) : null
  })
  const [syncLabel, setSyncLabel] = useState('')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDevices = async () => {
    try {
      const fetched = await window.dbAPI.getDevices()
      setDevices(fetched)
    } catch (e) {
      console.error(e)
    }
  }

  const runSync = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      const [synced, faults] = await Promise.all([
        window.authAPI.syncDevices(),
        window.faultAPI.getFaults(),
      ])
      setDevices(synced)
      setActiveFaultCount(faults.filter(f => f.status !== 'resolved').length)
      const now = new Date()
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString())
      setLastSynced(now)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Synchronizacja nie powiodła się.'
      setSyncError(msg)
      await fetchDevices()
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    runSync()
  }, [])

  // Keep the "X minut temu" label fresh
  useEffect(() => {
    const update = () =>
      setSyncLabel(lastSynced ? formatLastSync(lastSynced) : '')
    update()
    tickRef.current = setInterval(update, 30_000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [lastSynced])

  const openDetail = (uuid: string) => {
    setSelectedUuid(uuid)
    setMode('detail')
  }

  const backToList = () => {
    setMode('list')
    setSelectedUuid(null)
  }

  const handleNavigate = (id: string) => {
    if (id === 'faults') {
      setMode('faults')
      setSelectedUuid(null)
    } else {
      backToList()
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    await seedTestDevices()
    await fetchDevices()
    setSeeding(false)
  }

  const headerTitle =
    mode === 'add'
      ? 'Nowe urządzenie'
      : mode === 'detail'
        ? 'Profil urządzenia'
        : mode === 'faults'
          ? 'Usterki'
          : 'Urządzenia'

  const headerSubtitle =
    mode === 'add'
      ? 'Uzupełnij dane i wygeneruj kod QR'
      : mode === 'detail'
        ? (devices.find(d => d.uuid === selectedUuid)?.name ?? '…')
        : mode === 'faults'
          ? 'Aktywne zgłoszenia usterek'
          : `${devices.length} zarejestrowanych urządzeń`

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        active={mode === 'faults' ? 'faults' : 'devices'}
        faultCount={activeFaultCount}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 h-16 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {headerTitle}
            </h1>
            <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {IS_TEST && mode === 'list' && (
              <button
                className="flex items-center gap-1.5 px-3 py-2 bg-warning/10 hover:bg-warning/20 text-warning text-xs font-semibold rounded-lg border border-warning/30 transition-colors cursor-pointer"
                disabled={seeding}
                onClick={handleSeed}
                type="button"
              >
                <FlaskConical size={14} />
                {seeding ? 'Seedowanie…' : 'Seed DB'}
              </button>
            )}
            {(mode === 'list' || mode === 'faults') && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  {syncing ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <RefreshCw className="animate-spin" size={11} />
                      Synchronizacja…
                    </span>
                  ) : syncError ? (
                    <span className="text-danger" title={syncError}>
                      Błąd synchronizacji
                    </span>
                  ) : (
                    syncLabel && (
                      <span
                        className="text-muted-foreground"
                        title={lastSynced?.toLocaleString('pl-PL')}
                      >
                        Zsynchronizowano: {syncLabel}
                      </span>
                    )
                  )}
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-border text-foreground text-xs font-medium rounded-lg border border-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                  disabled={syncing}
                  onClick={runSync}
                  title="Synchronizuj z API"
                  type="button"
                >
                  <RefreshCw
                    className={syncing ? 'animate-spin' : ''}
                    size={13}
                  />
                  Synchronizuj
                </button>
              </div>
            )}
            {mode === 'list' && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium rounded-lg transition-colors cursor-pointer"
                onClick={() => setMode('add')}
                type="button"
              >
                <Plus size={16} />
                Dodaj urządzenie
              </button>
            )}
            {(mode === 'add' || mode === 'detail') && (
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={backToList}
                type="button"
              >
                <ArrowLeft size={15} />
                Wróć do listy
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {mode === 'faults' ? (
            <FaultsScreen onFaultCountChange={setActiveFaultCount} />
          ) : mode === 'detail' && selectedUuid ? (
            <DeviceDetail
              deviceUuid={selectedUuid}
              onBack={backToList}
              onDeleted={() => {
                fetchDevices()
                backToList()
              }}
              user={user.email}
            />
          ) : mode === 'add' ? (
            <div className="h-full overflow-auto p-6">
              <DeviceForm onBack={backToList} onSaved={fetchDevices} />
            </div>
          ) : (
            <div className="h-full overflow-auto p-6">
              <DeviceList devices={devices} onSelect={openDetail} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
