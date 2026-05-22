import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, RefreshCw, X } from 'lucide-react'
import type { ApiUser, Device } from 'shared/types'
import { canManageFaults } from 'shared/utils'
import { Sidebar } from 'renderer/components/layout/Sidebar'
import { DeviceForm } from '../components/DeviceForm'
import { DeviceList } from '../components/device/DeviceList'
import { DeviceDetail } from './DeviceDetail'
import { FaultsScreen } from './FaultsScreen'

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
  const canManage = canManageFaults(user)
  const [mode, setMode] = useState<Mode>('list')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [activeFaultCount, setActiveFaultCount] = useState(0)
  const [lastSynced, setLastSynced] = useState<Date | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY)
    return stored ? new Date(stored) : null
  })
  const [syncLabel, setSyncLabel] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDevices = async () => {
    try {
      const fetched = await window.dbAPI.getDevices()
      setDevices(fetched)
    } catch (error) {
      console.error(error)
    }
  }

  const runSync = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      const synced = await window.authAPI.syncDevices()
      setDevices(synced)
      if (canManage) {
        const faults = await window.faultAPI.getFaults()
        setActiveFaultCount(
          faults.filter(fault => fault.status !== 'resolved').length
        )
      } else {
        setActiveFaultCount(0)
      }
      const now = new Date()
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString())
      setLastSynced(now)
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Synchronizacja nie powiodła się.'
      setSyncError(msg)
      await fetchDevices()
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    runSync()
  }, [])

  const runSyncRef = useRef(runSync)
  useEffect(() => {
    runSyncRef.current = runSync
  })

  useEffect(() => {
    const interval = setInterval(() => {
      runSyncRef.current()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

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
      if (!canManage) return
      setMode('faults')
      setSelectedUuid(null)
    } else {
      backToList()
    }
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
        ? (devices.find(device => device.uuid === selectedUuid)?.name ?? '…')
        : mode === 'faults'
          ? 'Aktywne zgłoszenia usterek'
          : `${devices.length} zarejestrowanych urządzeń`

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        active={mode === 'faults' ? 'faults' : 'devices'}
        faultCount={activeFaultCount}
        deviceCount={devices.length}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        onShowProfile={() => setShowProfile(true)}
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
            <FaultsScreen
              canManage={canManage}
              onFaultCountChange={setActiveFaultCount}
            />
          ) : mode === 'detail' && selectedUuid ? (
            <DeviceDetail
              deviceUuid={selectedUuid}
              onBack={backToList}
              onDeleted={() => {
                fetchDevices()
                backToList()
              }}
              onSyncNeeded={runSync}
              user={user}
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

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-card border border-border w-96 rounded-2xl shadow-xl overflow-hidden p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setShowProfile(false)}
              type="button"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center text-white text-2xl font-bold border-2 border-border shadow-md mb-4">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>

              <h2 className="text-lg font-bold text-foreground">
                {user.name || 'Użytkownik'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>

              <span className="mt-3 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                {user.is_admin
                  ? 'Administrator'
                  : user.is_installer
                    ? 'Instalator'
                    : user.is_service
                      ? 'Serwisant'
                      : 'Użytkownik'}
              </span>
            </div>

            <div className="mt-6 border-t border-border pt-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Uprawnienia systemowe
                </p>
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                    <span className="text-foreground font-medium">
                      Zarządzanie urządzeniami
                    </span>
                    <span
                      className={
                        user.is_admin || user.is_installer
                          ? 'text-success font-semibold'
                          : 'text-muted-foreground'
                      }
                    >
                      {user.is_admin || user.is_installer
                        ? 'Dozwolone'
                        : 'Brak dostępu'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                    <span className="text-foreground font-medium">
                      Zarządzanie usterkami
                    </span>
                    <span
                      className={
                        user.is_admin || user.is_service
                          ? 'text-success font-semibold'
                          : 'text-muted-foreground'
                      }
                    >
                      {user.is_admin || user.is_service
                        ? 'Dozwolone'
                        : 'Brak dostępu'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-xl p-3 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Status profilu
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Twój profil jest w trybie podglądu. Jeśli dane są niepoprawne
                  lub wymagają aktualizacji, skontaktuj się z administratorem
                  systemu Relay.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 bg-secondary hover:bg-border text-text-secondary text-sm font-semibold rounded-lg border border-border transition-colors cursor-pointer"
                onClick={() => setShowProfile(false)}
                type="button"
              >
                Zamknij podgląd
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
