import type Database from 'better-sqlite3'
import type { Device, UpdateDeviceInput } from 'shared/types'

export type CreateDeviceInput = {
  uuid: string
  name: string
  type: string
  model: string
  brand: string
  serial_number: string
  location: string
  installation_date: string
  notes: string
}

export interface IDeviceRepository {
  findAll(): Device[]
  findByUuid(uuid: string): Device | undefined
  create(input: CreateDeviceInput): number | bigint
  update(uuid: string, input: UpdateDeviceInput): void
  delete(uuid: string): void
}

export class DeviceRepository implements IDeviceRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Device[] {
    return this.db
      .prepare('SELECT * FROM devices ORDER BY created_at DESC')
      .all() as Device[]
  }

  findByUuid(uuid: string): Device | undefined {
    return this.db.prepare('SELECT * FROM devices WHERE uuid = ?').get(uuid) as
      | Device
      | undefined
  }

  create(input: CreateDeviceInput): number | bigint {
    const stmt = this.db.prepare(
      'INSERT INTO devices (uuid, name, type, model, brand, serial_number, location, installation_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    return stmt.run(
      input.uuid,
      input.name,
      input.type,
      input.model,
      input.brand,
      input.serial_number,
      input.location,
      input.installation_date,
      input.notes
    ).lastInsertRowid
  }

  update(uuid: string, input: UpdateDeviceInput): void {
    this.db
      .prepare(
        `UPDATE devices SET
          name = ?, type = ?, model = ?, brand = ?, serial_number = ?,
          location = ?, installation_date = ?, notes = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`
      )
      .run(
        input.name,
        input.type,
        input.model,
        input.brand,
        input.serial_number,
        input.location,
        input.installation_date,
        input.notes,
        input.status,
        uuid
      )
  }

  delete(uuid: string): void {
    this.db.prepare('DELETE FROM devices WHERE uuid = ?').run(uuid)
  }
}
