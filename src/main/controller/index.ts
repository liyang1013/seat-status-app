import { ipcMain } from 'electron'
import { defaultService } from '@main/service'

export default function (): void {
    const service = new defaultService();

    ipcMain.handle('get:config', async (_,) => {
        try {
            const result = await service.loadConfig();
            return { status: true, message: 'success', data: result }
        } catch (error) {
            return { status: false, message: error, data: null }
        }
    })

    ipcMain.handle('save:config', async (_, config) => {
        try {
            await service.saveConfig(config);
            return { status: true, message: 'success', data: null }
        } catch (error) {
            return { status: false, message: error, data: null }
        }
    })

    ipcMain.handle('test:connection', async (_, config) => {
        try {
            await service.testConnection(config);
            return { status: true, message: 'success', data: null }
        } catch (error) {
            return { status: false, message: error, data: null }
        }
    })
}