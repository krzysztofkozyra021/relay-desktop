import type {
  ApiLoginResult,
  ApiUser,
  FaultReport,
  FaultStatus,
} from 'shared/types'

const BASE = process.env.RELAY_API_URL ?? 'http://localhost:50851'

export type DeviceApiPayload = {
  uuid: string
  name: string
  type: string
  model: string | null
  brand: string | null
  serial_number: string | null
  location: string
  installation_date: string | null
  notes: string | null
}

type RawBody = {
  access_token?: string
  user?: ApiUser
  requires_2fa?: boolean
  intermediate_token?: string
  message?: string
  errors?: Record<string, string[]>
}

class RelayApiClient {
  private token: string | null = null

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (this.token) h.Authorization = `Bearer ${this.token}`
    return h
  }

  private async req<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ ok: boolean; data: T }> {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: this.headers(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      const data = (await res.json().catch(() => ({}) as T)) as T
      return { ok: res.ok, data }
    } catch (err) {
      console.error(`API [${method} ${path}] failed:`, err)
      return { ok: false, data: {} as T }
    }
  }

  async login(email: string, password: string): Promise<ApiLoginResult> {
    const { ok, data } = await this.req<RawBody>('POST', '/api/login', {
      email,
      password,
    })
    if (ok && data.access_token && data.user) {
      this.token = data.access_token
      return { ok: true, user: data.user, token: data.access_token }
    }
    if (data.requires_2fa && data.intermediate_token) {
      return {
        ok: false,
        requires2fa: true,
        intermediateToken: data.intermediate_token,
      }
    }
    return { ok: false, error: data.message ?? 'Nieprawidłowe dane logowania.' }
  }

  async register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<ApiLoginResult> {
    const { ok, data } = await this.req<RawBody>('POST', '/api/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    if (ok && data.access_token && data.user) {
      this.token = data.access_token
      return { ok: true, user: data.user, token: data.access_token }
    }
    const firstError = data.errors
      ? Object.values(data.errors)[0]?.[0]
      : undefined
    return {
      ok: false,
      error: firstError ?? data.message ?? 'Rejestracja nie powiodła się.',
    }
  }

  async logout(): Promise<void> {
    if (!this.token) return
    await this.req('POST', '/api/logout').catch(() => {})
    this.token = null
  }

  async getDevices(): Promise<DeviceApiPayload[] | null> {
    if (!this.token) return null
    const { ok, data } = await this.req<
      DeviceApiPayload[] | { data: DeviceApiPayload[] }
    >('GET', '/api/devices')
    if (!ok) return null
    return Array.isArray(data) ? data : (data.data ?? [])
  }

  async createDevice(device: DeviceApiPayload): Promise<void> {
    await this.req('POST', '/api/devices', device)
  }

  async updateDevice(
    uuid: string,
    data: Partial<DeviceApiPayload>
  ): Promise<void> {
    await this.req('PUT', `/api/devices/${uuid}`, data)
  }

  async deleteDevice(uuid: string): Promise<void> {
    await this.req('DELETE', `/api/devices/${uuid}`)
  }

  async assignDevice(deviceUuid: string, userId: number): Promise<boolean> {
    const { ok } = await this.req('POST', `/api/devices/${deviceUuid}/assign`, {
      user_id: userId,
    })
    return ok
  }

  async unassignDevice(deviceUuid: string, userId: number): Promise<boolean> {
    const { ok } = await this.req(
      'DELETE',
      `/api/devices/${deviceUuid}/assign/${userId}`
    )
    return ok
  }

  async getDeviceUsers(deviceUuid: string): Promise<ApiUser[]> {
    const { ok, data } = await this.req<ApiUser[]>(
      'GET',
      `/api/devices/${deviceUuid}/users`
    )
    if (!ok) return []
    return Array.isArray(data) ? data : []
  }

  async getFaults(status?: FaultStatus): Promise<FaultReport[]> {
    if (!this.token) return []
    const path = status ? `/api/faults?status=${status}` : '/api/faults'
    const { ok, data } = await this.req<FaultReport[]>('GET', path)
    if (!ok) return []
    return Array.isArray(data) ? data : []
  }

  async getDeviceFaults(uuid: string): Promise<FaultReport[]> {
    if (!this.token) return []
    const { ok, data } = await this.req<FaultReport[]>(
      'GET',
      `/api/devices/${uuid}/faults`
    )
    if (!ok) return []
    return Array.isArray(data) ? data : []
  }

  async updateFaultStatus(
    id: number,
    status: FaultStatus
  ): Promise<FaultReport | null> {
    const { ok, data } = await this.req<FaultReport>(
      'PATCH',
      `/api/faults/${id}`,
      { status }
    )
    if (!ok) return null
    return data
  }
}

export const apiClient = new RelayApiClient()
