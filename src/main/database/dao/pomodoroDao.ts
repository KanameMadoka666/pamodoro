import { getDb } from '../db'
import dayjs from 'dayjs'

export interface PomodoroSession {
  id?: number
  task_id?: number | null
  start_time: string
  end_time?: string
  type: 'work' | 'short_break' | 'long_break'
  result?: 'completed' | 'interrupted'
}

export const pomodoroDao = {
  create(data: Omit<PomodoroSession, 'id'>): PomodoroSession {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO pomodoro_session (task_id, start_time, end_time, type, result)
         VALUES (@task_id, @start_time, @end_time, @type, @result)`
      )
      .run({
        task_id: data.task_id ?? null,
        start_time: data.start_time,
        end_time: data.end_time ?? null,
        type: data.type,
        result: data.result ?? 'completed'
      })
    return { ...data, id: result.lastInsertRowid as number }
  },

  finish(id: number, result: 'completed' | 'interrupted'): void {
    const db = getDb()
    db.prepare('UPDATE pomodoro_session SET end_time = ?, result = ? WHERE id = ?').run(
      dayjs().toISOString(),
      result,
      id
    )
  },

  getByDate(date: string): PomodoroSession[] {
    const db = getDb()
    return db
      .prepare("SELECT * FROM pomodoro_session WHERE date(start_time) = ? AND type = 'work'")
      .all(date) as PomodoroSession[]
  },

  getStatsByDateRange(from: string, to: string) {
    const db = getDb()
    return db
      .prepare(
        `SELECT date(start_time) as date, COUNT(*) as count
         FROM pomodoro_session
         WHERE type = 'work' AND result = 'completed'
           AND date(start_time) BETWEEN ? AND ?
         GROUP BY date(start_time)
         ORDER BY date ASC`
      )
      .all(from, to)
  },

  getHeatmap(from: string, to: string) {
    const db = getDb()
    return db
      .prepare(
        `SELECT date(start_time) as date, COUNT(*) as count
         FROM pomodoro_session
         WHERE type = 'work' AND result = 'completed'
           AND date(start_time) BETWEEN ? AND ?
         GROUP BY date(start_time)`
      )
      .all(from, to)
  },

  getSummary(date: string, weekFrom: string) {
    const db = getDb()
    const todayCount = (db
      .prepare(`SELECT COUNT(*) as c FROM pomodoro_session WHERE type='work' AND result='completed' AND date(start_time)=?`)
      .get(date) as { c: number }).c
    const weekCount = (db
      .prepare(`SELECT COUNT(*) as c FROM pomodoro_session WHERE type='work' AND result='completed' AND date(start_time) BETWEEN ? AND ?`)
      .get(weekFrom, date) as { c: number }).c
    const totalCount = (db
      .prepare(`SELECT COUNT(*) as c FROM pomodoro_session WHERE type='work' AND result='completed'`)
      .get() as { c: number }).c
    return { todayCount, weekCount, totalCount }
  }
}
