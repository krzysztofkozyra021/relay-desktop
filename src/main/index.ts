import { app, ipcMain, dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import db from './database'
import { DeviceRepository } from './repositories/DeviceRepository'
import { EventRepository } from './repositories/EventRepository'
import { apiClient } from './api/client'
import { startGoogleOAuth } from './google-oauth'
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

  ipcMain.handle('api:login', (_, email: string, password: string) =>
    apiClient.login(email, password)
  )

  ipcMain.handle(
    'api:register',
    (
      _,
      name: string,
      email: string,
      password: string,
      passwordConfirmation: string
    ) => apiClient.register(name, email, password, passwordConfirmation)
  )

  ipcMain.handle('api:logout', () => apiClient.logout())

  ipcMain.handle('api:login-google', async () => {
    const providerToken = await startGoogleOAuth()
    return apiClient.loginWithGoogle(providerToken)
  })

  ipcMain.handle('api:sync-devices', async () => {
    const apiDevices = await apiClient.getDevices()
    if (apiDevices === null) {
      throw new Error(
        'Nie udało się pobrać urządzeń z API. Sprawdź połączenie i uprawnienia konta.'
      )
    }
    for (const d of apiDevices) {
      deviceRepo.upsert({
        uuid: d.uuid,
        name: d.name,
        type: d.type,
        model: d.model ?? '',
        brand: d.brand ?? '',
        serial_number: d.serial_number ?? '',
        location: d.location,
        installation_date: d.installation_date ?? '',
        notes: d.notes ?? '',
      })
    }
    deviceRepo.deleteAllExcept(apiDevices.map(d => d.uuid))
    return deviceRepo.findAll()
  })

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
      apiClient
        .createDevice({
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
        .catch(e => console.warn('API createDevice failed:', e))
      return rowId
    }
  )

  ipcMain.handle(
    'db:update-device',
    (_, uuid: string, data: UpdateDeviceInput) => {
      deviceRepo.update(uuid, data)
      apiClient
        .updateDevice(uuid, {
          name: data.name,
          type: data.type,
          model: data.model,
          brand: data.brand,
          serial_number: data.serial_number,
          location: data.location,
          installation_date: data.installation_date,
          notes: data.notes,
        })
        .catch(e => console.warn('API updateDevice failed:', e))
    }
  )

  ipcMain.handle('db:delete-device', (_, uuid: string) => {
    deviceRepo.delete(uuid)
    apiClient
      .deleteDevice(uuid)
      .catch(e => console.warn('API deleteDevice failed:', e))
  })

  ipcMain.handle('db:get-events', (_, device_uuid: string) =>
    eventRepo.findByDevice(device_uuid)
  )

  ipcMain.handle('db:add-event', (_, data: AddEventInput) =>
    eventRepo.create(data)
  )

  ipcMain.handle('api:get-faults', (_, status?: string) =>
    apiClient.getFaults(
      status as import('shared/types').FaultStatus | undefined
    )
  )

  ipcMain.handle('api:get-device-faults', (_, uuid: string) =>
    apiClient.getDeviceFaults(uuid)
  )

  ipcMain.handle('api:update-fault-status', (_, id: number, status: string) =>
    apiClient.updateFaultStatus(
      id,
      status as import('shared/types').FaultStatus
    )
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
