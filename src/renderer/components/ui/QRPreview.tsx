import { useEffect, useState } from 'react'
import QRCode from 'qrcode'


const RELAY_BASE_URL = 'https://relay.app/r'

type Props = {
  deviceId: string
  size?: number
  baseUrl?: string
}

export function QRPreview({ deviceId, size = 96, baseUrl }: Props) {
  const [svg, setSvg] = useState('')
  const url = `${baseUrl || RELAY_BASE_URL}/${deviceId}`

  useEffect(() => {
    QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 4,
      width: size,
    }).then(setSvg)
  }, [url, size])

  return (
    <div
      aria-label={`QR dla urządzenia ${deviceId}`}
      className="bg-white rounded p-1 shrink-0"
      
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      style={{ width: size, height: size }}
    />
  )
}

export async function exportDeviceQrAsPng(deviceUuid: string) {
  const dataUrl = await QRCode.toDataURL(`${RELAY_BASE_URL}/${deviceUuid}`, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 1024, 
  })
  return window.qrAPI.savePng(dataUrl, `relay-${deviceUuid.slice(0, 8)}.png`)
}
