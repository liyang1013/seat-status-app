const { app, BrowserWindow, Tray, Menu, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');
const Store = require('electron-store');
const SeatAPI = require('./api');

const store = new Store();
let mainWindow;
let tray;
let isQuitting = false;

// 开机自启动配置
const autoLauncher = new AutoLaunch({
    name: '座位状态管理器',
    path: app.getPath('exe'),
});

// 启用开机自启动
async function enableAutoLaunch() {
    try {
        const isEnabled = await autoLauncher.isEnabled();
        if (!isEnabled) {
            await autoLauncher.enable();
            console.log('开机自启动已启用');
        }
        store.set('autoLaunch', true);
    } catch (error) {
        console.error('启用开机自启动失败:', error);
    }
}

// 创建主窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 260,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false // 允许加载外部资源
        },
        show: false,
        icon: path.join(__dirname, 'assets/icon.png'),
        titleBarStyle: 'default',
        frame: true
    });

    mainWindow.loadFile('src/index.html');

    // 开发时打开调试工具
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // 关闭时隐藏而不是退出
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 创建系统托盘
function createTray() {
    const iconPath = path.join(__dirname, 'assets/favicon.ico');
    tray = new Tray(iconPath);

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
                sendSeatStatus(0).finally(() => {
                    app.quit();
                });
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

// 发送座位状态
async function sendSeatStatus(status) {
    try {
        const api = new SeatAPI();
        const seatCode = store.get('seatCode', '001');
        const apiKey = store.get('apiKey', '');

        if (!apiKey) {
            console.warn('API Key 未配置，无法发送状态');
            return;
        }

        api.apiKey = apiKey;
        const result = await api.modifySeatStatus(seatCode, status);

        if (result.status === 200) {
            console.log(`${status === 1 ? '上机' : '下机'}指令发送成功`);
            // 通知渲染进程更新状态
            if (mainWindow) {
                mainWindow.webContents.send('status-update', {
                    status: status === 1 ? 'online' : 'offline',
                    timestamp: Date.now()
                });
            }
        } else {
            console.error('指令发送失败:', result.message);
        }
    } catch (error) {
        console.error('发送状态失败:', error.message);
    }
}

// 设置电源监控
function setupPowerMonitor() {
    // 监听关机事件
    powerMonitor.on('shutdown', () => {
        console.log('系统关机，发送下机指令');
        sendSeatStatus(0);
    });

    // 监听锁屏事件
    powerMonitor.on('lock-screen', () => {
        console.log('系统锁屏');
    });

    powerMonitor.on('unlock-screen', () => {
        console.log('系统解锁');
    });

    // 监听系统挂起和恢复
    powerMonitor.on('suspend', () => {
        console.log('系统挂起');
    });

    powerMonitor.on('resume', () => {
        console.log('系统恢复');
    });
}

// 应用准备就绪
app.whenReady().then(async () => {
    createWindow();
    createTray();

    // 启用开机自启动
    await enableAutoLaunch();

    // 应用启动时发送上机指令
    setTimeout(() => {
        sendSeatStatus(1);
    }, 3000); // 延迟3秒发送，确保网络就绪

    // 监听系统电源事件
    setupPowerMonitor();

    console.log('座位状态管理器已启动 - 开机自启动已启用');
});

// 应用激活时（macOS）
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 应用退出前
app.on('before-quit', (event) => {
    if (!isQuitting) {
        event.preventDefault();
    }
});

// 所有窗口关闭时（Windows & Linux）
app.on('window-all-closed', (event) => {
    event.preventDefault();
});

// IPC 通信处理
ipcMain.handle('get-config', () => {
    return {
        seatCode: store.get('seatCode', '001'),
        apiKey: store.get('apiKey', ''),
        autoLaunch: true
    };
});

ipcMain.handle('save-config', (event, config) => {
    store.set('seatCode', config.seatCode);
    store.set('apiKey', config.apiKey);
    return true;
});

ipcMain.handle('test-connection', async (event, config) => {
    const api = new SeatAPI(config.apiKey);
    try {
        const result = await api.modifySeatStatus(config.seatCode, 1);
        return result;
    } catch (error) {
        return { status: 500, message: error.message };
    }
});

ipcMain.handle('send-seat-status', async (event, { config, status }) => {
    const api = new SeatAPI(config.apiKey);
    try {
        const result = await api.modifySeatStatus(config.seatCode, status);
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
});

ipcMain.handle('minimize-to-tray', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});