import { QRPreview } from '../renderer/components/ui/QRPreview'

type Device = { id: string; serial: string; location: string }

export function PrintView({
  devices,
  baseUrl,
}: {
  devices: Device[]
  baseUrl: string
}) {
  return (
    <div className="print-sheet">
      {devices.map(d => (
        <div className="label" key={d.id}>
          <QRPreview baseUrl={baseUrl} deviceId={d.id} size={180} />
          <div className="meta">
            <strong>{d.serial}</strong>
            <span>{d.location}</span>
          </div>
        </div>
      ))}
      <button className="no-print" onClick={() => window.print()}>
        Drukuj
      </button>
    </div>
  )
}
