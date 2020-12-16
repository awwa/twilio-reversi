const GameController = require('../../helpers/game_controller');
const Game = require('../../helpers/game');
require('dotenv').config();

describe('game_controller', () => {
    let db;
    let client;
    let gameController;
    const playerOdd = '+81999999999'
    const playerEven = '+81000000000';
    beforeEach(async () => {
        const MongoClient = require('mongodb').MongoClient;
        const assert = require('assert');
        /* 接続先URL */
        const url = process.env.MONGO_URL;
        /* データベース名 */
        const dbName = process.env.MONGO_DB;
        /**
         * 追加オプション
         * MongoClient用オプション設定
         */
        const connectOption = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
        client = new MongoClient(url, connectOption);
        await client.connect();
        db = client.db(dbName);
        // テスト対象インスタンス
        gameController = new GameController(db);
        gameController.sms = jest.fn();
        gameController.sms.send = jest.fn();
    });
    describe('title()', () => {
        test('valid title', () => {
            const twiml = gameController.title();
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Gather action="/games/menu/" method="POST" numDigits="1"><Say voice="woman" language="ja-jp">こんにちはトゥイリオ リバーシへ！ゲームを始めるには1を、参加中のゲームで石を置くには2を押してください。</Say></Gather></Response>');
        }) ;
    });
    describe('menu()', () => {
        test('No Digits', () => {
            const body = {};
            const twiml = gameController.menu(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">メニューが選択されていません。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        }) ;
        test('Empty Digits', () => {
            const body = {'Digits': ''};
            const twiml = gameController.menu(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">予期しない番号が入力されました。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        }) ;
        test('Digits is 1', () => {
            const body = {'Digits': '1'};
            const twiml = gameController.menu(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Gather action="/games/entry/" method="POST" finishOnKey="#"><Say voice="woman" language="ja-jp">ゲームを始めるには画面上に表示されているトークンを入力してください。最後にシャープを入力してください。</Say></Gather></Response>');
        }) ;
        test('Digits is 2', () => {
            const body = {'Digits': '2'};
            const twiml = gameController.menu(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Gather action="/games/turn/" method="POST" finishOnKey="#"><Say voice="woman" language="ja-jp">参加中のゲームで石を置くには、トークンの後にアスタリスクで区切って石を置く行列を二桁の数字で入力してください。パスをする場合はトークンの後にアスタリスクで区切って99を入力してください。入力を終了する場合はシャープを入力してください。</Say></Gather></Response>');
        }) ;
        test('Digits is 99', () => {
            const body = {'Digits': '99'};
            const twiml = gameController.menu(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">予期しない番号が入力されました。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        }) ;
        test('null parameter', () => {
            const body = null;
            expect(() => {gameController.menu(body)}).toThrow();
        }) ;
    });
    describe('entry()', () => {
        test('No Digits', async () => {
            const body = {};
            const twiml = await gameController.entry(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">トークンが入力されていません。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        }) ;
        test('Empty Digits', async () => {
            const body = {'Digits': ''};
            const twiml = await gameController.entry(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">トークンが入力されていません。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        }) ;
        test('Token not found', async () => {
            const body = {'Digits': '99999999', 'Caller': playerOdd};
            const twiml = await gameController.entry(body);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">トークンが存在しません。入力をやり直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        }) ;
        test('Entry playerOdd', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twiml = await gameController.entry(bodyOdd);
            expect(twiml).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が登録するまでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
        }) ;
        test('Entry playerEven', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            expect(twimlOdd).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が登録するまでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            expect(twimlEven).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは後手、白プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が揃ったので、ゲームを開始します。メッセージを送信するのでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
        }) ;
        test('Entry same playerOdd', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd 1         
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd1 = await gameController.entry(bodyOdd);
            expect(twimlOdd1).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が登録するまでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            // Entry playerOdd 2          
            const twimlOdd2 = await gameController.entry(bodyOdd);
            expect(twimlOdd2).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">既に登録されている電話番号です。別の電話からかけ直してください。通話を終了します。</Say><Hangup/></Response>');
        }) ;
        test('Entry same playerEven', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            expect(twimlOdd).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が登録するまでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            // Entry playerEven 1
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven1 = await gameController.entry(bodyEven);
            expect(twimlEven1).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは後手、白プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が揃ったので、ゲームを開始します。メッセージを送信するのでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            // Entry playerEven 2
            const twimlEven2 = await gameController.entry(bodyEven);
            expect(twimlEven2).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">既に登録されている電話番号です。別の電話からかけ直してください。通話を終了します。</Say><Hangup/></Response>');
        }) ;
        test('Entry player3rd ', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            expect(twimlOdd).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が登録するまでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            // Entry playerEven 1
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven1 = await gameController.entry(bodyEven);
            expect(twimlEven1).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは後手、白プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が揃ったので、ゲームを開始します。メッセージを送信するのでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            // Entry player3rd
            const body3rd = {'Digits': token, 'Caller': '+81333333333'};
            const twimlEven2 = await gameController.entry(body3rd);
            expect(twimlEven2).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">既に他のプレイヤーがゲーム中です。ゲームに参加できません。通話を終了します。</Say><Hangup/></Response>');
        }) ;
        test('null parameter', async () => {
            const body = null;
            await expect(gameController.entry(body)).rejects.toThrow();
        });
    });
    describe('turn()', () => {
        test('No Digits', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyTurn = {};
            const twimlTurn = await gameController.turn(bodyTurn);
            expect(twimlTurn).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">入力が正しくありません。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        });
        test('No Asterisk', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyTurn = {'Digits': token, 'Caller': playerOdd};
            const twimlTurn = await gameController.turn(bodyTurn);
            expect(twimlTurn).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">入力が正しくありません。入力し直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        });
        test('Invalid location', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyTurn = {'Digits': `${token}*4`, 'Caller': playerOdd};
            const twimlTurn = await gameController.turn(bodyTurn);
            expect(twimlTurn).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">石を置く座標の指定に誤りがあります。座標は二桁の数字で指定してください。入力をやり直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
        });
        test('Pass', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyTurn = {'Digits': `${token}*48`, 'Caller': playerOdd};
            const twimlTurn = await gameController.turn(bodyTurn);
            expect(twimlTurn).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">パスしました。</Say><Say voice="woman" language="ja-jp">通話を終了します。</Say><Hangup/></Response>');
        });
        test('Double pass', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyPass1 = {'Digits': `${token}*48`, 'Caller': playerOdd};
            const twimlPass1 = await gameController.turn(bodyPass1);
            expect(twimlPass1).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">パスしました。</Say><Say voice="woman" language="ja-jp">通話を終了します。</Say><Hangup/></Response>');
            // Turn
            const bodyPass2 = {'Digits': `${token}*48`, 'Caller': playerEven};
            const twimlPass2 = await gameController.turn(bodyPass2);
            expect(twimlPass2).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">パスしました。</Say><Say voice="woman" language="ja-jp">ゲームが終了しました。通話を終了します。</Say><Hangup/></Response>');
        });
        test('Invalid player playerEven', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyTurn = {'Digits': `${token}*34`, 'Caller': playerEven};
            const twimlTurn = await gameController.turn(bodyTurn);
            expect(twimlTurn).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">あなたの手番ではありません。対戦相手の入力をお待ち下さい。</Say><Hangup/></Response>');

        });
        test('Invalid player playerOdd', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // Entry playerOdd            
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // Entry playerEven
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // Turn
            const bodyTurn1 = {'Digits': `${token}*23`, 'Caller': playerOdd};
            const twimlTurn1 = await gameController.turn(bodyTurn1);
            expect(twimlTurn1).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">入力を受け付けました。対戦相手の反応をお待ちください。</Say><Say voice="woman" language="ja-jp">通話を終了します。</Say><Hangup/></Response>');
            // Turn
            const bodyTurn2 = {'Digits': `${token}*24`, 'Caller': playerOdd};
            const twimlTurn2 = await gameController.turn(bodyTurn2);
            expect(twimlTurn2).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">あなたの手番ではありません。対戦相手の入力をお待ち下さい。</Say><Hangup/></Response>');
        });
        test('Proceed a game', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // 先手の登録
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            expect(twimlOdd).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは先手、黒プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が登録するまでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            expect(gameController.game.turn).toEqual(1);
            // 後手の登録
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            expect(twimlEven).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">プレイヤー登録を受け付けました。あなたは後手、白プレイヤーです。</Say><Say voice="woman" language="ja-jp">対戦相手が揃ったので、ゲームを開始します。メッセージを送信するのでお待ち下さい。通話を終了します。</Say><Hangup/></Response>');
            expect(gameController.game.turn).toEqual(1);
            // turn 1 先手（正常系）
            //   0 1 2 3 4 5 6 7
            // 0
            // 1
            // 2      *b
            // 3       w b
            // 4       b w
            // 5
            // 6
            // 7
            const body1 = {'Digits': `${token}*23`, 'Caller': playerOdd};
            const twiml1 = await gameController.turn(body1);
            expect(twiml1).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">入力を受け付けました。対戦相手の反応をお待ちください。</Say><Say voice="woman" language="ja-jp">通話を終了します。</Say><Hangup/></Response>');
            expect(gameController.game.turn).toEqual(2);
            expect(gameController.game.board[1][3]).toEqual(null);
            expect(gameController.game.board[2][3]).toEqual('b');
            expect(gameController.game.board[2][4]).toEqual(null);
            expect(gameController.game.board[3][3]).toEqual('b');
            expect(gameController.game.board[3][4]).toEqual('b');
            expect(gameController.game.board[4][3]).toEqual('b');
            expect(gameController.game.board[4][4]).toEqual('w');
            // turn 2 後手（正常系）
            //   0 1 2 3 4 5 6 7
            // 0
            // 1
            // 2       b*w
            // 3       b b
            // 4       b w
            // 5
            // 6
            // 7
            const body2 = {'Digits': `${token}*24`, 'Caller': playerEven};
            const twiml2 = await gameController.turn(body2);
            expect(twiml2).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">入力を受け付けました。対戦相手の反応をお待ちください。</Say><Say voice="woman" language="ja-jp">通話を終了します。</Say><Hangup/></Response>');
            expect(gameController.game.turn).toEqual(3);
            expect(gameController.game.board[1][3]).toEqual(null);
            expect(gameController.game.board[2][3]).toEqual('b');
            expect(gameController.game.board[2][4]).toEqual('w');
            expect(gameController.game.board[3][3]).toEqual('b');
            expect(gameController.game.board[3][4]).toEqual('w');
            expect(gameController.game.board[4][3]).toEqual('b');
            expect(gameController.game.board[4][4]).toEqual('w');
            // turn 3 先手（打ち手誤り）
            //   0 1 2 3 4 5 6 7
            // 0
            // 1      *b
            // 2       b w
            // 3       b w
            // 4       b w
            // 5
            // 6
            // 7
            const body3Invalid = {'Digits': `${token}*13`, 'Caller': playerOdd};
            const twiml3Invalid = await gameController.turn(body3Invalid);
            expect(twiml3Invalid).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">石を置けない場所です。入力をやり直してください。</Say><Redirect method="POST">/games/title/</Redirect></Response>');
            expect(gameController.game.turn).toEqual(3);
            expect(gameController.game.board[1][3]).toEqual(null);
            expect(gameController.game.board[2][3]).toEqual('b');
            expect(gameController.game.board[2][4]).toEqual('w');
            expect(gameController.game.board[3][3]).toEqual('b');
            expect(gameController.game.board[3][4]).toEqual('w');
            expect(gameController.game.board[4][3]).toEqual('b');
            expect(gameController.game.board[4][4]).toEqual('w');
            // turn 3 先手
            //   0 1 2 3 4 5 6 7 8
            // 0                
            // 1          *b 
            // 2       b w
            // 3       b w
            // 4       b w
            // 5
            // 6
            // 7
            const body3 = {'Digits': `${token}*15`, 'Caller': playerOdd};
            const twiml3 = await gameController.turn(body3);
            expect(twiml3).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="woman" language="ja-jp">入力を受け付けました。対戦相手の反応をお待ちください。</Say><Say voice="woman" language="ja-jp">通話を終了します。</Say><Hangup/></Response>');
            expect(gameController.game.turn).toEqual(4);
            expect(gameController.game.board[1][3]).toEqual(null);
            expect(gameController.game.board[1][4]).toEqual(null);
            expect(gameController.game.board[1][5]).toEqual('b');
            expect(gameController.game.board[2][3]).toEqual('b');
            expect(gameController.game.board[2][4]).toEqual('b');
            expect(gameController.game.board[3][3]).toEqual('b');
            expect(gameController.game.board[3][4]).toEqual('w');
            expect(gameController.game.board[4][3]).toEqual('b');
            expect(gameController.game.board[4][4]).toEqual('w');
        });
        test('null parameter', async () => {
            const game = new Game(db);
            await game.init();
            const token = game.getToken;
            await game.saveGame();
            // 先手の登録
            const bodyOdd = {'Digits': token, 'Caller': playerOdd};
            const twimlOdd = await gameController.entry(bodyOdd);
            // 後手の登録
            const bodyEven = {'Digits': token, 'Caller': playerEven};
            const twimlEven = await gameController.entry(bodyEven);
            // const twiml1 = await gameController.turn(null);
            await expect(gameController.turn(null)).rejects.toThrow();
        }) ;
    });
    afterEach(async () => {
        client.close();
    });
});