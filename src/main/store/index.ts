const Store = require('electron-store');

class ConfigManager {
  private store
  constructor() {
    this.store = new Store({
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
          default: 'http://bq.qianying.ltd'
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
}

export const configManager = new ConfigManager();
export default configManager;





