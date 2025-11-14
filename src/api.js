const axios = require('axios');

class SeatAPI {
  constructor(apiKey = '') {
    this.baseURL = 'http://bq.qianying.ltd:8080/seat/modifyState';
    this.apiKey = apiKey;
  }

  async modifySeatStatus(seatCode, seatStatus) {
    if (!this.apiKey) {
      throw new Error('API Key 未配置');
    }

    if (!seatCode) {
      throw new Error('座位号未配置');
    }

    const url = `${this.baseURL}?apikey=${encodeURIComponent(this.apiKey)}`;
    const data = {
      seatCode: seatCode.toString(),
      seatStatus: parseInt(seatStatus)
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SeatStatusManager/1.0.0'
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // 服务器响应错误
        const status = error.response.status;
        const message = error.response.data?.message || error.response.statusText;
        throw new Error(`服务器错误 (${status}): ${message}`);
      } else if (error.request) {
        // 网络错误
        throw new Error('网络连接失败，请检查网络设置和服务器地址');
      } else {
        // 其他错误
        throw new Error(`请求错误: ${error.message}`);
      }
    }
  }
}

module.exports = SeatAPI;