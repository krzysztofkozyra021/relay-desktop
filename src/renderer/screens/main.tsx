import { Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from 'renderer/components/ui/alert'
import type { Device } from 'shared/types'

const { App } = window

export function MainScreen() {
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    App.sayHelloFromBridge()
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const devices = await window.dbAPI.getDevices()
      setDevices(devices)
    } catch (e) {
      console.error('Failed to get devices', e)
    }
  }

  const handleAddTestDevice = async () => {
    try {
      const uuid = crypto.randomUUID()
      await window.dbAPI.addDevice(
        uuid,
        'Test Device Name',
        'Type A',
        'Model X',
        'Brand Z',
        'SN-123456',
        'Office 1',
        new Date().toISOString(),
        'This is a test device'
      )
      await fetchDevices() // Refresh the list
    } catch (error) {
      console.error('Failed to insert test device:', error)
    }
  }

  const userName = App.username || 'there'

  return (
    <main className="flex flex-col items-center p-10 h-screen bg-background overflow-y-auto">
      <Alert className="mt-5 bg-transparent border-transparent text-accent w-fit mb-8">
        <AlertTitle className="text-5xl text-teal-400">
          Hi, {userName}!
        </AlertTitle>

        <AlertDescription className="flex items-center gap-2 text-lg mt-4">
          <Terminal className="size-6 text-fuchsia-300" />
          <span className="text-gray-400">
            Database testing offline viewer!
          </span>
        </AlertDescription>
      </Alert>

      <button
        className="px-4 py-2 mb-8 bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors"
        onClick={handleAddTestDevice}
      >
        Add Test Device
      </button>

      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-white text-xl mb-4 font-semibold">
          Registered Devices ({devices.length})
        </h2>
        {devices.length === 0 ? (
          <p className="text-zinc-500 italic">
            No devices found in local database.
          </p>
        ) : (
          <ul className="space-y-4">
            {devices.map((device: Device) => (
              <li
                className="p-4 bg-zinc-800 rounded-md border border-zinc-700"
                key={device.uuid}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-teal-300 font-bold">
                      {device.name}{' '}
                      <span className="text-xs text-zinc-500 font-normal ml-2">
                        ({device.uuid})
                      </span>
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                      Brand: {device.brand} | Model: {device.model} | Type:{' '}
                      {device.type}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                    {device.serial_number}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-700">
                  Location: {device.location} | Node Notes: {device.notes}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
