import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ActivityInput,
  TodayTaskInput,
  TodayTaskRow,
  PomodoroInput,
  WorkLogInput,
  SettingsMap
} from './index.d'

// Strongly-typed bridge between renderer and main process
const api = {
  // ---------- Activity ----------
  getActivities: (status?: string) => ipcRenderer.invoke('activity:getAll', status),
  createActivity: (data: ActivityInput) => ipcRenderer.invoke('activity:create', data),
  updateActivity: (id: number, data: Partial<ActivityInput>) => ipcRenderer.invoke('activity:update', id, data),
  archiveActivity: (id: number) => ipcRenderer.invoke('activity:archive', id),
  deleteActivity: (id: number) => ipcRenderer.invoke('activity:delete', id),

  // ---------- Today Tasks ----------
  getTodayTasks: (date: string) => ipcRenderer.invoke('todayTask:getByDate', date),
  createTodayTask: (data: TodayTaskInput) => ipcRenderer.invoke('todayTask:create', data),
  updateTodayTask: (id: number, data: Partial<TodayTaskRow>) => ipcRenderer.invoke('todayTask:update', id, data),
  reorderTodayTasks: (tasks: { id: number; sort_order: number }[]) => ipcRenderer.invoke('todayTask:reorder', tasks),
  incrementPomodoro: (id: number) => ipcRenderer.invoke('todayTask:incrementPomodoro', id),
  deleteTodayTask: (id: number) => ipcRenderer.invoke('todayTask:delete', id),

  // ---------- Pomodoro Sessions ----------
  startSession: (data: PomodoroInput) => ipcRenderer.invoke('pomodoro:start', data),
  finishSession: (id: number, result: string) => ipcRenderer.invoke('pomodoro:finish', id, result),
  getPomodoroStats: (from: string, to: string) => ipcRenderer.invoke('pomodoro:stats', from, to),
  getPomodoroHeatmap: (from: string, to: string) => ipcRenderer.invoke('pomodoro:heatmap', from, to),
  getPomodoroSummary: (date: string, weekFrom: string) => ipcRenderer.invoke('pomodoro:summary', date, weekFrom),

  // ---------- Work Logs ----------
  getWorkLogs: (from: string, to: string) => ipcRenderer.invoke('workLog:getByRange', from, to),
  getAllWorkLogs: () => ipcRenderer.invoke('workLog:getAll'),
  createWorkLog: (data: WorkLogInput) => ipcRenderer.invoke('workLog:create', data),
  updateWorkLog: (id: number, data: Partial<WorkLogInput>) => ipcRenderer.invoke('workLog:update', id, data),
  deleteWorkLog: (id: number) => ipcRenderer.invoke('workLog:delete', id),
  getWorkLogStats: (from: string, to: string) => ipcRenderer.invoke('workLog:stats', from, to),
  getWeeklyStats: (from: string, to: string) => ipcRenderer.invoke('workLog:weekly', from, to),

  // ---------- Settings ----------
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  saveSettings: (data: SettingsMap) => ipcRenderer.invoke('settings:save', data),

  // ---------- System ----------
  selectFile: (filters?: Electron.FileFilter[]) => ipcRenderer.invoke('system:selectFile', filters),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('system:notify', title, body),
  flashWindow: () => ipcRenderer.invoke('window:flash'),
  unflashWindow: () => ipcRenderer.invoke('window:unflash'),
  getAutoLaunch: () => ipcRenderer.invoke('system:getAutoLaunch'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('system:setAutoLaunch', enable),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

  // ---------- Events from main ----------
  onTimerComplete: (cb: (type: string) => void) => {
    ipcRenderer.on('timer:complete', (_e, type) => cb(type))
    return () => ipcRenderer.removeAllListeners('timer:complete')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
