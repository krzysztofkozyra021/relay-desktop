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

export interface ApiUser {
  id: number
  name: string
  email: string
  is_admin: boolean
  is_installer: boolean
  is_service: boolean
}

export type FaultStatus = 'pending' | 'in_progress' | 'resolved'

export interface FaultReport {
  id: number
  device_uuid: string
  title: string
  description: string | null
  reported_by: string | null
  contact: string | null
  status: FaultStatus
  resolved_at: string | null
  created_at: string
  updated_at: string
  device?: {
    uuid: string
    name: string
    type: string
    model: string | null
    brand: string | null
    location: string
  }
}

export type CreateFaultInput = {
  title: string
  description?: string
  reported_by?: string
  contact?: string
}

export type ApiLoginResult =
  | { ok: true; user: ApiUser; token: string }
  | { ok: false; requires2fa: true; intermediateToken: string }
  | { ok: false; requires2fa?: false; error: string }
