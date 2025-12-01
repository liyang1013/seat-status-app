import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  loadConfig: async () => await ipcRenderer.invoke("get-config"),
  saveConfig: async (config) => await ipcRenderer.invoke("save-config", config),
  healthCheck: async (config) => await ipcRenderer.invoke("health-check", config)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
