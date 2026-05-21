import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { EventRepository } from 'main/repositories/EventRepository'
import { setupTestDb } from '../../helpers/db'

describe('EventRepository (Feature)', () => {
  let db: Database.Database
  let repo: EventRepository

  beforeEach(() => {
    db = setupTestDb()
    db.prepare('INSERT INTO devices (uuid, name, type, location) VALUES (?, ?, ?, ?)').run(
      'd1',
      'Dev 1',
      'HVAC',
      'Serwerownia A'
    )
    repo = new EventRepository(db)
  })

  it('handles creating events with various fields and respects foreign keys', () => {
    const id = repo.create({
      device_uuid: 'd1',
      type: 'installation',
      title: 'Instalacja',
      description: 'Szczegoly',
      user: 'admin',
    })
    expect(id).toBeTruthy()

    const events = repo.findByDevice('d1')
    const evt = events.find(e => e.title === 'Instalacja')!
    expect(evt).toMatchObject({
      device_uuid: 'd1',
      type: 'installation',
      title: 'Instalacja',
      description: 'Szczegoly',
      user: 'admin',
    })

    repo.create({ device_uuid: 'd1', type: 'note', title: 'Brak detali' })
    const eventsAfter = repo.findByDevice('d1')
    const noteEvt = eventsAfter.find(e => e.title === 'Brak detali')!
    expect(noteEvt.description).toBeNull()
    expect(noteEvt.user).toBeNull()

    expect(() => repo.create({ device_uuid: 'ghost', type: 'note', title: 'Sierota' })).toThrow()
  })

  it('handles retrieving events for a device in descending created_at order', () => {
    expect(repo.findByDevice('d1')).toEqual([])

    db.prepare('INSERT INTO devices (uuid, name, type, location) VALUES (?, ?, ?, ?)').run(
      'd2',
      'Dev 2',
      'UPS',
      'Serwerownia B'
    )

    repo.create({ device_uuid: 'd1', type: 'note', title: 'd1-evt' })
    repo.create({ device_uuid: 'd2', type: 'note', title: 'd2-evt' })
    expect(repo.findByDevice('d1').map(e => e.title)).toEqual(['d1-evt'])
    expect(repo.findByDevice('d2').map(e => e.title)).toEqual(['d2-evt'])

    db.prepare('DELETE FROM device_events').run()
    const stmt = db.prepare(
      'INSERT INTO device_events (device_uuid, type, title, created_at) VALUES (?, ?, ?, ?)'
    )
    stmt.run('d1', 'note', 'old', '2026-01-01 10:00:00')
    stmt.run('d1', 'note', 'mid', '2026-02-01 10:00:00')
    stmt.run('d1', 'note', 'new', '2026-03-01 10:00:00')
    expect(repo.findByDevice('d1').map(e => e.title)).toEqual(['new', 'mid', 'old'])
  })
})
