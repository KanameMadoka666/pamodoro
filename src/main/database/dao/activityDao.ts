import { getDb } from '../db'
import dayjs from 'dayjs'

export interface Activity {
  id?: number
  title: string
  description?: string
  category?: string
  priority?: number
  estimated_pomodoros?: number
  status?: string
  created_at?: string
}

export const activityDao = {
  getAll(status = 'active'): Activity[] {
    const db = getDb()
    return db.prepare('SELECT * FROM activity WHERE status = ? ORDER BY priority ASC, id DESC').all(status) as Activity[]
  },

  getById(id: number): Activity | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM activity WHERE id = ?').get(id) as Activity | undefined
  },

  create(data: Omit<Activity, 'id' | 'created_at'>): Activity {
    const db = getDb()
    const now = dayjs().toISOString()
    const result = db
      .prepare(
        `INSERT INTO activity (title, description, category, priority, estimated_pomodoros, status, created_at)
         VALUES (@title, @description, @category, @priority, @estimated_pomodoros, @status, @created_at)`
      )
      .run({
        title: data.title,
        description: data.description ?? '',
        category: data.category ?? '其他',
        priority: data.priority ?? 2,
        estimated_pomodoros: data.estimated_pomodoros ?? 1,
        status: 'active',
        created_at: now
      })
    return { ...data, id: result.lastInsertRowid as number, created_at: now }
  },

  update(id: number, data: Partial<Activity>): void {
    const db = getDb()
    const ALLOWED = new Set(['title', 'description', 'category', 'priority', 'estimated_pomodoros', 'status'])
    const fields = Object.keys(data)
      .filter((k) => ALLOWED.has(k))
      .map((k) => `${k} = @${k}`)
      .join(', ')
    if (!fields) return
    db.prepare(`UPDATE activity SET ${fields} WHERE id = @id`).run({ ...data, id })
  },

  archive(id: number): void {
    const db = getDb()
    db.prepare("UPDATE activity SET status = 'archived' WHERE id = ?").run(id)
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM activity WHERE id = ?').run(id)
  }
}
