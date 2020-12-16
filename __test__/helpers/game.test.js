const Game = require('../../helpers/game.js');
require('dotenv').config();

describe('game', () => {
    var db;
    var client;
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
    });
    describe('init()', () => {
        test('no token specified', async () => {
            const game = new Game(db);
            await game.init();
            expect(game.token).not.toBeNull();
            expect(game.playerEven).toEqual('');
            expect(game.playerOdd).toEqual('');
            expect(game.turn).toEqual(1);
            expect(game.board.length).toEqual(8);
            expect(game.board[0][0]).toBeNull();
            expect(game.board[7][7]).toBeNull();
            expect(game.board[3][3]).toEqual('w');
            expect(game.board[3][4]).toEqual('b');
            expect(game.board[4][3]).toEqual('b');
            expect(game.board[4][4]).toEqual('w');
            expect(game.board[0].length).toEqual(8);
            expect(game.history.length).toEqual(0);
        });
        test('exist token specified', async () => {
            const game = new Game(db);
            // TODO Add test for specify exist token
            // await expect(game.init('99999999')).rejects.toThrow();
        });
        test('no exist token specified', async () => {
            const game = new Game(db);
            await expect(game.init('99999999')).rejects.toThrow();
        });
    });
    // describe('getPlayerEven()', () => {
    //     test('no token specified', async () => {
    //         const game = new Game(db);
    //         await game.init();
    //         game.playerEven = 'playereven';
    //         game.playerOdd = 'playerodd';
    //         const playerEven = game.playerEven;
    //         const playerOdd = game.playerOdd
    //         expect(playerEven).toEqual('playereven');
    //         expect(playerOdd).toEqual('playerodd');
    //     });
    // });
    describe('toPrepared()', () => {
        test('on init', async () => {
            const game = new Game(db);
            await game.init();
            expect(game.turn).toEqual(1);
            expect(game.toPrepared()).toEqual(
                'Twilio-Reversi\n' +
                `Trun 1.\n` +
                `You are b.\n` +
                `Call to ${process.env.NUMBER}.\n` +
                '    0 1 2 3 4 5 6 7\n' +
                `  0                \n` +
                `  1                \n` +
                `  2       *        \n` +
                `  3     * w b      \n` +
                `  4       b w *    \n` +
                `  5         *      \n` +
                `  6                \n` +
                `  7                \n`
            );
            // Turn 2
            game.handleTurn(2, 3);
            expect(game.turn).toEqual(2);
            expect(game.toPrepared()).toEqual(
                'Twilio-Reversi\n' +
                `Trun 2.\n` +
                `You are w.\n` +
                `Call to ${process.env.NUMBER}.\n` +
                '    0 1 2 3 4 5 6 7\n' +
                `  0                \n` +
                `  1                \n` +
                `  2     * b *      \n` +
                `  3       b b      \n` +
                `  4     * b w      \n` +
                `  5                \n` +
                `  6                \n` +
                `  7                \n`
            );
            // Turn 3
            game.handleTurn(2, 2);
            expect(game.turn).toEqual(3);
            expect(game.toPrepared()).toEqual(
                'Twilio-Reversi\n' +
                `Trun 3.\n` +
                `You are b.\n` +
                `Call to ${process.env.NUMBER}.\n` +
                '    0 1 2 3 4 5 6 7\n' +
                `  0                \n` +
                `  1                \n` +
                `  2   * w b        \n` +
                `  3     * w b      \n` +
                `  4       b w *    \n` +
                `  5         *      \n` +
                `  6                \n` +
                `  7                \n`
            );
        });
    });
    describe('isAvailableDir()', () => {
        //   0 1 2 3 4 5 6 7
        // 0 w b *
        // 1
        // 2
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate available 1', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 100;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 0, col = 2;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(true);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });
        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2       *
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate unavailable 1', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 100;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 2, col = 3;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });
        
        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2         *
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate available 2', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 100;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 2, col = 4;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(true);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });

        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2           *
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate unavailable 2', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 100;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 2, col = 5;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });

        //   0 1 2 3 4 5 6 7
        // 0 w b *
        // 1
        // 2
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate unavailable 3', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 101;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 0, col = 2;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });
        
        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2       *
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate available 3', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 101;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 2, col = 3;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(true);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });
        
        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2         *
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate unavailable 4', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 101;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 2, col = 4;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });

        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2           *
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate unavailable 5', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 101;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            const row = 2, col = 5;
            expect(game.isAvailableDir(row, col, game.UP)           ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_RIGHT)     ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.RIGHT)        ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_RIGHT)   ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.DOWN_LEFT)    ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.LEFT)         ).toEqual(false);
            expect(game.isAvailableDir(row, col, game.UP_LEFT)      ).toEqual(false);
        });
    });
    describe('isValidPlayer()', () => {
        test('valid player', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 1;
            game.playerOdd = 'p1';
            game.playerEven = 'p2';
            expect(game.isValidPlayer('p1')).toEqual(true);
            expect(game.isValidPlayer('p2')).toEqual(false);
        }) ;
        test('invalid player', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 2;
            game.playerOdd = 'p1';
            game.playerEven = 'p2';
            expect(game.isValidPlayer('p1')).toEqual(false);
            expect(game.isValidPlayer('p2')).toEqual(true);
        }) ;
    });
    describe('isAvailableCell()', () => {
        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate available for black 1', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 100;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            
            expect(game.isAvailableCell(0, 2)).toEqual(true);
            expect(game.isAvailableCell(0, 3)).toEqual(false);
            expect(game.isAvailableCell(0, 4)).toEqual(false);
            expect(game.isAvailableCell(0, 5)).toEqual(false);
            expect(game.isAvailableCell(0, 6)).toEqual(false);
            expect(game.isAvailableCell(0, 7)).toEqual(false);
            
            expect(game.isAvailableCell(1, 0)).toEqual(false);
            expect(game.isAvailableCell(1, 1)).toEqual(false);
            expect(game.isAvailableCell(1, 2)).toEqual(false);
            expect(game.isAvailableCell(1, 3)).toEqual(false);
            expect(game.isAvailableCell(1, 4)).toEqual(false);
            expect(game.isAvailableCell(1, 5)).toEqual(false);
            expect(game.isAvailableCell(1, 6)).toEqual(false);
            expect(game.isAvailableCell(1, 7)).toEqual(false);
            
            expect(game.isAvailableCell(2, 0)).toEqual(false);
            expect(game.isAvailableCell(2, 1)).toEqual(false);
            expect(game.isAvailableCell(2, 2)).toEqual(false);
            expect(game.isAvailableCell(2, 3)).toEqual(false);
            expect(game.isAvailableCell(2, 4)).toEqual(true);
            expect(game.isAvailableCell(2, 5)).toEqual(false);
            expect(game.isAvailableCell(2, 6)).toEqual(false);
            expect(game.isAvailableCell(2, 7)).toEqual(false);
            
            expect(game.isAvailableCell(3, 0)).toEqual(false);
            expect(game.isAvailableCell(3, 1)).toEqual(false);
            expect(game.isAvailableCell(3, 2)).toEqual(false);
            // expect(game.isAvailableCell(3, 3)).toEqual(false);
            // expect(game.isAvailableCell(3, 4)).toEqual(true);
            expect(game.isAvailableCell(3, 5)).toEqual(true);
            expect(game.isAvailableCell(3, 6)).toEqual(false);
            expect(game.isAvailableCell(3, 7)).toEqual(false);
            
            expect(game.isAvailableCell(4, 0)).toEqual(false);
            expect(game.isAvailableCell(4, 1)).toEqual(false);
            expect(game.isAvailableCell(4, 2)).toEqual(true);
            // #expect(game.isAvailableCell(4, 3)).toEqual(false);
            // #expect(game.isAvailableCell(4, 4)).toEqual(true);
            expect(game.isAvailableCell(4, 5)).toEqual(false);
            expect(game.isAvailableCell(4, 6)).toEqual(false);
            expect(game.isAvailableCell(4, 7)).toEqual(false);
            
            expect(game.isAvailableCell(5, 0)).toEqual(false);
            expect(game.isAvailableCell(5, 1)).toEqual(false);
            expect(game.isAvailableCell(5, 2)).toEqual(false);
            expect(game.isAvailableCell(5, 3)).toEqual(true);
            expect(game.isAvailableCell(5, 4)).toEqual(false);
            expect(game.isAvailableCell(5, 5)).toEqual(false);
            expect(game.isAvailableCell(5, 6)).toEqual(false);
            expect(game.isAvailableCell(5, 7)).toEqual(false);
            
            expect(game.isAvailableCell(6, 0)).toEqual(false);
            expect(game.isAvailableCell(6, 1)).toEqual(false);
            expect(game.isAvailableCell(6, 2)).toEqual(false);
            expect(game.isAvailableCell(6, 3)).toEqual(false);
            expect(game.isAvailableCell(6, 4)).toEqual(false);
            expect(game.isAvailableCell(6, 5)).toEqual(false);
            expect(game.isAvailableCell(6, 6)).toEqual(false);
            expect(game.isAvailableCell(6, 7)).toEqual(false);
            
            expect(game.isAvailableCell(7, 0)).toEqual(false);
            expect(game.isAvailableCell(7, 1)).toEqual(false);
            expect(game.isAvailableCell(7, 2)).toEqual(false);
            expect(game.isAvailableCell(7, 3)).toEqual(false);
            expect(game.isAvailableCell(7, 4)).toEqual(false);
            expect(game.isAvailableCell(7, 5)).toEqual(false);
            expect(game.isAvailableCell(7, 6)).toEqual(false);
            expect(game.isAvailableCell(7, 7)).toEqual(false);
        });

        //   0 1 2 3 4 5 6 7
        // 0 w b
        // 1
        // 2
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate available for black 1', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 101;
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');

            expect(game.isAvailableCell(0, 2)).toEqual(false);
            expect(game.isAvailableCell(0, 3)).toEqual(false);
            expect(game.isAvailableCell(0, 4)).toEqual(false);
            expect(game.isAvailableCell(0, 5)).toEqual(false);
            expect(game.isAvailableCell(0, 6)).toEqual(false);
            expect(game.isAvailableCell(0, 7)).toEqual(false);
            
            expect(game.isAvailableCell(1, 0)).toEqual(false);
            expect(game.isAvailableCell(1, 1)).toEqual(false);
            expect(game.isAvailableCell(1, 2)).toEqual(false);
            expect(game.isAvailableCell(1, 3)).toEqual(false);
            expect(game.isAvailableCell(1, 4)).toEqual(false);
            expect(game.isAvailableCell(1, 5)).toEqual(false);
            expect(game.isAvailableCell(1, 6)).toEqual(false);
            expect(game.isAvailableCell(1, 7)).toEqual(false);
            
            expect(game.isAvailableCell(2, 0)).toEqual(false);
            expect(game.isAvailableCell(2, 1)).toEqual(false);
            expect(game.isAvailableCell(2, 2)).toEqual(false);
            expect(game.isAvailableCell(2, 3)).toEqual(true);
            expect(game.isAvailableCell(2, 4)).toEqual(false);
            expect(game.isAvailableCell(2, 5)).toEqual(false);
            expect(game.isAvailableCell(2, 6)).toEqual(false);
            expect(game.isAvailableCell(2, 7)).toEqual(false);
            
            expect(game.isAvailableCell(3, 0)).toEqual(false);
            expect(game.isAvailableCell(3, 1)).toEqual(false);
            expect(game.isAvailableCell(3, 2)).toEqual(true);
            // eexpect(game.isAvailableCell(3, 3)).toEqual(false);
            // eexpect(game.isAvailableCell(3, 4)).toEqual(true);
            expect(game.isAvailableCell(3, 5)).toEqual(false);
            expect(game.isAvailableCell(3, 6)).toEqual(false);
            expect(game.isAvailableCell(3, 7)).toEqual(false);
            
            expect(game.isAvailableCell(4, 0)).toEqual(false);
            expect(game.isAvailableCell(4, 1)).toEqual(false);
            expect(game.isAvailableCell(4, 2)).toEqual(false);
            // eexpect(game.isAvailableCell(4, 3)).toEqual(false);
            // expect(game.isAvailableCell(4, 4)).toEqual(true);
            expect(game.isAvailableCell(4, 5)).toEqual(true);
            expect(game.isAvailableCell(4, 6)).toEqual(false);
            expect(game.isAvailableCell(4, 7)).toEqual(false);
            
            expect(game.isAvailableCell(5, 0)).toEqual(false);
            expect(game.isAvailableCell(5, 1)).toEqual(false);
            expect(game.isAvailableCell(5, 2)).toEqual(false);
            expect(game.isAvailableCell(5, 3)).toEqual(false);
            expect(game.isAvailableCell(5, 4)).toEqual(true);
            expect(game.isAvailableCell(5, 5)).toEqual(false);
            expect(game.isAvailableCell(5, 6)).toEqual(false);
            expect(game.isAvailableCell(5, 7)).toEqual(false);
            
            expect(game.isAvailableCell(6, 0)).toEqual(false);
            expect(game.isAvailableCell(6, 1)).toEqual(false);
            expect(game.isAvailableCell(6, 2)).toEqual(false);
            expect(game.isAvailableCell(6, 3)).toEqual(false);
            expect(game.isAvailableCell(6, 4)).toEqual(false);
            expect(game.isAvailableCell(6, 5)).toEqual(false);
            expect(game.isAvailableCell(6, 6)).toEqual(false);
            expect(game.isAvailableCell(6, 7)).toEqual(false);

            expect(game.isAvailableCell(7, 0)).toEqual(false);
            expect(game.isAvailableCell(7, 1)).toEqual(false);
            expect(game.isAvailableCell(7, 2)).toEqual(false);
            expect(game.isAvailableCell(7, 3)).toEqual(false);
            expect(game.isAvailableCell(7, 4)).toEqual(false);
            expect(game.isAvailableCell(7, 5)).toEqual(false);
            expect(game.isAvailableCell(7, 6)).toEqual(false);
            expect(game.isAvailableCell(7, 7)).toEqual(false);
        });
        //   0 1 2 3 4 5 6 7
        // 0
        // 1
        // 2           w
        // 3       w b
        // 4       b w
        // 5
        // 6
        // 7
        test('Validate available for black 2', async () => {
            const game = new Game(db);
            await game.init();
            game.turn = 100;
            game.setBoard(2, 5, 'w');
            expect(game.isAvailableCell(5, 2)).toEqual(true);
        });
    });
    describe('handleTurn', () => {
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
        test('Validate handle turn', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            game.handleTurn(2, 3);
            
            expect(game.turn).toEqual(2);
            expect(game.board[2][2]).toEqual(null);
            expect(game.board[2][3]).toEqual('b');
            expect(game.board[2][4]).toEqual(null);
            expect(game.board[2][5]).toEqual(null);
            expect(game.board[3][2]).toEqual(null);
            expect(game.board[3][3]).toEqual('b');
            expect(game.board[3][4]).toEqual('b');
            expect(game.board[3][5]).toEqual(null);
            expect(game.board[4][2]).toEqual(null);
            expect(game.board[4][3]).toEqual('b');
            expect(game.board[4][4]).toEqual('w');
            expect(game.board[4][5]).toEqual(null);
            expect(game.board[5][2]).toEqual(null);
            expect(game.board[5][3]).toEqual(null);
            expect(game.board[5][4]).toEqual(null);
            expect(game.board[5][5]).toEqual(null);
            expect(game.history.length).toEqual(1);
            expect(game.history[0]).toEqual("b_2_3");
        });
        // turn 1 先手（正常系）
        //   0 1 2 3 4 5 6 7
        // 0 b b b b b b b b
        // 1 b w w w w w w b
        // 2 b w w*b w w w b
        // 3 b w w w w w w b
        // 4 b w w w w w w b
        // 5 b w w w w w w b
        // 6 b w w w w w w b
        // 7 b b b b b b b b
        test('Validate handle turn', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            game.board[0][0] = 'b';
            game.board[1][0] = 'b';
            game.board[2][0] = 'b';
            game.board[3][0] = 'b';
            game.board[4][0] = 'b';
            game.board[5][0] = 'b';
            game.board[6][0] = 'b';
            game.board[7][0] = 'b';
            game.board[0][1] = 'b';
            game.board[1][1] = 'w';
            game.board[2][1] = 'w';
            game.board[3][1] = 'w';
            game.board[4][1] = 'w';
            game.board[5][1] = 'w';
            game.board[6][1] = 'w';
            game.board[7][1] = 'b';
            game.board[0][2] = 'b';
            game.board[1][2] = 'w';
            game.board[2][2] = 'w';
            game.board[3][2] = 'w';
            game.board[4][2] = 'w';
            game.board[5][2] = 'w';
            game.board[6][2] = 'w';
            game.board[7][2] = 'b';
            game.board[0][3] = 'b';
            game.board[1][3] = 'w';
            game.board[2][3] = null;
            game.board[3][3] = 'w';
            game.board[4][3] = 'w';
            game.board[5][3] = 'w';
            game.board[6][3] = 'w';
            game.board[7][3] = 'b';
            game.board[0][4] = 'b';
            game.board[1][4] = 'w';
            game.board[2][4] = 'w';
            game.board[3][4] = 'w';
            game.board[4][4] = 'w';
            game.board[5][4] = 'w';
            game.board[6][4] = 'w';
            game.board[7][4] = 'b';
            game.board[0][5] = 'b';
            game.board[1][5] = 'w';
            game.board[2][5] = 'w';
            game.board[3][5] = 'w';
            game.board[4][5] = 'w';
            game.board[5][5] = 'w';
            game.board[6][5] = 'w';
            game.board[7][5] = 'b';
            game.board[0][6] = 'b';
            game.board[1][6] = 'w';
            game.board[2][6] = 'w';
            game.board[3][6] = 'w';
            game.board[4][6] = 'w';
            game.board[5][6] = 'w';
            game.board[6][6] = 'w';
            game.board[7][6] = 'b';
            game.board[0][7] = 'b';
            game.board[1][7] = 'b';
            game.board[2][7] = 'b';
            game.board[3][7] = 'b';
            game.board[4][7] = 'b';
            game.board[5][7] = 'b';
            game.board[6][7] = 'b';
            game.board[7][7] = 'b';

            game.handleTurn(2, 3);
            
            expect(game.turn).toEqual(2);
            expect(game.board[0][0]).toEqual('b');
            expect(game.board[1][0]).toEqual('b');
            expect(game.board[2][0]).toEqual('b');
            expect(game.board[3][0]).toEqual('b');
            expect(game.board[4][0]).toEqual('b');
            expect(game.board[5][0]).toEqual('b');
            expect(game.board[6][0]).toEqual('b');
            expect(game.board[7][0]).toEqual('b');
            expect(game.board[0][1]).toEqual('b');
            expect(game.board[1][1]).toEqual('w');
            expect(game.board[2][1]).toEqual('b');
            expect(game.board[3][1]).toEqual('w');
            expect(game.board[4][1]).toEqual('b');
            expect(game.board[5][1]).toEqual('w');
            expect(game.board[6][1]).toEqual('w');
            expect(game.board[7][1]).toEqual('b');
            expect(game.board[0][2]).toEqual('b');
            expect(game.board[1][2]).toEqual('b');
            expect(game.board[2][2]).toEqual('b');
            expect(game.board[3][2]).toEqual('b');
            expect(game.board[4][2]).toEqual('w');
            expect(game.board[5][2]).toEqual('w');
            expect(game.board[6][2]).toEqual('w');
            expect(game.board[7][2]).toEqual('b');
            expect(game.board[0][3]).toEqual('b');
            expect(game.board[1][3]).toEqual('b');
            expect(game.board[2][3]).toEqual('b');
            expect(game.board[3][3]).toEqual('b');
            expect(game.board[4][3]).toEqual('b');
            expect(game.board[5][3]).toEqual('b');
            expect(game.board[6][3]).toEqual('b');
            expect(game.board[7][3]).toEqual('b');
            expect(game.board[0][4]).toEqual('b');
            expect(game.board[1][4]).toEqual('b');
            expect(game.board[2][4]).toEqual('b');
            expect(game.board[3][4]).toEqual('b');
            expect(game.board[4][4]).toEqual('w');
            expect(game.board[5][4]).toEqual('w');
            expect(game.board[6][4]).toEqual('w');
            expect(game.board[7][4]).toEqual('b');
            expect(game.board[0][5]).toEqual('b');
            expect(game.board[1][5]).toEqual('w');
            expect(game.board[2][5]).toEqual('b');
            expect(game.board[3][5]).toEqual('w');
            expect(game.board[4][5]).toEqual('b');
            expect(game.board[5][5]).toEqual('w');
            expect(game.board[6][5]).toEqual('w');
            expect(game.board[7][5]).toEqual('b');
            expect(game.board[0][6]).toEqual('b');
            expect(game.board[1][6]).toEqual('w');
            expect(game.board[2][6]).toEqual('b');
            expect(game.board[3][6]).toEqual('w');
            expect(game.board[4][6]).toEqual('w');
            expect(game.board[5][6]).toEqual('b');
            expect(game.board[6][6]).toEqual('w');
            expect(game.board[7][6]).toEqual('b');
            expect(game.board[0][7]).toEqual('b');
            expect(game.board[1][7]).toEqual('b');
            expect(game.board[2][7]).toEqual('b');
            expect(game.board[3][7]).toEqual('b');
            expect(game.board[4][7]).toEqual('b');
            expect(game.board[5][7]).toEqual('b');
            expect(game.board[6][7]).toEqual('b');
            expect(game.board[7][7]).toEqual('b');
            expect(game.history.length).toEqual(1);
            expect(game.history[0]).toEqual("b_2_3");
        });
    });

    describe('reverse', () => {
        //   0 1 2 3 4 5 6 7
        // 0 b b b b b b b b
        // 1 b w w w w w w w
        // 2 w w w w w w w b
        // 3 w w w w w w w w
        // 4 w w w w w w w w
        // 5 b w w w*b w w b
        // 6 w w w w w w w w
        // 7 w w b w b w b w
        test('Validate reverse(Up)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1
            // 初期化
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    game.board[i][j] = 'w';
                }
            }
            for (let j = 0; j < 8; j++) {
                game.board[0][j] = 'b';
            }
            game.board[1][0] = 'b';
            game.board[2][7] = 'b';
            game.board[5][0] = 'b';
            game.board[5][4] = 'b';
            game.board[5][7] = 'b';
            game.board[7][2] = 'b';
            game.board[7][4] = 'b';
            game.board[7][6] = 'b';
            
            // ひっくり返す
            game.reverse(5, 4, 'b');
            
            // 上
            expect(game.board[0][4]).toEqual('b');
            expect(game.board[1][4]).toEqual('b');
            expect(game.board[2][4]).toEqual('b');
            expect(game.board[3][4]).toEqual('b');
            expect(game.board[4][4]).toEqual('b');
            // 置いた場所
            expect(game.board[5][4]).toEqual('b');
            // 右上
            expect(game.board[4][5]).toEqual('b');
            expect(game.board[3][6]).toEqual('b');
            expect(game.board[2][7]).toEqual('b');
            // 右
            expect(game.board[5][5]).toEqual('b');
            expect(game.board[5][6]).toEqual('b');
            expect(game.board[5][7]).toEqual('b');
            // 右下
            expect(game.board[6][5]).toEqual('b');
            expect(game.board[7][6]).toEqual('b');
            // 下
            expect(game.board[6][4]).toEqual('b');
            expect(game.board[7][4]).toEqual('b');
            // 左下
            expect(game.board[6][3]).toEqual('b');
            expect(game.board[7][2]).toEqual('b');
            // 左
            expect(game.board[5][0]).toEqual('b');
            expect(game.board[5][1]).toEqual('b');
            expect(game.board[5][2]).toEqual('b');
            expect(game.board[5][3]).toEqual('b');
            // 左上
            expect(game.board[4][3]).toEqual('b');
            expect(game.board[3][2]).toEqual('b');
            expect(game.board[2][1]).toEqual('b');
            expect(game.board[1][0]).toEqual('b');
        });
    });
    
    describe ('reverse_dir', () => {
        //   0 1 2 3 4 5 6 7
        // 0
        // 1
        // 2
        // 3       w b
        // 4       b w
        // 5        *b
        // 6
        // 7
        test('Validate reverse(Up)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            game.setBoard(5, 4, 'b');
            game.reverseDir( 5, 4, 'b', game.UP);
            
            expect(game.board[0][4]).toEqual(null);
            expect(game.board[1][4]).toEqual(null);
            expect(game.board[2][4]).toEqual(null);
            expect(game.board[3][4]).toEqual('b');
            expect(game.board[4][4]).toEqual('b');
            expect(game.board[5][4]).toEqual('b');
            expect(game.board[6][4]).toEqual(null);
            expect(game.board[7][4]).toEqual(null);
        });
        
        //   0 1 2 3 4 5 6 7
        // 0         b
        // 1         w
        // 2         w
        // 3       w w
        // 4       b w
        // 5        *b
        // 6
        // 7
        test('Validate reverse(no Up)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            game.setBoard(0,4,'b');
            game.setBoard(1,4,'w');
            game.setBoard(2,4,'w');
            game.setBoard(3,4,'w');
            game.setBoard(4,4,'w');
            game.setBoard(5,4,'b');
            game.reverseDir( 5, 4, 'b', game.UP);
            
            expect(game.board[0][4]).toEqual('b');
            expect(game.board[1][4]).toEqual('b');
            expect(game.board[2][4]).toEqual('b');
            expect(game.board[3][4]).toEqual('b');
            expect(game.board[4][4]).toEqual('b');
            expect(game.board[5][4]).toEqual('b');
            expect(game.board[6][4]).toEqual(null);
            expect(game.board[7][4]).toEqual(null);
        });
    });

    describe('isFinish', () => {
        it('Validate finish the game(no finish)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            expect(game.isFinish()).toEqual(false);
        });
        it('Validate finish the game(1 time pass)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            game.history.push("pass");
            expect(game.isFinish()).toEqual(false);
        });
        it('Validate finish the game(2 continuous pass)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 1;
            game.history.push("pass");
            game.history.push("pass");
          expect(game.isFinish()).toEqual(true);
        });
        it('Validate finish the game(all cell was filled)', async () => {
            const game = new Game(db);
            await game.init();
            game.playerEven = "+81123456789";
            game.playerOdd = "+81987654321";
            game.turn = 2;
            for (let row = 0; row < 8; row++) {
                for (let col =0; col < 8; col++) {
                    game.board[row][col] = 'w';
                }
            }
            expect(game.isFinish()).toEqual(true);
        });
    });

    describe('getCount', () => {
        test('Validate number of discs', async () => {
            const game = new Game(db);
            await game.init();
            game.setBoard(0, 0, 'w');
            game.setBoard(0, 1, 'b');
            expect(game.getCount().b).toEqual(3);
            expect(game.getCount().w).toEqual(3);
        });
    });
    afterEach(async () => {
        client.close();
    });
});