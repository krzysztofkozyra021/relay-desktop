import { Server } from 'lucide-react'
import type { Device } from 'shared/types'
import { DeviceCard } from './DeviceCard'

type Props = {
  devices: Device[]
  onSelect: (uuid: string) => void
}

export function DeviceList({ devices, onSelect }: Props) {
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
        <DeviceCard device={device} key={device.uuid} onSelect={onSelect} />
      ))}
    </div>
  )
}
