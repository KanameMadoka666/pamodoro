import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🍅', label: '番茄钟', end: true },
  { to: '/activities', icon: '📋', label: '活动清单' },
  { to: '/today', icon: '📅', label: '今日计划' },
  { to: '/worklog', icon: '📝', label: '工作记录' },
  { to: '/analytics', icon: '📊', label: '数据分析' }
]

const Sidebar = (): React.JSX.Element => {
  return (
    <aside
      className="flex flex-col h-full w-52 shrink-0 px-3 py-4"
      style={{ background: 'var(--color-bg-sidebar)', borderRight: '1px solid var(--color-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6 app-drag-region" style={{ height: 40 }}>
        <span className="text-2xl">🍅</span>
        <span className="font-bold text-lg tracking-wide" style={{ color: 'var(--color-text)' }}>
          Pamodoro
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <NavLink
        to="/settings"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        <span className="text-base w-5 text-center">⚙️</span>
        <span>设置</span>
      </NavLink>
    </aside>
  )
}

export default Sidebar
