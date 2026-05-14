import { app, ipcMain, dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import db from './database'
import { DeviceRepository } from './repositories/DeviceRepository'
import { EventRepository } from './repositories/EventRepository'
import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { loadReactDevtools } from 'lib/electron-app/utils'
import { ENVIRONMENT } from 'shared/constants'
import type { UpdateDeviceInput, AddEventInput } from 'shared/types'
import { MainWindow } from './windows/main'
import { waitFor } from 'shared/utils'

const deviceRepo = new DeviceRepository(db)
const eventRepo = new EventRepository(db)

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  const window = await makeAppSetup(MainWindow)

  ipcMain.handle('db:get-devices', () => deviceRepo.findAll())

  ipcMain.handle('db:get-device', (_, uuid: string) =>
    deviceRepo.findByUuid(uuid)
  )

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
    ) => {
      const rowId = deviceRepo.create({
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
      eventRepo.create({
        device_uuid: uuid,
        type: 'installation',
        title: 'Instalacja urządzenia',
        description: `Urządzenie zarejestrowane w lokalizacji: ${location}.`,
        user: 'System',
      })
      return rowId
    }
  )

  ipcMain.handle(
    'db:update-device',
    (_, uuid: string, data: UpdateDeviceInput) => deviceRepo.update(uuid, data)
  )

  ipcMain.handle('db:delete-device', (_, uuid: string) =>
    deviceRepo.delete(uuid)
  )

  ipcMain.handle('db:get-events', (_, device_uuid: string) =>
    eventRepo.findByDevice(device_uuid)
  )

  ipcMain.handle('db:add-event', (_, data: AddEventInput) =>
    eventRepo.create(data)
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
