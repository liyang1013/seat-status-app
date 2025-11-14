const Store = require('electron-store');

class ConfigManager {
    constructor() {
        this.store = new Store({
            defaults: {
                seatCode: '001',
                apiKey: '',
                autoLaunch: true
            }
        });
    }

    get(key, defaultValue = null) {
        return this.store.get(key, defaultValue);
    }

    set(key, value) {
        this.store.set(key, value);
    }

    getConfig() {
        return {
            seatCode: this.get('seatCode'),
            apiKey: this.get('apiKey'),
            autoLaunch: true
        };
    }

    saveConfig(config) {
        this.set('seatCode', config.seatCode);
        this.set('apiKey', config.apiKey);
    }

    // 验证配置
    validateConfig(config) {
        const errors = [];

        if (!config.seatCode || config.seatCode.trim() === '') {
            errors.push('座位号不能为空');
        }

        if (!config.apiKey || config.apiKey.trim() === '') {
            errors.push('API Key 不能为空');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = ConfigManager;