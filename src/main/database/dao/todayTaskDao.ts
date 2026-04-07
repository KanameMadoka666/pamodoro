import { getDb } from '../db'
import dayjs from 'dayjs'

export interface TodayTask {
  id?: number
  activity_id?: number | null
  date?: string
  sort_order?: number
  estimated_pomodoros?: number
  actual_pomodoros?: number
  status?: string
  notes?: string
  // joined from activity
  title?: string
  category?: string
  priority?: number
  description?: string
}

export const todayTaskDao = {
  getByDate(date: string): TodayTask[] {
    const db = getDb()
    return db
      .prepare(
        `SELECT t.*, a.title, a.category, a.priority, a.description
         FROM today_task t
         LEFT JOIN activity a ON t.activity_id = a.id
         WHERE t.date = ?
         ORDER BY t.sort_order ASC`
      )
      .all(date) as TodayTask[]
  },

  getById(id: number): TodayTask | undefined {
    const db = getDb()
    return db
      .prepare(
        `SELECT t.*, a.title, a.category, a.priority, a.description
         FROM today_task t
         LEFT JOIN activity a ON t.activity_id = a.id
         WHERE t.id = ?`
      )
      .get(id) as TodayTask | undefined
  },

  create(data: Omit<TodayTask, 'id'>): TodayTask {
    const db = getDb()
    const date = data.date ?? dayjs().format('YYYY-MM-DD')
    const maxOrder = (
      db
        .prepare('SELECT MAX(sort_order) as m FROM today_task WHERE date = ?')
        .get(date) as { m: number | null }
    ).m ?? -1
    const result = db
      .prepare(
        `INSERT INTO today_task (activity_id, date, sort_order, estimated_pomodoros, actual_pomodoros, status, notes)
         VALUES (@activity_id, @date, @sort_order, @estimated_pomodoros, @actual_pomodoros, @status, @notes)`
      )
      .run({
        activity_id: data.activity_id ?? null,
        date,
        sort_order: maxOrder + 1,
        estimated_pomodoros: data.estimated_pomodoros ?? 1,
        actual_pomodoros: 0,
        status: 'pending',
        notes: data.notes ?? ''
      })
    return { ...data, id: result.lastInsertRowid as number, date }
  },

  update(id: number, data: Partial<TodayTask>): void {
    const db = getDb()
    const allowed = ['sort_order', 'estimated_pomodoros', 'actual_pomodoros', 'status', 'notes']
    const fields = Object.keys(data)
      .filter((k) => allowed.includes(k))
      .map((k) => `${k} = @${k}`)
      .join(', ')
    if (!fields) return
    db.prepare(`UPDATE today_task SET ${fields} WHERE id = @id`).run({ ...data, id })
  },

  incrementPomodoro(id: number): void {
    const db = getDb()
    db.prepare('UPDATE today_task SET actual_pomodoros = actual_pomodoros + 1 WHERE id = ?').run(id)
  },

  reorder(tasks: { id: number; sort_order: number }[]): void {
    const db = getDb()
    const stmt = db.prepare('UPDATE today_task SET sort_order = @sort_order WHERE id = @id')
    const reorderAll = db.transaction(() => {
      for (const t of tasks) stmt.run(t)
    })
    reorderAll()
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM today_task WHERE id = ?').run(id)
  }
}
