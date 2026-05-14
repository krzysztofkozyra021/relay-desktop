import type Database from 'better-sqlite3'
import type { Device } from 'shared/types'

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
  create(input: CreateDeviceInput): number | bigint
}

export class DeviceRepository implements IDeviceRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Device[] {
    return this.db
      .prepare('SELECT * FROM devices ORDER BY created_at DESC')
      .all() as Device[]
  }

  create(input: CreateDeviceInput): number | bigint {
    const stmt = this.db.prepare(
      'INSERT INTO devices (uuid, name, type, model, brand, serial_number, location, installation_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const { lastInsertRowid } = stmt.run(
      input.uuid,
      input.name,
      input.type,
      input.model,
      input.brand,
      input.serial_number,
      input.location,
      input.installation_date,
      input.notes
    )
    return lastInsertRowid
  }
}
