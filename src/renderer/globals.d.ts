import type {
  Device,
  DeviceEvent,
  UpdateDeviceInput,
  AddEventInput,
} from 'shared/types'

declare global {
  interface Window {
    dbAPI: {
      getDevices: () => Promise<Device[]>
      getDevice: (uuid: string) => Promise<Device | undefined>
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
      updateDevice: (uuid: string, data: UpdateDeviceInput) => Promise<void>
      deleteDevice: (uuid: string) => Promise<void>
      getEvents: (device_uuid: string) => Promise<DeviceEvent[]>
      addEvent: (data: AddEventInput) => Promise<number | bigint>
    }
  }
}
