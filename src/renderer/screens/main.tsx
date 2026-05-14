import { useEffect, useState } from 'react'
import { Plus, FlaskConical, MapPin, Download, Server } from 'lucide-react'
import type { Device } from 'shared/types'
import { Sidebar } from 'renderer/components/layout/Sidebar'
import { DeviceForm } from '../components/DeviceForm'
import { QRPreview, exportDeviceQrAsPng } from '../components/ui/QRPreview'
import { seedTestDevices } from '../debug/testData'

const IS_TEST = import.meta.env.VITE_APP_DEBUG === 'test'

type Mode = 'list' | 'add'

export function MainScreen({
  user,
  onLogout,
}: {
  user: string
  onLogout: () => void
}) {
  const [mode, setMode] = useState<Mode>('list')
  const [devices, setDevices] = useState<Device[]>([])
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

  const handleSeed = async () => {
    setSeeding(true)
    await seedTestDevices()
    await fetchDevices()
    setSeeding(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        active="devices"
        onLogout={onLogout}
        onNavigate={() => setMode('list')}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="bg-card border-b border-border px-6 h-16 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {mode === 'list' ? 'Urządzenia' : 'Nowe urządzenie'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === 'list'
                ? `${devices.length} zarejestrowanych urządzeń`
                : 'Uzupełnij dane i wygeneruj kod QR'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {IS_TEST && mode === 'list' && (
              <button
                className="flex items-center gap-1.5 px-3 py-2 bg-warning/10 hover:bg-warning/20 text-warning text-xs font-semibold rounded-lg border border-warning/30 transition-colors"
                disabled={seeding}
                onClick={handleSeed}
                type="button"
              >
                <FlaskConical size={14} />
                {seeding ? 'Seedowanie…' : 'Seed DB'}
              </button>
            )}

            {mode === 'list' ? (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium rounded-lg transition-colors"
                onClick={() => setMode('add')}
                type="button"
              >
                <Plus size={16} />
                Dodaj urządzenie
              </button>
            ) : (
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode('list')}
                type="button"
              >
                ← Wróć do listy
              </button>
            )}
          </div>
        </header>


        <main className="flex-1 overflow-auto p-6">
          {mode === 'add' ? (
            <DeviceForm onBack={() => setMode('list')} onSaved={fetchDevices} />
          ) : (
            <DeviceList devices={devices} />
          )}
        </main>
      </div>
    </div>
  )
}

function DeviceList({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Server className="text-muted-foreground" size={20} />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Brak urządzeń
        </p>
        <p className="text-xs text-muted-foreground">
          Dodaj pierwsze urządzenie, aby zobaczyć je tutaj.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {devices.map(device => (
        <DeviceCard device={device} key={device.uuid} />
      ))}
    </div>
  )
}

function DeviceCard({ device }: { device: Device }) {
  const meta = [device.brand, device.model, device.type]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-5 hover:shadow-sm transition-shadow group">
      <div className="shrink-0 rounded-lg overflow-hidden border border-border">
        <QRPreview deviceId={device.uuid} size={80} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">
              {device.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
          </div>

          <button
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-border text-text-secondary hover:text-foreground text-xs font-medium rounded-lg border border-border transition-colors opacity-0 group-hover:opacity-100"
            onClick={() => exportDeviceQrAsPng(device.uuid)}
            type="button"
          >
            <Download size={12} />
            PNG
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2.5">
          {device.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {device.location}
            </span>
          )}
          {device.serial_number && (
            <span className="text-xs text-muted-foreground">
              S/N: {device.serial_number}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto font-mono">
            {device.uuid.slice(0, 8)}…
          </span>
        </div>
      </div>
    </div>
  )
}
