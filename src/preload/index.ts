import { contextBridge, ipcRenderer } from 'electron'
import type {
  Device,
  DeviceEvent,
  UpdateDeviceInput,
  AddEventInput,
} from 'shared/types'

declare global {
  interface Window {
    App: typeof API
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
    qrAPI: {
      savePng: (dataUrl: string, defaultName: string) => Promise<string | null>
    }
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,
}

contextBridge.exposeInMainWorld('App', API)

contextBridge.exposeInMainWorld('dbAPI', {
  getDevices: () => ipcRenderer.invoke('db:get-devices'),
  getDevice: (uuid: string) => ipcRenderer.invoke('db:get-device', uuid),
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
  ) =>
    ipcRenderer.invoke(
      'db:add-device',
      deviceId,
      name,
      type,
      model,
      brand,
      serial_number,
      location,
      installation_date,
      notes
    ),
  updateDevice: (uuid: string, data: UpdateDeviceInput) =>
    ipcRenderer.invoke('db:update-device', uuid, data),
  deleteDevice: (uuid: string) => ipcRenderer.invoke('db:delete-device', uuid),
  getEvents: (device_uuid: string) =>
    ipcRenderer.invoke('db:get-events', device_uuid),
  addEvent: (data: AddEventInput) => ipcRenderer.invoke('db:add-event', data),
})

contextBridge.exposeInMainWorld('qrAPI', {
  savePng: (dataUrl: string, defaultName: string) =>
    ipcRenderer.invoke('qr:save-png', dataUrl, defaultName),
})
