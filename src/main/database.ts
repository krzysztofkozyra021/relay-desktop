import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'

const dbPath = join(app.getPath('userData'), 'relay-offline.db')
const db = new Database(dbPath, { verbose: console.log })

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    model TEXT,
    brand TEXT,
    serial_number TEXT,
    location TEXT NOT NULL,
    installation_date DATETIME,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

const deviceCols = (
  db.prepare('PRAGMA table_info(devices)').all() as Array<{ name: string }>
).map(c => c.name)
if (!deviceCols.includes('status')) {
  db.exec(
    "ALTER TABLE devices ADD COLUMN status TEXT NOT NULL DEFAULT 'active'"
  )
}

db.exec(`
  CREATE TABLE IF NOT EXISTS device_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_uuid TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    user TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_uuid) REFERENCES devices(uuid) ON DELETE CASCADE
  )
`)

export default db
