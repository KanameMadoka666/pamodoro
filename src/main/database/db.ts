import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const userDataPath = app.getPath('userData')
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    const dbPath = path.join(userDataPath, 'pamodoro.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      title               TEXT    NOT NULL,
      description         TEXT    DEFAULT '',
      category            TEXT    DEFAULT '其他',
      priority            INTEGER DEFAULT 2,
      estimated_pomodoros INTEGER DEFAULT 1,
      status              TEXT    DEFAULT 'active',
      created_at          TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS today_task (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id         INTEGER REFERENCES activity(id) ON DELETE SET NULL,
      date                TEXT    NOT NULL,
      sort_order          INTEGER DEFAULT 0,
      estimated_pomodoros INTEGER DEFAULT 1,
      actual_pomodoros    INTEGER DEFAULT 0,
      status              TEXT    DEFAULT 'pending',
      notes               TEXT    DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS pomodoro_session (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER REFERENCES today_task(id) ON DELETE SET NULL,
      start_time TEXT NOT NULL,
      end_time   TEXT,
      type       TEXT DEFAULT 'work',
      result     TEXT DEFAULT 'completed'
    );

    CREATE TABLE IF NOT EXISTS work_log (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      date             TEXT NOT NULL,
      start_time       TEXT NOT NULL,
      end_time         TEXT,
      task_id          INTEGER,
      task_type        TEXT DEFAULT '',
      task_description TEXT DEFAULT '',
      pomodoro_count   INTEGER DEFAULT 1,
      notes            TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('work_duration', '25'),
      ('short_break', '5'),
      ('long_break', '15'),
      ('long_break_interval', '4'),
      ('theme', 'morning-mist'),
      ('bg_type', 'color'),
      ('bg_value', ''),
      ('music_path', ''),
      ('music_volume', '50'),
      ('sfx_volume', '80'),
      ('auto_start_break', 'false'),
      ('auto_start_work', 'false');
  `)
}
