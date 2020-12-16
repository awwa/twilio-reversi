require('dotenv').config();
module.exports = class Sms{
    // コンストラクタ
    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.client = require('twilio')(accountSid, authToken);
    }

    async send(to, body) {
        const message = await this.client.messages.create(
            {
                body: body,
                from: process.env.NUMBER,
                to: to
            }
        );
        return message;
    }
}
