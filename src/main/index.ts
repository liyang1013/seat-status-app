import os from 'os'
import { join } from 'path'
import { SeatAPI } from '@main/api'
import configManager from '@main/store'
import controller from '@main/controller'
const AutoLaunch = require('auto-launch');
// import { shutdownListener } from '@main/shutdown'
import icon from '../../resources/favicon.ico?asset'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { app, shell, BrowserWindow, Tray, Menu, powerMonitor } from 'electron'


let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let tray;

/**
 * Single Instance Lock
 */
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

/**
 * Create Tray
 */
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

/**
 * Sytem Information
 * @returns {hostname: string, mac: string, ip: string}
 */
function getSystemInfo() {
  const interfaces = os.networkInterfaces()
  let mac = ''
  let ip = ''

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (!iface.internal && iface.family === 'IPv4') {
        mac = iface.mac
        ip = iface.address
        break
      }
    }
    if (mac && ip) break
  }

  return {
    hostname: os.hostname(),
    mac: mac || 'Unknown',
    ip: ip || 'Unknown'
  }
}

/**
 * Auto Launch Setup
 */
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

/**
 * Power Monitor Setup
 */
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

/**
 * 发送座位状态
 * @param status 座位状态，1表示上机，0表示下机
 */
function sendSeatStatus(status: number) {
  const { serverUrl, apiKey } = configManager.getServerConfig()
  console.log(`发送座位状态: ${status === 1 ? '上机' : '下机'}`);
  const api = new SeatAPI(apiKey, serverUrl)
  api.modifySeatStatus(status)
}

/**
 * Create Main Window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
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

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  configManager.saveSystemInfo(getSystemInfo())

  controller()
  createWindow()
  createTray()

  await enableAutoLaunch()

  setTimeout(() => {
    sendSeatStatus(1);
  }, 3000);

  setupPowerMonitor();

  // shutdownListener.registerShutdownListener(() => {
    // console.log('执行关机前的命令...');
    // 在这里执行你需要的命令，例如：
    // 1. 同步保存数据到本地
    // 2. 发送日志到服务器
    // 3. 清理临时文件
    // 注意：操作应尽快完成，系统不会等待太久。
  // });


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault()
    mainWindow?.hide()
  }
});

app.on('will-quit', (_event) => {
    // shutdownListener.unregisterShutdownListener();
    sendSeatStatus(0)
});

app.on ('quit', () => {
    console.log('应用已退出')
});



