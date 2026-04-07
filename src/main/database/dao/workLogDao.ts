import { getDb } from '../db'

export interface WorkLog {
  id?: number
  date: string
  start_time: string
  end_time?: string
  task_id?: number | null
  task_type?: string
  task_description?: string
  pomodoro_count?: number
  notes?: string
}

export const workLogDao = {
  create(data: Omit<WorkLog, 'id'>): WorkLog {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO work_log (date, start_time, end_time, task_id, task_type, task_description, pomodoro_count, notes)
         VALUES (@date, @start_time, @end_time, @task_id, @task_type, @task_description, @pomodoro_count, @notes)`
      )
      .run({
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time ?? null,
        task_id: data.task_id ?? null,
        task_type: data.task_type ?? '',
        task_description: data.task_description ?? '',
        pomodoro_count: data.pomodoro_count ?? 1,
        notes: data.notes ?? ''
      })
    return { ...data, id: result.lastInsertRowid as number }
  },

  update(id: number, data: Partial<WorkLog>): void {
    const db = getDb()
    const allowed = ['end_time', 'task_type', 'task_description', 'pomodoro_count', 'notes']
    const fields = Object.keys(data)
      .filter((k) => allowed.includes(k))
      .map((k) => `${k} = @${k}`)
      .join(', ')
    if (!fields) return
    db.prepare(`UPDATE work_log SET ${fields} WHERE id = @id`).run({ ...data, id })
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM work_log WHERE id = ?').run(id)
  },

  getByDateRange(from: string, to: string): WorkLog[] {
    const db = getDb()
    return db
      .prepare('SELECT * FROM work_log WHERE date BETWEEN ? AND ? ORDER BY date DESC, start_time DESC')
      .all(from, to) as WorkLog[]
  },

  getAll(): WorkLog[] {
    const db = getDb()
    return db.prepare('SELECT * FROM work_log ORDER BY date DESC, start_time DESC').all() as WorkLog[]
  },

  getStatsByCategory(from: string, to: string) {
    const db = getDb()
    return db
      .prepare(
        `SELECT task_type, COUNT(*) as count, SUM(pomodoro_count) as total_pomodoros
         FROM work_log WHERE date BETWEEN ? AND ?
         GROUP BY task_type`
      )
      .all(from, to)
  },

  getWeeklyStats(from: string, to: string) {
    const db = getDb()
    return db
      .prepare(
        `SELECT date, SUM(pomodoro_count) as total_pomodoros
         FROM work_log WHERE date BETWEEN ? AND ?
         GROUP BY date ORDER BY date ASC`
      )
      .all(from, to)
  }
}
