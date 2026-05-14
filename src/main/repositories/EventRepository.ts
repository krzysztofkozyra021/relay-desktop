import type Database from 'better-sqlite3'
import type { DeviceEvent, AddEventInput } from 'shared/types'

export interface IEventRepository {
  findByDevice(device_uuid: string): DeviceEvent[]
  create(input: AddEventInput): number | bigint
}

export class EventRepository implements IEventRepository {
  constructor(private readonly db: Database.Database) {}

  findByDevice(device_uuid: string): DeviceEvent[] {
    return this.db
      .prepare(
        'SELECT * FROM device_events WHERE device_uuid = ? ORDER BY created_at DESC'
      )
      .all(device_uuid) as DeviceEvent[]
  }

  create(input: AddEventInput): number | bigint {
    return this.db
      .prepare(
        'INSERT INTO device_events (device_uuid, type, title, description, user) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        input.device_uuid,
        input.type,
        input.title,
        input.description ?? null,
        input.user ?? null
      ).lastInsertRowid
  }
}
