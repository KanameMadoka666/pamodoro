import React, { useEffect, useRef, useState } from 'react'
import { useSettingsStore, type Theme } from '../stores/settingsStore'

const THEMES: { key: Theme; label: string; icon: string; preview: string[] }[] = [
  { key: 'morning-mist',  label: '晨雾白',  icon: '🌤',  preview: ['#faf7f4','#e07b54','#2a9d8f'] },
  { key: 'midnight-blue', label: '深夜蓝',  icon: '🌙',  preview: ['#0f1117','#7c83fd','#34d399'] },
  { key: 'matcha-green',  label: '抹茶绿',  icon: '🍵',  preview: ['#f0f4ef','#4a7c59','#c8a96e'] },
  { key: 'warm-autumn',   label: '暖橙秋',  icon: '🍂',  preview: ['#fdf4ec','#d4622a','#8b5e3c'] },
  { key: 'dark-purple',   label: '暗夜紫',  icon: '🔮',  preview: ['#0e0a14','#c084fc','#f0abfc'] }
]

const BUILTIN_MUSIC = [
  { key: '', label: '无（静音）', icon: '🔇' },
  { key: '@builtin/brown', label: '雨声',    icon: '🌧' },
  { key: '@builtin/pink',  label: '咖啡馆',  icon: '☕' },
  { key: '@builtin/white', label: '森林风',  icon: '🌲' }
]

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}

