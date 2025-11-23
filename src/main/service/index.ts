import configManager from '@main/store'
import { SeatAPI } from '@main/api'

export class defaultService {

    async loadConfig(): Promise<{ seatCode: string | unknown, apiKey: string | unknown }> {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(configManager.getConfig())
            } catch (error: any) {
                reject(error.message)
            }
        })
    }

    async saveConfig(config): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                configManager.saveConfig(config)
                resolve()
            } catch (error: any) {
                reject(error.message)
            }
        })
    }

    async testConnection(config): Promise<void> {
        const { seatCode, apiKey } = config
        return new Promise(async (resolve, reject) => {
            try {
                const api = new SeatAPI(apiKey)
                await api.modifySeatStatus(seatCode, 1)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}