import Database from 'better-sqlite3'

export function setupTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE devices (
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

  db.exec(`
    CREATE TABLE device_events (
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

  return db
}
