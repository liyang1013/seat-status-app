import configManager from "@main/store";
const axios = require('axios');

export class SeatAPI {

  private updateURL = '/seat/updateStatusByMac';
  private healthURL = '/auth/healthCheck';
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey: string = '', baseURL: string = '') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async healthCheck(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.baseURL === '') {
          reject('服务器地址未配置');
        }
        const url = `${this.baseURL}${this.healthURL}`;
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SeatStatusManager/1.0.0'
          },
          timeout: 5000
        });
        if (response.data.status === 200) {
          resolve(true)
        } else {
          reject('服务器连接失败:' + response.data.message);
        }
      } catch (error: any) {
        reject(error.message)
      }
    })
  }

  async modifySeatStatus(seatStatus: number): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.baseURL === '') {
          reject('服务器地址未配置');
        }
        if (!this.apiKey) {
          reject('apiKey未配置');
        }
        const { hostname, mac, ip } = configManager.getSystemInfo()
        const action = seatStatus === 0 ? '下机' : '上机'
        const url = `${this.baseURL}${this.updateURL}?apikey=${encodeURIComponent(this.apiKey)}`;
        const data = {
          mac: mac,
          ip: ip,
          hostName: hostname,
          seatStatus: seatStatus
        };
        const response = await axios.post(url, data, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SeatStatusManager/1.0.0'
          },
          timeout: 10000
        });
        if (response.data.status === 200) {
          resolve(true)
        } else {
          reject(`${action}失败:${response.data.message}`);
        }
      } catch (error: any) {
        reject(error.message)
      }
    })

  }
}
