import { app, ipcMain, dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import db from './database'
import { DeviceRepository } from './repositories/DeviceRepository'
import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { loadReactDevtools } from 'lib/electron-app/utils'
import { ENVIRONMENT } from 'shared/constants'
import { MainWindow } from './windows/main'
import { waitFor } from 'shared/utils'

const deviceRepo = new DeviceRepository(db)

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  const window = await makeAppSetup(MainWindow)

  ipcMain.handle('db:get-devices', () => deviceRepo.findAll())

  ipcMain.handle(
    'db:add-device',
    (
      _,
      uuid: string,
      name: string,
      type: string,
      model: string,
      brand: string,
      serial_number: string,
      location: string,
      installation_date: string,
      notes: string
    ) =>
      deviceRepo.create({
        uuid,
        name,
        type,
        model,
        brand,
        serial_number,
        location,
        installation_date,
        notes,
      })
  )

  ipcMain.handle(
    'qr:save-png',
    async (_, dataUrl: string, defaultName: string) => {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: 'PNG', extensions: ['png'] }],
      })
      if (canceled || !filePath) return null
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
      await writeFile(filePath, Buffer.from(base64, 'base64'))
      return filePath
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
  db.close()
})
