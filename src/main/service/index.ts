import configManager from '@main/store'
import { SeatAPI } from '@main/api'

export class defaultService {

  async loadConfig(): Promise<{ systemInfo: any, serverConfig: any }> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve({ systemInfo: configManager.getSystemInfo(), serverConfig: configManager.getServerConfig() })
      } catch (error: any) {
        reject(error.message)
      }
    })
  }

  async saveServerConfig(config: { serverUrl: string; apiKey: string }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        configManager.saveServerConfig(config)
        resolve()
      } catch (error: any) {
        reject(error.message)
      }
    })
  }

  async healthCheck(config: { serverUrl: string; apiKey: string }): Promise<void> {
    const { serverUrl, apiKey } = config
    return new Promise(async (resolve, reject) => {
      try {
        const api = new SeatAPI(apiKey, serverUrl)
        const result = await api.healthCheck()
        if(!result){
          reject('Health check failed')
        }
        resolve()
      } catch (error: any) {
        reject(error.message)
      }
    })
  }
}
