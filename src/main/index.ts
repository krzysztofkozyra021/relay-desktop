import { app, ipcMain } from 'electron'
import db from './database'
import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { loadReactDevtools } from 'lib/electron-app/utils'
import { ENVIRONMENT } from 'shared/constants'
import { MainWindow } from './windows/main'
import { waitFor } from 'shared/utils'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  const window = await makeAppSetup(MainWindow)

  ipcMain.handle('db:get-devices', () => {
    const stmt = db.prepare('SELECT * FROM devices ORDER BY created_at DESC')
    return stmt.all()
  })
  ipcMain.handle(
    'db:add-device',
    (
      _,
      deviceId: string,
      name: string,
      type: string,
      model: string,
      brand: string,
      serial_number: string,
      location: string,
      installation_date: string,
      notes: string
    ) => {
      const stmt = db.prepare(
        'INSERT INTO devices (uuid, name, type, model, brand, serial_number, location, installation_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      const info = stmt.run(
        deviceId,
        name,
        type,
        model,
        brand,
        serial_number,
        location,
        installation_date,
        notes
      )
      return info.lastInsertRowid
    }
  )

  if (ENVIRONMENT.IS_DEV) {
    await loadReactDevtools()
    window.webContents.once('devtools-opened', async () => {
      await waitFor(1000)
      window.webContents.reload()
    })
  }
})

app.on('will-quit', () => {
  if (db) {
    db.close()
  }
})
