import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FetchMock = ReturnType<typeof vi.fn>

async function importFreshClient() {
  vi.resetModules()
  const mod = await import('main/api/client')
  return mod.apiClient
}

describe('RelayApiClient (Unit)', () => {
  let fetchMock: FetchMock

  const mockFetchOk = (body: unknown) => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    })
  }

  const mockFetchError = (body: unknown, status = 400) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    })
  }

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('handles successful login and token storage', async () => {
      mockFetchOk({
        access_token: 'tok-1',
        user: { id: 1, name: 'A', email: 'a@b.c', is_admin: false, is_installer: true, is_service: false },
      })
      const client = await importFreshClient()
      const res = await client.login('a@b.c', 'pw')
      expect(res).toEqual({
        ok: true,
        user: expect.objectContaining({ id: 1, email: 'a@b.c' }),
        token: 'tok-1',
      })
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toContain('/api/login')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({ email: 'a@b.c', password: 'pw' })
    })

    it('signals 2FA when the API requires it', async () => {
      mockFetchError({ requires_2fa: true, intermediate_token: 'mid-1' }, 401)
      const client = await importFreshClient()
      const res = await client.login('a@b.c', 'pw')
      expect(res).toEqual({
        ok: false,
        requires2fa: true,
        intermediateToken: 'mid-1',
      })
    })

    it('handles login failure scenarios (API error, Polish fallback, network error)', async () => {
      const client = await importFreshClient()

      mockFetchError({ message: 'Invalid creds' }, 401)
      expect(await client.login('a@b.c', 'pw')).toEqual({ ok: false, error: 'Invalid creds' })

      mockFetchError({})
      const resFallback = await client.login('a@b.c', 'pw')
      expect(resFallback.ok).toBe(false)
      if (!resFallback.ok && !('requires2fa' in resFallback && resFallback.requires2fa)) {
        expect(resFallback.error).toMatch(/Nieprawidłowe/)
      }

      fetchMock.mockRejectedValueOnce(new Error('boom'))
      expect((await client.login('a@b.c', 'pw')).ok).toBe(false)
    })
  })

  describe('register', () => {
    it('handles successful registration and token storage', async () => {
      mockFetchOk({
        access_token: 'tok-r',
        user: { id: 2, name: 'B', email: 'b@x.c', is_admin: false, is_installer: false, is_service: false },
      })
      const client = await importFreshClient()
      const res = await client.register('B', 'b@x.c', 'pw', 'pw')
      expect(res.ok).toBe(true)
      const [, init] = fetchMock.mock.calls[0]
      expect(JSON.parse(init.body)).toEqual({
        name: 'B',
        email: 'b@x.c',
        password: 'pw',
        password_confirmation: 'pw',
      })
    })

    it('handles registration failure scenarios (validation errors, general failure fallback)', async () => {
      const client = await importFreshClient()

      mockFetchError({ errors: { email: ['Email taken'], password: ['Too short'] } }, 422)
      expect(await client.register('B', 'b@x.c', 'pw', 'pw')).toEqual({ ok: false, error: 'Email taken' })

      mockFetchError({ message: 'Coś poszło źle' })
      expect(await client.register('B', 'b@x.c', 'pw', 'pw')).toEqual({ ok: false, error: 'Coś poszło źle' })
    })
  })

  describe('loginWithGoogle', () => {
    it('passes provider_token in the body and returns user on success', async () => {
      mockFetchOk({
        access_token: 'g-tok',
        user: { id: 9, name: 'G', email: 'g@x.c', is_admin: true, is_installer: false, is_service: false },
      })
      const client = await importFreshClient()
      const res = await client.loginWithGoogle('provider-x')
      expect(res.ok).toBe(true)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toContain('/api/auth/google')
      expect(JSON.parse(init.body)).toEqual({ provider_token: 'provider-x' })
    })
  })

  describe('logout', () => {
    it('handles logout correctly (no-op when unauthed, calls API and clears token when authed)', async () => {
      const client = await importFreshClient()

      await client.logout()
      expect(fetchMock).not.toHaveBeenCalled()

      mockFetchOk({
        access_token: 'tok',
        user: { id: 1, name: '', email: '', is_admin: false, is_installer: false, is_service: false },
      })
      await client.login('a', 'b')

      mockFetchOk({})
      await client.logout()
      expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('/api/logout')

      fetchMock.mockClear()
      await client.logout()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('getDevices', () => {
    it('returns null and bypasses request when unauthenticated or request fails', async () => {
      const client = await importFreshClient()

      expect(await client.getDevices()).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()

      mockFetchOk({
        access_token: 't',
        user: { id: 1, name: '', email: '', is_admin: false, is_installer: false, is_service: false },
      })
      await client.login('a', 'b')

      mockFetchError({}, 500)
      expect(await client.getDevices()).toBeNull()
    })

    it('fetches and unwraps devices in array or data object formats with proper auth header', async () => {
      const client = await importFreshClient()
      mockFetchOk({
        access_token: 'secret',
        user: { id: 1, name: '', email: '', is_admin: false, is_installer: false, is_service: false },
      })
      await client.login('a', 'b')

      const payload = [{ uuid: 'u1', name: 'N', type: 'T', model: null, brand: null, serial_number: null, location: 'L', installation_date: null, notes: null }]
      mockFetchOk(payload)
      expect(await client.getDevices()).toEqual(payload)
      expect(fetchMock.mock.calls.at(-1)?.[1].headers.Authorization).toBe('Bearer secret')

      mockFetchOk({ data: [] })
      expect(await client.getDevices()).toEqual([])
    })
  })

  describe('device mutations', () => {
    it('performs device mutations (create, update, delete) using correct endpoints and methods', async () => {
      const client = await importFreshClient()
      const payload = { uuid: 'u1', name: 'N', type: 'T', model: null, brand: null, serial_number: null, location: 'L', installation_date: null, notes: null }

      mockFetchOk({})
      await client.createDevice(payload)
      expect(fetchMock.mock.calls[0][0]).toContain('/api/devices')
      expect(fetchMock.mock.calls[0][1].method).toBe('POST')
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload)

      mockFetchOk({})
      await client.updateDevice('u1', { name: 'New' })
      expect(fetchMock.mock.calls[1][0]).toContain('/api/devices/u1')
      expect(fetchMock.mock.calls[1][1].method).toBe('PUT')
      expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ name: 'New' })

      mockFetchOk({})
      await client.deleteDevice('u1')
      expect(fetchMock.mock.calls[2][0]).toContain('/api/devices/u1')
      expect(fetchMock.mock.calls[2][1].method).toBe('DELETE')
    })
  })

  describe('assignment', () => {
    it('performs device assignments and unassignments', async () => {
      const client = await importFreshClient()

      mockFetchOk({})
      expect(await client.assignDevice('u1', 42)).toBe(true)
      expect(fetchMock.mock.calls[0][0]).toContain('/api/devices/u1/assign')
      expect(fetchMock.mock.calls[0][1].method).toBe('POST')
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ user_id: 42 })

      mockFetchError({})
      expect(await client.assignDevice('u1', 42)).toBe(false)

      mockFetchOk({})
      expect(await client.unassignDevice('u1', 42)).toBe(true)
      expect(fetchMock.mock.calls[2][0]).toContain('/api/devices/u1/assign/42')
      expect(fetchMock.mock.calls[2][1].method).toBe('DELETE')
    })

    it('retrieves device users on success and failure', async () => {
      const client = await importFreshClient()

      mockFetchError({})
      expect(await client.getDeviceUsers('u1')).toEqual([])

      const users = [{ id: 1, name: '', email: '', is_admin: false, is_installer: false, is_service: false }]
      mockFetchOk(users)
      expect(await client.getDeviceUsers('u1')).toEqual(users)
    })
  })

  describe('faults', () => {
    async function authedClient() {
      mockFetchOk({
        access_token: 't',
        user: { id: 1, name: '', email: '', is_admin: false, is_installer: false, is_service: false },
      })
      const client = await importFreshClient()
      await client.login('a', 'b')
      return client
    }

    it('handles retrieving faults and device-specific faults with proper queries', async () => {
      const unauthClient = await importFreshClient()
      expect(await unauthClient.getFaults()).toEqual([])
      expect(fetchMock).not.toHaveBeenCalled()

      const client = await authedClient()

      mockFetchOk([])
      await client.getFaults('pending')
      expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('/api/faults?status=pending')

      mockFetchOk([])
      await client.getFaults()
      expect(fetchMock.mock.calls.at(-1)?.[0].endsWith('/api/faults')).toBe(true)

      mockFetchOk([])
      await client.getDeviceFaults('u1')
      expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('/api/devices/u1/faults')
    })

    it('handles updating fault status on success and failure', async () => {
      const client = await authedClient()

      const updated = { id: 7, device_uuid: 'u1', title: 't', description: null, reported_by: null, contact: null, status: 'resolved' as const, resolved_at: null, created_at: '', updated_at: '' }
      mockFetchOk(updated)
      expect(await client.updateFaultStatus(7, 'resolved')).toEqual(updated)
      expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('/api/faults/7')
      expect(fetchMock.mock.calls.at(-1)?.[1].method).toBe('PATCH')
      expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body)).toEqual({ status: 'resolved' })

      mockFetchError({})
      expect(await client.updateFaultStatus(7, 'resolved')).toBeNull()
    })
  })
})
