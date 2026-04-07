import { ipcMain } from 'electron'
import { pomodoroDao } from '../database/dao/pomodoroDao'
import { workLogDao } from '../database/dao/workLogDao'

export function registerPomodoroIpc(): void {
  ipcMain.handle('pomodoro:start', (_e, data) => pomodoroDao.create(data))
  ipcMain.handle('pomodoro:finish', (_e, id: number, result: string) =>
    pomodoroDao.finish(id, result as 'completed' | 'interrupted')
  )
  ipcMain.handle('pomodoro:stats', (_e, from: string, to: string) =>
    pomodoroDao.getStatsByDateRange(from, to)
  )
  ipcMain.handle('pomodoro:heatmap', (_e, from: string, to: string) =>
    pomodoroDao.getHeatmap(from, to)
  )
  ipcMain.handle('pomodoro:summary', (_e, date: string, weekFrom: string) =>
    pomodoroDao.getSummary(date, weekFrom)
  )

  // Work log handlers
  ipcMain.handle('workLog:getByRange', (_e, from: string, to: string) =>
    workLogDao.getByDateRange(from, to)
  )
  ipcMain.handle('workLog:getAll', () => workLogDao.getAll())
  ipcMain.handle('workLog:create', (_e, data) => workLogDao.create(data))
  ipcMain.handle('workLog:update', (_e, id: number, data) => workLogDao.update(id, data))
  ipcMain.handle('workLog:delete', (_e, id: number) => workLogDao.delete(id))
  ipcMain.handle('workLog:stats', (_e, from: string, to: string) =>
    workLogDao.getStatsByCategory(from, to)
  )
  ipcMain.handle('workLog:weekly', (_e, from: string, to: string) =>
    workLogDao.getWeeklyStats(from, to)
  )
}
