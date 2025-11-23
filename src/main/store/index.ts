const Store = require('electron-store');

class ConfigManager {
    private store
    constructor() {
        this.store = new Store({
            schema: {
                seatCode: {
                    type: 'string',
                    default: ''
                },
                apiKey: {
                    type: 'string',
                    default: ''
                }
            }
        });
    }
    getConfig() {
        return {
            seatCode: this.store.get('seatCode', ''),
            apiKey: this.store.get('apiKey', '')
        };
    }
    saveConfig(config) {
        this.store.set('seatCode', config.seatCode);
        this.store.set('apiKey', config.apiKey);
    }
}

export const configManager = new ConfigManager();
export default configManager;





