import { describe, expect, it } from 'vitest'
import { canManageFaults } from 'shared/utils'
import type { ApiUser } from 'shared/types'

const baseUser: ApiUser = {
  id: 1,
  name: 'Test',
  email: 'test@example.com',
  is_admin: false,
  is_installer: false,
  is_service: false,
}

describe('canManageFaults', () => {
  it('returns true for admin', () => {
    expect(canManageFaults({ ...baseUser, is_admin: true })).toBe(true)
  })

  it('returns true for service technician', () => {
    expect(canManageFaults({ ...baseUser, is_service: true })).toBe(true)
  })

  it('returns false for installer only', () => {
    expect(canManageFaults({ ...baseUser, is_installer: true })).toBe(false)
  })

  it('returns false for plain user (no role flags)', () => {
    expect(canManageFaults(baseUser)).toBe(false)
  })
})
