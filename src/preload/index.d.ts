import { ElectronAPI } from '@electron-toolkit/preload'

// ---------- Shared data shapes ----------

export interface ActivityInput {
  title: string
  description?: string
  category?: string
  priority?: number
  estimated_pomodoros?: number
  status?: string
}

export interface ActivityRow extends ActivityInput {
  id: number
  created_at: string
}

export interface TodayTaskInput {
  activity_id?: number | null
  date?: string
  estimated_pomodoros?: number
  notes?: string
}

export interface TodayTaskRow extends TodayTaskInput {
  id: number
  actual_pomodoros: number
  sort_order: number
  status: string
  // joined from activity
  title?: string
  category?: string
  priority?: number
  description?: string
}

export interface PomodoroInput {
  task_id: number | null
  start_time: string
  type: string
}

export interface PomodoroRow extends PomodoroInput {
  id: number
  end_time?: string
  result?: string
}

export interface WorkLogInput {
  date: string
  start_time: string
  end_time: string
  task_id: number | null
  pomodoro_count: number
  notes?: string
}

export interface WorkLogRow extends WorkLogInput {
  id: number
}

export interface SettingsMap {
  theme?: string
  work_duration?: string
  short_break?: string
  long_break?: string
  long_break_interval?: string
  bg_type?: string
  bg_value?: string
  music_path?: string
  music_volume?: string
  sfx_volume?: string
  auto_start_break?: string
  auto_start_work?: string
  [key: string]: string | undefined
}

// ---------- API bridge ----------

export interface IApi {
  // Activity
  getActivities(status?: string): Promise<ActivityRow[]>
  createActivity(data: ActivityInput): Promise<ActivityRow>
  updateActivity(id: number, data: Partial<ActivityInput>): Promise<void>
  archiveActivity(id: number): Promise<void>
  deleteActivity(id: number): Promise<void>

  // Today Tasks
  getTodayTasks(date: string): Promise<TodayTaskRow[]>
  createTodayTask(data: TodayTaskInput): Promise<TodayTaskRow>
  updateTodayTask(id: number, data: Partial<TodayTaskRow>): Promise<void>
  reorderTodayTasks(tasks: { id: number; sort_order: number }[]): Promise<void>
  incrementPomodoro(id: number): Promise<void>
  deleteTodayTask(id: number): Promise<void>

  // Pomodoro Sessions
  startSession(data: PomodoroInput): Promise<PomodoroRow>
  finishSession(id: number, result: string): Promise<void>
  getPomodoroStats(from: string, to: string): Promise<unknown[]>
  getPomodoroHeatmap(from: string, to: string): Promise<unknown[]>
  getPomodoroSummary(date: string, weekFrom: string): Promise<{ todayCount: number; weekCount: number; totalCount: number }>

  // Work Logs
  getWorkLogs(from: string, to: string): Promise<WorkLogRow[]>
  getAllWorkLogs(): Promise<WorkLogRow[]>
  createWorkLog(data: WorkLogInput): Promise<WorkLogRow>
  updateWorkLog(id: number, data: Partial<WorkLogInput>): Promise<void>
  deleteWorkLog(id: number): Promise<void>
  getWorkLogStats(from: string, to: string): Promise<unknown[]>
  getWeeklyStats(from: string, to: string): Promise<unknown[]>

  // Settings
  getSettings(): Promise<SettingsMap>
  saveSettings(data: SettingsMap): Promise<void>

  // System
  selectFile(filters?: Electron.FileFilter[]): Promise<string | null>
  showNotification(title: string, body: string): Promise<void>
  flashWindow(): Promise<void>
  unflashWindow(): Promise<void>
  getAutoLaunch(): Promise<boolean>
  setAutoLaunch(enable: boolean): Promise<void>

  // Events
  onTimerComplete(cb: (type: string) => void): () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IApi
  }
}
