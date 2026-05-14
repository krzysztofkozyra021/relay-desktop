import { contextBridge, ipcRenderer } from 'electron'
import type { Device } from 'shared/types'

declare global {
  interface Window {
    App: typeof API
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
})

contextBridge.exposeInMainWorld('qrAPI', {
  savePng: (dataUrl: string, defaultName: string) =>
    ipcRenderer.invoke('qr:save-png', dataUrl, defaultName),
})
