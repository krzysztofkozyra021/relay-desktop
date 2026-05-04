import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'

const dbPath = join(app.getPath('userData'), 'relay-offline.db')

const db = new Database(dbPath, { verbose: console.log })

db.pragma('journal_mode = WAL')

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export default db
