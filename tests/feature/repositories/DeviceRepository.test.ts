import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  DeviceRepository,
  type CreateDeviceInput,
} from 'main/repositories/DeviceRepository'
import type { UpdateDeviceInput } from 'shared/types'
import { setupTestDb } from '../../helpers/db'

function makeInput(overrides: Partial<CreateDeviceInput> = {}): CreateDeviceInput {
  return {
    uuid: 'uuid-1',
    name: 'Klimatyzator',
    type: 'HVAC',
    model: 'FTXM35R',
    brand: 'Daikin',
    serial_number: 'SN-001',
    location: 'Serwerownia A',
    installation_date: '2026-01-15',
    notes: 'Notatka',
    ...overrides,
  }
}

function makeUpdate(overrides: Partial<UpdateDeviceInput> = {}): UpdateDeviceInput {
  return {
    name: 'Updated',
    type: 'UPS',
    model: 'M2',
    brand: 'APC',
    serial_number: 'SN-XYZ',
    location: 'Serwerownia B',
    installation_date: '2026-02-01',
    notes: 'Po edycji',
    status: 'repair',
    ...overrides,
  }
}

describe('DeviceRepository (Feature)', () => {
  let db: Database.Database
  let repo: DeviceRepository

  beforeEach(() => {
    db = setupTestDb()
    repo = new DeviceRepository(db)
  })

  it('handles creating devices and unique constraints', () => {
    const rowId = repo.create(makeInput())
    expect(rowId).toBeTruthy()
    const found = repo.findByUuid('uuid-1')
    expect(found?.name).toBe('Klimatyzator')
    expect(found?.status).toBe('active')

    expect(() => repo.create(makeInput())).toThrow()
  })

  it('handles finding all devices in descending created_at order', () => {
    expect(repo.findAll()).toEqual([])

    repo.create(makeInput({ uuid: 'a', name: 'First' }))
    repo.create(makeInput({ uuid: 'b', name: 'Second' }))
    const all = repo.findAll()
    expect(all).toHaveLength(2)
    expect(all.map(d => d.uuid)).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('handles finding devices by UUID', () => {
    expect(repo.findByUuid('missing')).toBeUndefined()

    repo.create(makeInput({ uuid: 'find-me' }))
    const dev = repo.findByUuid('find-me')
    expect(dev?.uuid).toBe('find-me')
    expect(dev?.location).toBe('Serwerownia A')
  })

  it('handles upserting devices correctly without row duplication', () => {
    repo.upsert(makeInput({ uuid: 'fresh' }))
    expect(repo.findByUuid('fresh')?.name).toBe('Klimatyzator')

    repo.upsert(makeInput({ uuid: 'fresh', name: 'Po zmianie', location: 'Nowe' }))
    const dev = repo.findByUuid('fresh')
    expect(dev?.name).toBe('Po zmianie')
    expect(dev?.location).toBe('Nowe')
    expect(repo.findAll()).toHaveLength(1)
  })

  it('handles updating device properties', () => {
    repo.create(makeInput({ uuid: 'edit-me' }))

    repo.update('edit-me', makeUpdate())
    const dev = repo.findByUuid('edit-me')
    expect(dev?.name).toBe('Updated')
    expect(dev?.type).toBe('UPS')
    expect(dev?.status).toBe('repair')

    repo.update('nope', makeUpdate())
    expect(repo.findAll()).toHaveLength(1)
  })

  it('handles deleting devices and cascades associated events', () => {
    repo.create(makeInput({ uuid: 'cascaded-dev' }))
    repo.create(makeInput({ uuid: 'stay-dev' }))
    db.prepare('INSERT INTO device_events (device_uuid, type, title) VALUES (?, ?, ?)').run(
      'cascaded-dev',
      'note',
      'Event'
    )

    repo.delete('missing')
    expect(repo.findByUuid('stay-dev')).toBeDefined()

    repo.delete('cascaded-dev')
    expect(repo.findByUuid('cascaded-dev')).toBeUndefined()

    const count = (
      db.prepare("SELECT COUNT(*) as count FROM device_events WHERE device_uuid = 'cascaded-dev'").get() as { count: number }
    ).count
    expect(count).toBe(0)
  })

  it('handles bulk deleting all devices except specified', () => {
    repo.create(makeInput({ uuid: 'a' }))
    repo.create(makeInput({ uuid: 'b' }))
    repo.create(makeInput({ uuid: 'c' }))

    repo.deleteAllExcept(['a', 'c'])
    expect(repo.findAll().map(d => d.uuid).sort()).toEqual(['a', 'c'])

    repo.deleteAllExcept(['a', 'c'])
    expect(repo.findAll()).toHaveLength(2)

    repo.deleteAllExcept([])
    expect(repo.findAll()).toHaveLength(0)
  })
})
