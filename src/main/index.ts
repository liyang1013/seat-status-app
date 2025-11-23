import { app, shell, BrowserWindow, Tray, Menu, powerMonitor } from 'electron'
import path, { join } from 'path'
const AutoLaunch = require('auto-launch');
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
const shutdownListener = require(path.join(__dirname, '../../shutdown-listener'));
import icon from '../../resources/favicon.ico?asset'
import controller from '@main/controller'
import { SeatAPI } from '@main/api'
import configManager from '@main/store'

let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let tray;

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('应用已在运行中，退出新实例')
  app.quit()
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }
    if (process.platform === 'win32') {
      tray?.displayBalloon({
        title: '座位状态管理器',
        content: '程序已在运行中，无需重复启动。'
      })
    }
  })
}

const autoLauncher = new AutoLaunch({
  name: '座位状态管理器',
  path: app.getPath('exe'),
});

async function enableAutoLaunch() {
  try {
    const isEnabled = await autoLauncher.isEnabled();
    if (!isEnabled) {
      await autoLauncher.enable();
      console.log('开机自启动已启用');
    }
  } catch (error) {
    console.error('启用开机自启动失败:', error);
  }
}

function setupNativeShutdownListener(): void {
  if (process.platform !== 'win32') return
  console.log('设置原生关机监听器...')

  try {
    const success = shutdownListener.start((eventType: string) => {
      console.log(`=== 原生监听器: 检测到 ${eventType} 事件 ===`)
      emergencyShutdown()
    })

    if (success) {
      console.log('原生关机监听器启动成功')
    } else {
      throw new Error('启动失败')
    }

  } catch (error) {
    console.error('原生关机监听器启动失败:', error)
    setupFallbackShutdownListener()
  }
}

async function emergencyShutdown(): Promise<void> {
  console.log('执行紧急关机处理...')

  try {
    sendSeatStatus(0)
  } catch (error: any) {
    console.error('紧急下机指令发送失败:', error.message)
  }
}

function setupFallbackShutdownListener(): void {
  console.log('使用备用关机监听方案')

  powerMonitor.on('shutdown', () => {
    console.log('powerMonitor: 检测到关机事件')
    emergencyShutdown()
  })

  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号')
    emergencyShutdown()
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 205,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    icon: icon
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

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

function sendSeatStatus(status: number) {
  const { seatCode, apiKey } = configManager.getConfig()
  const api = new SeatAPI(apiKey)
  api.modifySeatStatus(seatCode, status)
}

function createTray() {
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '开机自启动',
      type: 'checkbox',
      checked: true,
      enabled: false,
      toolTip: '默认启用，不可修改'
    },
    { type: 'separator' },
    {
      label: '立即上机',
      click: async () => {
        await sendSeatStatus(1);
      }
    },
    {
      label: '立即下机',
      click: async () => {
        await sendSeatStatus(0);
      }
    },
    { type: 'separator' },
    {
      label: '退出应用',
      click: () => {
        isQuitting = true;
        sendSeatStatus(0)
        app.quit();
      }
    }
  ]);

  tray.setToolTip('座位状态管理器\n开机自启动已启用');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function setupPowerMonitor() {

  powerMonitor.on('lock-screen', () => {
    sendSeatStatus(0)
  });

  powerMonitor.on('unlock-screen', () => {
    sendSeatStatus(1)
  });

  powerMonitor.on('suspend', () => {
    sendSeatStatus(0)
  });

  powerMonitor.on('resume', () => {
    setTimeout(() => {
      sendSeatStatus(1)
    }, 5000)
  });
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  controller()
  createWindow()
  createTray()

  await enableAutoLaunch()

  setupNativeShutdownListener()

  setTimeout(() => {
    sendSeatStatus(1);
  }, 3000);

  setupPowerMonitor();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
    sendSeatStatus(0)
});

app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault()
    mainWindow?.hide()
  } else {
    shutdownListener.stop()
    sendSeatStatus(0)
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

