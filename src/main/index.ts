import { app, shell, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerActivityIpc } from './ipc/activityIpc'
import { registerTodayTaskIpc } from './ipc/todayTaskIpc'
import { registerPomodoroIpc } from './ipc/pomodoroIpc'
import { registerSettingsIpc } from './ipc/settingsIpc'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    if (tray) {
      e.preventDefault()
      mainWindow!.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  const menu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '退出', click: () => { tray = null; app.exit(0) } }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('Pamodoro 番茄钟')
  tray.on('double-click', () => mainWindow?.show())
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.pamodoro')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC handlers
  registerActivityIpc()
  registerTodayTaskIpc()
  registerPomodoroIpc()
  registerSettingsIpc()

  // Window controls
  ipcMain.on('app:minimize', () => mainWindow?.minimize())
  ipcMain.on('app:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('app:close', () => mainWindow?.close())

  // Bring window to front (called when timer completes)
  ipcMain.handle('window:flash', () => {
    if (!mainWindow) return
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.show()
    mainWindow.focus()
    if (process.platform === 'win32') mainWindow.flashFrame(true)
  })

  // Restore normal window level after dialog is dismissed
  ipcMain.handle('window:unflash', () => {
    if (!mainWindow) return
    mainWindow.setAlwaysOnTop(false)
    if (process.platform === 'win32') mainWindow.flashFrame(false)
  })

  createWindow()
  createTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
