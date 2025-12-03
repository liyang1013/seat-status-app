import { app } from "electron";
import path from "path";

const Store = require('electron-store');

class ConfigManager {
  private store
  constructor() {
    this.store = new Store({
      cwd: this.getStorePath(),
      name: 'config',
      schema: {
        apiKey: {
          type: 'string',
          default: ''
        },
        ip: {
          type: 'string',
          default: 'Unknown'
        },
        mac: {
          type: 'string',
          default: 'Unknown'
        },
        hostname: {
          type: 'string',
          default: 'Unknown'
        },
        serverUrl: {
          type: 'string',
          default: 'http://bq.qianying.ltd:8080'
        }
      }
    });
  }
  getServerConfig() {
    return {
      serverUrl: this.store.get('serverUrl'),
      apiKey: this.store.get('apiKey')
    };
  }
  saveServerConfig(config: { serverUrl: string; apiKey: string }) {
    this.store.set('serverUrl', config.serverUrl);
    this.store.set('apiKey', config.apiKey);
  }
  getSystemInfo() {
    return {
      hostname: this.store.get('hostname'),
      mac: this.store.get('mac'),
      ip: this.store.get('ip')
    };
  }
  saveSystemInfo(info: { hostname: string; mac: string; ip: string }) {
    this.store.set('hostname', info.hostname);
    this.store.set('mac', info.mac);
    this.store.set('ip', info.ip);
  }
  getStorePath() {
    let storagePath: string;

    if (process.env.NODE_ENV !== 'development') {
      storagePath = path.join(path.dirname(app.getPath('exe')), 'userdata');
    } else {
      storagePath = path.join(app.getPath('userData'), 'storage');
    }
    const fs = require('fs');
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }

    return storagePath;
  }
}

export const configManager = new ConfigManager();
export default configManager;





