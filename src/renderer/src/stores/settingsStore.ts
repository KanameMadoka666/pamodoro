import { create } from 'zustand'

export type Theme =
  | 'morning-mist'
  | 'midnight-blue'
  | 'matcha-green'
  | 'warm-autumn'
  | 'dark-purple'

interface SettingsState {
  theme: Theme
  workDuration: number
  shortBreak: number
  longBreak: number
  longBreakInterval: number
  bgType: 'color' | 'image'
  bgValue: string
  musicPath: string
  musicVolume: number
  sfxVolume: number
  autoStartBreak: boolean
  autoStartWork: boolean
  loaded: boolean
  // In-memory only — not persisted
  musicPlaying: boolean
  setMusicPlaying: (playing: boolean) => void
  setTheme: (theme: Theme) => void
  loadSettings: () => Promise<void>
  saveSettings: (data: Partial<Omit<SettingsState, 'loaded' | 'musicPlaying' | 'setMusicPlaying' | 'setTheme' | 'loadSettings' | 'saveSettings'>>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'morning-mist',
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  bgType: 'color',
  bgValue: '',
  musicPath: '',
  musicVolume: 50,
  sfxVolume: 80,
  autoStartBreak: false,
  autoStartWork: false,
  loaded: false,
  musicPlaying: false,

  setMusicPlaying: (playing) => set({ musicPlaying: playing }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  loadSettings: async () => {
    const s = await window.api.getSettings() as Record<string, unknown>
    const theme = (s.theme as Theme) ?? 'morning-mist'
    document.documentElement.setAttribute('data-theme', theme)
    set({
      theme,
      workDuration: Number(s.work_duration ?? 25),
      shortBreak: Number(s.short_break ?? 5),
      longBreak: Number(s.long_break ?? 15),
      longBreakInterval: Number(s.long_break_interval ?? 4),
      bgType: (s.bg_type as 'color' | 'image') ?? 'color',
      bgValue: (s.bg_value as string) ?? '',
      musicPath: (s.music_path as string) ?? '',
      musicVolume: Number(s.music_volume ?? 50),
      sfxVolume: Number(s.sfx_volume ?? 80),
      autoStartBreak: s.auto_start_break === 'true',
      autoStartWork: s.auto_start_work === 'true',
      loaded: true
    })
  },

  saveSettings: async (data) => {
    set(data as Partial<SettingsState>)
    const { theme } = get()
    document.documentElement.setAttribute('data-theme', theme)
    const serialized: Record<string, string> = {}
    if (data.theme !== undefined) serialized['theme'] = data.theme
    if (data.workDuration !== undefined) serialized['work_duration'] = String(data.workDuration)
    if (data.shortBreak !== undefined) serialized['short_break'] = String(data.shortBreak)
    if (data.longBreak !== undefined) serialized['long_break'] = String(data.longBreak)
    if (data.longBreakInterval !== undefined) serialized['long_break_interval'] = String(data.longBreakInterval)
    if (data.bgType !== undefined) serialized['bg_type'] = data.bgType
    if (data.bgValue !== undefined) serialized['bg_value'] = data.bgValue
    if (data.musicPath !== undefined) serialized['music_path'] = data.musicPath
    if (data.musicVolume !== undefined) serialized['music_volume'] = String(data.musicVolume)
    if (data.sfxVolume !== undefined) serialized['sfx_volume'] = String(data.sfxVolume)
    if (data.autoStartBreak !== undefined) serialized['auto_start_break'] = String(data.autoStartBreak)
    if (data.autoStartWork !== undefined) serialized['auto_start_work'] = String(data.autoStartWork)
    await window.api.saveSettings(serialized)
  }
}))
