import { Download, MapPin } from 'lucide-react'
import type { Device } from 'shared/types'
import { QRPreview, exportDeviceQrAsPng } from '../ui/QRPreview'

type Props = {
  device: Device
  onSelect: (uuid: string) => void
}

export function DeviceCard({ device, onSelect }: Props) {
  const meta = [device.brand, device.model, device.type]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="relative bg-card border border-border rounded-xl p-4 flex items-start gap-5 hover:shadow-sm hover:border-primary/30 transition-all group">
      <button
        aria-label={`Otwórz szczegóły: ${device.name}`}
        className="absolute inset-0 rounded-xl cursor-pointer"
        onClick={() => onSelect(device.uuid)}
        type="button"
      />

      {/* pointer-events-none — kliknięcie "przelatuje" do overlay buttona powyżej */}
      <div className="shrink-0 rounded-lg overflow-hidden border border-border pointer-events-none">
        <QRPreview deviceId={device.uuid} size={80} />
      </div>

      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
              {device.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
          </div>

          {/* pointer-events-auto — przywraca klikalność tylko dla tego przycisku */}
          <button
            className="relative z-10 shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-border text-text-secondary hover:text-foreground text-xs font-medium rounded-lg border border-border transition-colors opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
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
