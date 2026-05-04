import type { Device } from 'shared/types'

declare global {
  interface Window {
    dbAPI: {
      getDevices: () => Promise<Device[]>
      addDevice: (
        deviceId: string,
        name: string,
        type: string,
        model: string,
        brand: string,
        serial_number: string,
        location: string,
        installation_date: string,
        notes: string
      ) => Promise<number | bigint>
    }
  }
}
