import { useEffect, useState } from 'react'
import { ArrowLeft, FlaskConical, Plus } from 'lucide-react'
import type { Device } from 'shared/types'
import { Sidebar } from 'renderer/components/layout/Sidebar'
import { DeviceForm } from '../components/DeviceForm'
import { DeviceList } from '../components/device/DeviceList'
import { DeviceDetail } from './DeviceDetail'
import { seedTestDevices } from '../debug/testData'

const IS_TEST = import.meta.env.VITE_APP_DEBUG === 'test'

type Mode = 'list' | 'add' | 'detail'

export function MainScreen({
  user,
  onLogout,
}: {
  user: string
  onLogout: () => void
}) {
  const [mode, setMode] = useState<Mode>('list')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const fetchDevices = async () => {
    try {
      const fetched = await window.dbAPI.getDevices()
      setDevices(fetched)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const openDetail = (uuid: string) => {
    setSelectedUuid(uuid)
    setMode('detail')
  }

  const backToList = () => {
    setMode('list')
    setSelectedUuid(null)
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
        : 'Urządzenia'

  const headerSubtitle =
    mode === 'add'
      ? 'Uzupełnij dane i wygeneruj kod QR'
      : mode === 'detail'
        ? (devices.find(d => d.uuid === selectedUuid)?.name ?? '…')
        : `${devices.length} zarejestrowanych urządzeń`

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        active="devices"
        onLogout={onLogout}
        onNavigate={backToList}
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
          {mode === 'detail' && selectedUuid ? (
            <DeviceDetail
              deviceUuid={selectedUuid}
              onBack={backToList}
              onDeleted={() => {
                fetchDevices()
                backToList()
              }}
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
    </div>
  )
}
