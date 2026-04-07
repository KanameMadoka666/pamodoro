import { ipcMain } from 'electron'
import { activityDao } from '../database/dao/activityDao'

export function registerActivityIpc(): void {
  ipcMain.handle('activity:getAll', (_e, status?: string) => activityDao.getAll(status))
  ipcMain.handle('activity:create', (_e, data) => activityDao.create(data))
  ipcMain.handle('activity:update', (_e, id: number, data) => activityDao.update(id, data))
  ipcMain.handle('activity:archive', (_e, id: number) => activityDao.archive(id))
  ipcMain.handle('activity:delete', (_e, id: number) => activityDao.delete(id))
}
