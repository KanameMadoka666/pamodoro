import React, { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TitleBar from './components/layout/TitleBar'
import TimerEngine from './components/Timer/TimerEngine'
import MusicPlayer from './components/MusicPlayer'
import TimerPage from './pages/TimerPage'
import ActivityPage from './pages/ActivityPage'
import TodayPage from './pages/TodayPage'
import WorkLogPage from './pages/WorkLogPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import { useSettingsStore } from './stores/settingsStore'

function App(): React.JSX.Element {
  const { loadSettings, bgType, bgValue } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [])

  const bgStyle: React.CSSProperties =
    bgType === 'image' && bgValue
      ? { backgroundImage: `url("${bgValue}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : bgType === 'color' && bgValue
      ? { backgroundColor: bgValue }
      : {}

  return (
    <HashRouter>
      <div
        className="flex flex-col h-screen w-screen overflow-hidden"
        style={{ background: 'var(--color-bg)', ...bgStyle }}
      >
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6" style={{ background: 'transparent' }}>
            <Routes>
              <Route path="/" element={<TimerPage />} />
              <Route path="/activities" element={<ActivityPage />} />
              <Route path="/today" element={<TodayPage />} />
              <Route path="/worklog" element={<WorkLogPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
        {/* TimerEngine: always mounted, owns the tick interval & completion dialog */}
        <TimerEngine />
        {/* MusicPlayer: always mounted, owns background music playback */}
        <MusicPlayer />
      </div>
    </HashRouter>
  )
}

export default App
