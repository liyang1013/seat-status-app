import { ipcMain } from 'electron'
import { defaultService } from '@main/service'

export default function (): void {
  const service = new defaultService();

  ipcMain.handle('get-config', async (_,) => {
    try {
      const result = await service.loadConfig();
      return { status: true, message: 'success', data: result }
    } catch (error) {
      return { status: false, message: error, data: null }
    }
  })

  ipcMain.handle('save-config', async (_, config) => {
    try {
      await service.saveServerConfig(config);
      return { status: true, message: 'success', data: null }
    } catch (error) {
      return { status: false, message: error, data: null }
    }
  })

  ipcMain.handle('health-check', async (_, config) => {
    try {
      await service.healthCheck(config);
      return { status: true, message: 'success', data: null }
    } catch (error) {
      return { status: false, message: error, data: null }
    }
  })
}
