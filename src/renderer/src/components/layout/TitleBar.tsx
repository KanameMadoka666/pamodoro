import React from 'react'
const TitleBar = (): React.JSX.Element => {
  const handleMinimize = (): void => window.electron.ipcRenderer.send('app:minimize')
  const handleMaximize = (): void => window.electron.ipcRenderer.send('app:maximize')
  const handleClose = (): void => window.electron.ipcRenderer.send('app:close')

  return (
    <div
      className="app-drag-region flex items-center justify-end h-8 px-2 shrink-0"
      style={{ background: 'var(--color-bg-sidebar)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full transition-opacity hover:opacity-80 active:opacity-60"
          style={{ background: '#f5a623' }}
          title="最小化"
        />
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full transition-opacity hover:opacity-80 active:opacity-60"
          style={{ background: '#7ac943' }}
          title="最大化"
        />
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full transition-opacity hover:opacity-80 active:opacity-60"
          style={{ background: '#fc625d' }}
          title="关闭"
        />
      </div>
    </div>
  )
}

export default TitleBar
