import { ipcMain } from 'electron'
import { todayTaskDao } from '../database/dao/todayTaskDao'

export function registerTodayTaskIpc(): void {
  ipcMain.handle('todayTask:getByDate', (_e, date: string) => todayTaskDao.getByDate(date))
  ipcMain.handle('todayTask:create', (_e, data) => todayTaskDao.create(data))
  ipcMain.handle('todayTask:update', (_e, id: number, data) => todayTaskDao.update(id, data))
  ipcMain.handle('todayTask:reorder', (_e, tasks) => todayTaskDao.reorder(tasks))
  ipcMain.handle('todayTask:incrementPomodoro', (_e, id: number) =>
    todayTaskDao.incrementPomodoro(id)
  )
  ipcMain.handle('todayTask:delete', (_e, id: number) => todayTaskDao.delete(id))
}
