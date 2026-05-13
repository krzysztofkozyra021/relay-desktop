import { useEffect, useState } from 'react'
import { DeviceForm } from '../components/DeviceForm'
import { QRPreview, exportDeviceQrAsPng } from '../components/ui/QRPreview'
import type { Device } from 'shared/types'

export function MainScreen() {
  const [mode, setMode] = useState<'list' | 'add'>('list')
  const [devices, setDevices] = useState<Device[]>([])

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

  return (
    <main className="flex flex-col items-center p-10 min-h-screen bg-background">
      <div className="no-print w-full max-w-3xl flex justify-between mb-6">
        <h1 className="text-3xl text-teal-300">Relay — urządzenia</h1>
        <button
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded transition-colors"
          onClick={() => setMode(mode === 'list' ? 'add' : 'list')}
        >
          {mode === 'list' ? '+ Dodaj urządzenie' : '← Wróć do listy'}
        </button>
      </div>

      {mode === 'add' ? (
        <DeviceForm onSaved={fetchDevices} />
      ) : (
        <DeviceList devices={devices} />
      )}
    </main>
  )
}

function DeviceList({ devices }: { devices: Device[] }) {
  return (
    <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-white text-xl mb-4 font-semibold">
        Zarejestrowane urządzenia ({devices.length})
      </h2>
      {devices.length === 0 ? (
        <p className="text-zinc-500 italic">Nie znaleziono urządzeń w bazie.</p>
      ) : (
        <ul className="space-y-4">
          {devices.map((device: Device) => (
            <li
              className="p-4 bg-zinc-800 rounded-md border border-zinc-700"
              key={device.uuid}
            >
              <div className="flex gap-4">
                <QRPreview deviceId={device.uuid} size={96} />

                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <h3 className="text-teal-300 font-bold">
                      {device.name}{' '}
                      <span className="text-xs text-zinc-500 font-normal ml-2">
                        ({device.uuid.slice(0, 8)}…)
                      </span>
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                      Marka: {device.brand} | Model: {device.model} | Typ:{' '}
                      {device.type}
                    </p>
                  </div>
                  <button
                    className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                    onClick={() => exportDeviceQrAsPng(device.uuid)}
                  >
                    Eksportuj PNG
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-700">
                Lokalizacja: {device.location} | Notatki: {device.notes}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
