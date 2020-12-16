const Sms = require('./sms');
const Game = require('./game');
const HangupError = require('./hangup_error');
const RedirectError = require('./redirect_error');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const sayParams = { voice: 'woman', language: 'ja-jp' };

module.exports = class gaontroller {
    constructor(db) {
        this.db = db;
        this.sms = new Sms();
    }
    /**
     * ゲームタイトルの出力
     **/
    title() {
        const response = new VoiceResponse();
        // Digits未指定の場合
        response.gather({
            action: '/games/menu/',
            method: 'POST',
            numDigits: '1'
        }).say(sayParams,'こんにちはトゥイリオ リバーシへ！ゲームを始めるには1を、参加中のゲームで石を置くには2を押してください。');
        return response.toString();
    }
    /**
     * メインメニュー選択の処理
     **/
    menu(body) {
        const response = new VoiceResponse();
        try {
            if (!('Digits' in body)) {
                throw new RedirectError('メニューが選択されていません。入力し直してください。');
            }
            switch (body.Digits) {
                case '1':
                    // ゲームに参加
                    const gather = response.gather({
                        action: '/games/entry/',
                        method: 'POST',
                        finishOnKey: '#'
                    });
                    gather.say(sayParams,'ゲームを始めるには画面上に表示されているトークンを入力してください。最後にシャープを入力してください。');
                    break;
                case '2':
                    // 石を置く
                    response.gather({
                        action: '/games/turn/',
                        method: 'POST',
                        finishOnKey: '#'
                    }).say(sayParams,'参加中のゲームで石を置くには、トークンの後にアスタリスクで区切って石を置く行列を二桁の数字で入力してください。パスをする場合はトークンの後にアスタリスクで区切って99を入力してください。入力を終了する場合はシャープを入力してください。');
                    break;
                default:
                    throw new RedirectError('予期しない番号が入力されました。入力し直してください。');
            }
            return response.toString();
        } catch (err) {
            if (err.name == 'RedirectError') {
                response.say(sayParams, err.message);
                response.redirect({method: 'POST'}, '/games/title/');
                return response.toString();
            } else {
                throw err;
            }
        }
    }
    /**
     * ゲーム参加
     **/
    async entry(body) {
        const response = new VoiceResponse();
        try {
            if (!('Digits' in body) || body.Digits == '') {
                throw new RedirectError('トークンが入力されていません。入力し直してください。');
            }
            const token = body.Digits;
            const caller = body.Caller;
            this.game = new Game(this.db);
            await this.game.init(token);
            // 既に登録済みの電話番号は登録させない
            if (caller == this.game.playerOdd || caller == this.game.playerEven) {
                throw new HangupError('既に登録されている電話番号です。別の電話からかけ直してください。通話を終了します。');
            }
            if (this.game.playerOdd == '') {
                // playerOddの設定
                this.game.playerOdd = caller;
                response.say(sayParams,'プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。');
            } else if (this.game.playerEven == '') {
                // playerEvenの設定
                this.game.playerEven = caller;
                response.say(sayParams, 'プレイヤー登録を受け付けました。あなたは後手、白プレイヤーです。');
            } else {
                throw new HangupError('既に他のプレイヤーがゲーム中です。ゲームに参加できません。通話を終了します。');
            }
            // プレイヤーが揃ったか判定
            if (this.game.playerEven != '' && this.game.playerOdd != '') {
                // プレイヤーが揃ったのでゲーム開始
                response.say(sayParams,'対戦相手が揃ったので、ゲームを開始します。メッセージを送信するのでお待ち下さい。通話を終了します。');
                // TODO 相手プレイヤー（先手playerOdd）にSMSでプロンプトを送信
                this.sms.send(this.game.playerOdd, this.game.toPrepared());
            } else {
                // 対戦相手の登録待ち
                response.say(sayParams, '対戦相手が登録するまでお待ち下さい。通話を終了します。');
            }
            response.hangup();
            // ゲームデータの保存
            await this.game.saveGame();
            return response.toString();
        } catch (err) {
            if (err.name == 'RedirectError') {
                response.say(sayParams, err.message);
                response.redirect({method: 'POST'}, '/games/title/');
                return response.toString();
            } else if (err.name == 'HangupError') {
                response.say(sayParams, err.message);
                response.hangup();
                return response.toString();
            } else {
                throw err;
            }
        }
    }
    /**
     * ターン処理
     **/
    async turn(body) {
        const response = new VoiceResponse();
        try {
            // 入力データのフォーマットチェック
            if (!('Digits' in body)) {
                throw new RedirectError('入力が正しくありません。入力し直してください。');
            }
            // Digitsに値が入力された場合
            // アスタリスクで分割
            const digits = body.Digits.split('*');
            const caller = body.Caller;
            this.game = new Game(this.db);
            if (digits.length < 2) {
                throw new RedirectError('入力が正しくありません。入力し直してください。');
            }
            // ゲームトークンでゲームデータの存在チェック
            const token = digits[0];
            const location = digits[1];
            if (location.length < 2) {
                throw new RedirectError('石を置く座標の指定に誤りがあります。座標は二桁の数字で指定してください。入力をやり直してください。');
            }
            await this.game.init(token);
            const row = Number(location.charAt(0));
            const col = Number(location.charAt(1));
            // プレイヤーチェック
            if (!this.game.isValidPlayer(caller)) {
                throw new HangupError('あなたの手番ではありません。対戦相手の入力をお待ち下さい。');
            }
            // 石を置ける場所かチェック
            if (!this.game.isAvailableCell(row, col)) {
                throw new RedirectError('石を置けない場所です。入力をやり直してください。');
            }
            // 石をおいてターン処理
            this.game.handleTurn(row, col);
            if ((row < 0 || row > 7) || (col < 0 || col > 7)) {
                response.say(sayParams,'パスしました。');
            } else {
                response.say(sayParams,'入力を受け付けました。対戦相手の反応をお待ちください。');
            }
            // 終了しているか判定
            if (this.game.isFinish()) {
                response.say(sayParams,'ゲームが終了しました。通話を終了します。');
                // TODO 両プレイヤーにSMSでゲームの結果を送信
                this.sms.send(this.game.playerOdd, this.game.toPrepared());
                this.sms.send(this.game.playerEven, this.game.toPrepared());
            } else {
                response.say(sayParams,'通話を終了します。');
                // 相手プレイヤーにSMSでプロンプトを送信
                const to = (this.game.turn % 2 == 0) ? this.game.playerEven : this.game.playerOdd;
                this.sms.send(to, this.game.toPrepared());
            }
            // ゲームデータの保存
            await this.game.saveGame();
            response.hangup();
            return response.toString();
        } catch (err) {
            if (err.name == 'RedirectError') {
                response.say(sayParams, err.message);
                response.redirect({method: 'POST'}, '/games/title/');
                return response.toString();
            } else if (err.name == 'HangupError') {
                response.say(sayParams, err.message);
                response.hangup();
                return response.toString();
            } else {
                throw err;
            }
        }
    }
}