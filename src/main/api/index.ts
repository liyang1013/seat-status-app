const axios = require('axios');

export class SeatAPI {

    private baseURL = 'http://bq.qianying.ltd:8080/seat/modifyState';
    private apiKey = ''

    constructor(apiKey: string = '') {
        this.apiKey = apiKey;
    }

    async modifySeatStatus(seatCode: string, seatStatus: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.apiKey) {
                    reject('apiKey未配置');
                }
                if (!seatCode) {
                    reject('座位号未配置');
                }
                const action = seatStatus === 0 ? '下机' : '上机'
                const url = `${this.baseURL}?apikey=${encodeURIComponent(this.apiKey)}`;
                const data = {
                    seatCode: seatCode.toString(),
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