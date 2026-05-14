import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

export type DeviceStatus = 'active' | 'repair' | 'retired'

export interface Device {
  id: number
  uuid: string
  name: string
  type: string
  model: string | null
  brand: string | null
  serial_number: string | null
  location: string
  installation_date: string | null
  notes: string | null
  status: DeviceStatus
  created_at: string
  updated_at: string
}

export type UpdateDeviceInput = {
  name: string
  type: string
  model: string
  brand: string
  serial_number: string
  location: string
  installation_date: string
  notes: string
  status: DeviceStatus
}

export type DeviceEventType =
  | 'installation'
  | 'fault_reported'
  | 'fault_resolved'
  | 'edit'
  | 'note'

export interface DeviceEvent {
  id: number
  device_uuid: string
  type: DeviceEventType
  title: string
  description: string | null
  user: string | null
  created_at: string
}

export type AddEventInput = {
  device_uuid: string
  type: DeviceEventType
  title: string
  description?: string
  user?: string
}
