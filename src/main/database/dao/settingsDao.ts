import { getDb } from '../db'

export interface Settings {
  work_duration: number
  short_break: number
  long_break: number
  long_break_interval: number
  theme: string
  bg_type: string
  bg_value: string
  music_path: string
  music_volume: number
  sfx_volume: number
  auto_start_break: boolean
  auto_start_work: boolean
}

export const settingsDao = {
  getAll(): Settings {
    const db = getDb()
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value
    return {
      work_duration: Number(map['work_duration'] ?? 25),
      short_break: Number(map['short_break'] ?? 5),
      long_break: Number(map['long_break'] ?? 15),
      long_break_interval: Number(map['long_break_interval'] ?? 4),
      theme: map['theme'] ?? 'morning-mist',
      bg_type: map['bg_type'] ?? 'color',
      bg_value: map['bg_value'] ?? '',
      music_path: map['music_path'] ?? '',
      music_volume: Number(map['music_volume'] ?? 50),
      sfx_volume: Number(map['sfx_volume'] ?? 80),
      auto_start_break: map['auto_start_break'] === 'true',
      auto_start_work: map['auto_start_work'] === 'true'
    }
  },

  set(key: string, value: string): void {
    const db = getDb()
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
  },

  setMany(data: Partial<Record<string, string>>): void {
    const db = getDb()
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    const setAll = db.transaction(() => {
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) stmt.run(k, v)
      }
    })
    setAll()
  }
}
