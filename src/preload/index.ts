import { contextBridge, ipcRenderer } from 'electron'
import type {
  Device,
  DeviceEvent,
  UpdateDeviceInput,
  AddEventInput,
  ApiLoginResult,
  CreateFaultInput,
  FaultReport,
  FaultStatus,
} from 'shared/types'

declare global {
  interface Window {
    App: typeof API
    authAPI: {
      login: (email: string, password: string) => Promise<ApiLoginResult>
      register: (
        name: string,
        email: string,
        password: string,
        passwordConfirmation: string
      ) => Promise<ApiLoginResult>
      logout: () => Promise<void>
      syncDevices: () => Promise<Device[]>
      loginWithGoogle: () => Promise<ApiLoginResult>
      getSession: () => Promise<ApiUser | null>
    }
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
    faultAPI: {
      getFaults: (status?: FaultStatus) => Promise<FaultReport[]>
      getDeviceFaults: (uuid: string) => Promise<FaultReport[]>
      createFault: (
        deviceUuid: string,
        payload: CreateFaultInput
      ) => Promise<FaultReport | null>
      updateFaultStatus: (
        id: number,
        status: FaultStatus
      ) => Promise<FaultReport | null>
    }
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,
}

contextBridge.exposeInMainWorld('App', API)

contextBridge.exposeInMainWorld('authAPI', {
  login: (email: string, password: string) =>
    ipcRenderer.invoke('api:login', email, password),
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) =>
    ipcRenderer.invoke(
      'api:register',
      name,
      email,
      password,
      passwordConfirmation
    ),
  logout: () => ipcRenderer.invoke('api:logout'),
  syncDevices: () => ipcRenderer.invoke('api:sync-devices'),
  loginWithGoogle: () => ipcRenderer.invoke('api:login-google'),
  getSession: () => ipcRenderer.invoke('api:get-session'),
})

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

contextBridge.exposeInMainWorld('faultAPI', {
  getFaults: (status?: FaultStatus) =>
    ipcRenderer.invoke('api:get-faults', status),
  getDeviceFaults: (uuid: string) =>
    ipcRenderer.invoke('api:get-device-faults', uuid),
  createFault: (deviceUuid: string, payload: CreateFaultInput) =>
    ipcRenderer.invoke('api:create-fault', deviceUuid, payload),
  updateFaultStatus: (id: number, status: FaultStatus) =>
    ipcRenderer.invoke('api:update-fault-status', id, status),
})
