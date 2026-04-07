import { ipcMain, dialog, Notification, app } from 'electron'
import { settingsDao } from '../database/dao/settingsDao'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:getAll', () => settingsDao.getAll())
  ipcMain.handle('settings:save', (_e, data: Record<string, string>) => {
    settingsDao.setMany(data)
  })

  ipcMain.handle('system:selectFile', async (_e, filters) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters ?? [{ name: 'All Files', extensions: ['*'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('system:notify', (_e, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  ipcMain.handle('system:getAutoLaunch', () => {
    return app.getLoginItemSettings().openAtLogin
  })

  ipcMain.handle('system:setAutoLaunch', (_e, enable: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enable })
  })
}