const Setting_Slider = ({ label, value, min, max, step = 1, unit = '', onChange }: SliderProps): React.JSX.Element => (
  <div className="flex items-center gap-4">
    <span className="text-sm w-32 shrink-0" style={{ color: 'var(--color-text)' }}>{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="flex-1 accent-[var(--color-primary)]"
    />
    <span className="text-sm w-12 text-right tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
      {value}{unit}
    </span>
  </div>
)

interface SectionProps { title: string; children: React.ReactNode }
const Section = ({ title, children }: SectionProps): React.JSX.Element => (
  <div className="card p-5 flex flex-col gap-4">
    <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>{title}</h2>
    {children}
  </div>
)

const SettingsPage = (): React.JSX.Element => {
  const {
    theme, setTheme,
    workDuration, shortBreak, longBreak, longBreakInterval,
    bgType, bgValue,
    musicPath, musicVolume, sfxVolume,
    musicPlaying, setMusicPlaying,
    autoStartBreak, autoStartWork,
    saveSettings
  } = useSettingsStore()

  const musicFileRef = useRef<HTMLInputElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoLaunch, setAutoLaunchState] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    window.api.getAutoLaunch().then(v => setAutoLaunchState(v)).catch(() => {})
    window.api.getAppVersion().then(v => setAppVersion(v)).catch(() => {})
  }, [])

  const handleAutoLaunch = async (enable: boolean): Promise<void> => {
    await window.api.setAutoLaunch(enable)
    setAutoLaunchState(enable)
  }

  const save = (patch: Parameters<typeof saveSettings>[0]): void => {
    void saveSettings(patch)
  }

  // For sliders: update store state immediately, debounce the DB write
  const saveDebounced = (patch: Parameters<typeof saveSettings>[0]): void => {
    useSettingsStore.setState(patch as Parameters<typeof useSettingsStore.setState>[0])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void saveSettings(patch), 500)
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto pb-8">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>设置</h1>

      {/* ── 主题 ── */}
      <Section title="🎨 主题">
        <div className="grid grid-cols-5 gap-2">
          {THEMES.map(t => (
            <button
              key={t.key}
              onClick={() => { setTheme(t.key); save({ theme: t.key }) }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
              style={{
                background: theme === t.key ? 'var(--color-progress-track)' : 'transparent',
                border: `2px solid ${theme === t.key ? 'var(--color-primary)' : 'transparent'}`
              }}
            >
              <div className="flex gap-0.5">
                {t.preview.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text)' }}>{t.icon} {t.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── 背景 ── */}
      <Section title="🖼 背景">
        <div className="flex gap-2">
          {(['color', 'image'] as const).map(type => (
            <button
              key={type}
              onClick={() => save({ bgType: type })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: bgType === type ? 'var(--color-primary)' : 'var(--color-bg-sidebar)',
                color: bgType === type ? '#fff' : 'var(--color-text-muted)',
                border: `1px solid ${bgType === type ? 'var(--color-primary)' : 'var(--color-border)'}`
              }}
            >
              {type === 'color' ? '🎨 纯色' : '🖼 图片'}
            </button>
          ))}
        </div>

        {bgType === 'color' && (
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>选择颜色</span>
            <input
              type="color"
              value={bgValue || '#faf7f4'}
              onChange={e => save({ bgValue: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
              style={{ background: 'var(--color-bg-sidebar)' }}
            />
            <button
              onClick={() => save({ bgValue: '' })}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-sidebar)' }}
            >
              重置
            </button>
          </div>
        )}

        {bgType === 'image' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => bgFileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
              📁 选择图片
            </button>
            {bgValue && (
              <>
                <span className="text-xs truncate max-w-48" style={{ color: 'var(--color-text-muted)' }}>
                  {bgValue.split(/[\\/]/).pop()}
                </span>
                <button
                  onClick={() => save({ bgValue: '' })}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: '#ef4444', background: 'var(--color-bg-sidebar)' }}
                >
                  清除
                </button>
              </>
            )}
            <input
              ref={bgFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                // Convert to file:// path via Electron selectFile is not needed here
                // We use FileReader to get a data URL for simplicity
                const reader = new FileReader()
                reader.onload = () => save({ bgType: 'image', bgValue: reader.result as string })
                reader.readAsDataURL(file)
              }}
            />
          </div>
        )}
      </Section>

      {/* ── 背景音乐 ── */}
      <Section title="🎵 背景音乐">
        <div className="grid grid-cols-2 gap-2">
          {BUILTIN_MUSIC.map(m => (
            <button
              key={m.key}
              onClick={() => save({ musicPath: m.key })}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
              style={{
                background: musicPath === m.key ? 'var(--color-progress-track)' : 'var(--color-bg-sidebar)',
                color: 'var(--color-text)',
                border: `1px solid ${musicPath === m.key ? 'var(--color-primary)' : 'var(--color-border)'}`
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {musicPath === m.key && <span className="ml-auto text-xs" style={{ color: 'var(--color-primary)' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Custom file */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => musicFileRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            📁 导入本地音频
          </button>
          {musicPath && !musicPath.startsWith('@builtin') && (
            <span className="text-xs truncate max-w-48" style={{ color: 'var(--color-text-muted)' }}>
              {musicPath.split(/[\\/]/).pop()}
            </span>
          )}
          <input
            ref={musicFileRef}
            type="file"
            accept="audio/mp3,audio/ogg,audio/wav,audio/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              // Electron file path is accessible from webkitRelativePath or via file.path
              const filePath = (file as File & { path?: string }).path ?? file.name
              save({ musicPath: filePath })
            }}
          />
        </div>

        {/* Play / Stop toggle */}
        {musicPath && (
          <button
            onClick={() => setMusicPlaying(!musicPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-fit transition-all"
            style={{ background: musicPlaying ? 'var(--color-timer-break)' : 'var(--color-primary)', color: '#fff' }}
          >
            {musicPlaying ? '⏹ 停止播放' : '▶ 试听播放'}
          </button>
        )}

        <Setting_Slider
          label="🎵 音乐音量"
          value={musicVolume}
          min={0} max={100}
          unit="%"
          onChange={v => saveDebounced({ musicVolume: v })}
        />
      </Section>

      {/* ── 音效 ── */}
      <Section title="🔔 音效">
        <Setting_Slider
          label="🔔 提示音量"
          value={sfxVolume}
          min={0} max={100}
          unit="%"
          onChange={v => saveDebounced({ sfxVolume: v })}
        />
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          每次番茄完成时播放提示音。设为 0 则静音。
        </p>
      </Section>

      {/* ── 计时器参数 ── */}
      <Section title="⏱ 计时器参数">
        <Setting_Slider
          label="专注时长"
          value={workDuration}
          min={1} max={90}
          unit=" 分"
          onChange={v => saveDebounced({ workDuration: v })}
        />
        <Setting_Slider
          label="短休息"
          value={shortBreak}
          min={1} max={30}
          unit=" 分"
          onChange={v => saveDebounced({ shortBreak: v })}
        />
        <Setting_Slider
          label="长休息"
          value={longBreak}
          min={1} max={60}
          unit=" 分"
          onChange={v => saveDebounced({ longBreak: v })}
        />
        <Setting_Slider
          label="长休息间隔"
          value={longBreakInterval}
          min={2} max={10}
          unit=" 个"
          onChange={v => saveDebounced({ longBreakInterval: v })}
        />
      </Section>

      {/* ── 自动化 ── */}
      <Section title="⚙️ 自动化">
        {[
          { label: '专注结束后自动开始休息', key: 'autoStartBreak', value: autoStartBreak },
          { label: '休息结束后自动开始专注', key: 'autoStartWork',  value: autoStartWork  }
        ].map(item => (
          <label key={item.key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{item.label}</span>
            <div
              onClick={() => save({ [item.key]: !item.value } as Parameters<typeof saveSettings>[0])}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer"
              style={{ background: item.value ? 'var(--color-primary)' : 'var(--color-progress-track)' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: item.value ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </div>
          </label>
        ))}
      </Section>

      {/* ── 系统 ── */}
      <Section title="💻 系统">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>开机自启</span>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>登录系统时自动启动 Pamodoro</p>
          </div>
          <div
            onClick={() => { void handleAutoLaunch(!autoLaunch) }}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0"
            style={{ background: autoLaunch ? 'var(--color-primary)' : 'var(--color-progress-track)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: autoLaunch ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </div>
        </label>
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
        >
          <span className="shrink-0">🔔</span>
          <span>关闭窗口时自动最小化到系统托盘，双击托盘图标可重新显示窗口。</span>
        </div>
      </Section>

      <Section title="版本信息">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--color-text)' }}>当前版本</span>
          <span className="tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            v{appVersion || '--'}
          </span>
        </div>
      </Section>
    </div>
  )
}

export default SettingsPage
