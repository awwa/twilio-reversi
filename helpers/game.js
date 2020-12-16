require('dotenv').config();
const RedirectError = require('./redirect_error');
module.exports = class Game{
    // コンストラクタ
    constructor(db) {
        this.COL          = 'games';
        this.UP           = {delta_row: -1, delta_col: 0}
        this.UP_RIGHT     = {delta_row: -1, delta_col: 1}
        this.RIGHT        = {delta_row: 0, delta_col: 1}
        this.DOWN_RIGHT   = {delta_row: 1, delta_col: 1}
        this.DOWN         = {delta_row: 1, delta_col: 0}
        this.DOWN_LEFT    = {delta_row: 1, delta_col:-1}
        this.LEFT         = {delta_row: 0, delta_col:-1}
        this.UP_LEFT      = {delta_row: -1, delta_col:-1}
        this.db = db;
    }
    // 初期化：tokenを指定しない場合、DBを参照して一意なtokenを生成する
    //     0 1 2 3 4 5 6 7
    //   0
    //   1
    //   2
    //   3       w b
    //   4       b w
    //   5
    //   6
    //   7
    async init(t = null) {
        const col = this.db.collection(this.COL);
        if (t == null) {
            // トークンを指定しない場合
            while (true) {
                // トークンをランダム生成
                t = Math.floor( Math.random() * 10000 );
                const docs = await col.find({token: t}).limit(1).toArray();
                // トークンがかぶったらやり直し
                if (docs.length > 0) {
                    continue;
                }
                // 一意なトークンが生成できたら初期化
                this.token = String(t);
                this.board = new Array(8);
                for(let i = 0; i < this.board.length; i++) {
                  this.board[i] = new Array(8).fill(null);
                }
                this.player_even = '';
                this.player_odd = '';
                this.turn = 1;
                this.board[3][3] = 'w';
                this.board[3][4] = 'b';
                this.board[4][3] = 'b';
                this.board[4][4] = 'w';
                this.history = [];
                break;
            }
        } else {
            // トークンを指定した場合
            const docs = await col.find({token: t}).limit(1).toArray();
            if (docs.length > 0) {
                const d = docs[0];
                this.token = d.token;
                this.player_even = d.player_even;
                this.player_odd = d.player_odd;
                this.turn = d.turn;
                this.board = d.board;
                this.history = d.history;
            } else {
                throw new RedirectError('トークンが存在しません。入力をやり直してください。');
            }
        }
    }
    // DBに保存
    async saveGame() {
        const col = this.db.collection(this.COL);
        return col.updateOne(
            {
                token: this.token
            },
            {
                $set: {
                    player_even: this.player_even,
                    player_odd: this.player_odd,
                    turn: this.turn,
                    board: this.board,
                    history: this.history,
                }
            },
            {
                upsert: true
            }
        );
    }
    // tokenを返す
    get getToken() {
        return this.token;
    }
    // SMS送信用メッセージの構築
    // Turn 1.
    // You are b.
    // Call to #NUMBER
    //     0 1 2 3 4 5 6 7
    //   0
    //   1
    //   2       *
    //   3     * w b
    //   4       b w *
    //   5         *
    //   6
    //   7
    toPrepared() {
        // Deep copy
        this.prepBoard = JSON.parse(JSON.stringify(this.board));
        // From null to '*' if it isAvailable()
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // only null cell
                if (this.board[row][col] == null) {
                    if (this.isAvailableCell(row, col)) {
                        this.prepBoard[row][col] = "*";
                    } else {
                        this.prepBoard[row][col] = ' ';
                    }
                }
            }
        }
        const color = (this.turn % 2 == 0) ? 'w' : 'b';
        const message = 
            'Twilio-Reversi\n' +
            `Trun ${this.turn}.\n` +
            `You are ${color}.\n` +
            `Call to ${process.env.NUMBER}.\n` +
            '    0 1 2 3 4 5 6 7\n' +
            `  0 ${this.prepBoard[0].join(' ')}\n` +
            `  1 ${this.prepBoard[1].join(' ')}\n` +
            `  2 ${this.prepBoard[2].join(' ')}\n` +
            `  3 ${this.prepBoard[3].join(' ')}\n` +
            `  4 ${this.prepBoard[4].join(' ')}\n` +
            `  5 ${this.prepBoard[5].join(' ')}\n` +
            `  6 ${this.prepBoard[6].join(' ')}\n` +
            `  7 ${this.prepBoard[7].join(' ')}\n`;
        return message;
    }
    // 適切なプレイヤーかチェック
    isValidPlayer(player) {
        const expectedPlayer = (this.turn % 2 == 0) ? this.playerEven : this.playerOdd;
        return (expectedPlayer == player);
    }

    isAvailableCell(row, col) {
        if ((row < 0 || row > 7) || (col < 0 || col > 7)) {return true;}
        if (this.isAvailableDir(row, col, this.UP)) { return true; }
        if (this.isAvailableDir(row, col, this.UP_RIGHT)) { return true; }
        if (this.isAvailableDir(row, col, this.RIGHT)) { return true; }
        if (this.isAvailableDir(row, col, this.DOWN_RIGHT)) { return true; }
        if (this.isAvailableDir(row, col, this.DOWN)) { return true; }
        if (this.isAvailableDir(row, col, this.DOWN_LEFT)) { return true; }
        if (this.isAvailableDir(row, col, this.LEFT)) { return true; }
        if (this.isAvailableDir(row, col, this.UP_LEFT)) { return true; }
        return false;
    }
    
    isAvailableDir(st_row, st_col, dir) {
        // # even is white. odd is black.
        const disc = (this.turn % 2 == 0) ? 'w' : 'b';
        var has_possible = false;
        var i = 0;
        do {
            //   # move target cell
            i += 1;
            var tg_row = st_row + dir.delta_row * i;
            var tg_col = st_col + dir.delta_col * i;
        
            if (tg_row < 0) break;
            if (tg_col < 0) break;
            if (tg_row > 7) break;
            if (tg_col > 7) break;
        
            //   # unavailable if neighbor cell is nil
            if (this.board[tg_row][tg_col] == null) return false;
        
            if (has_possible == true) {
                // # available if it can be between
                if (this.board[tg_row][tg_col] == disc) return true;
            } else {
                // # unavailable if neighbor is same color
                if (this.board[tg_row][tg_col] == disc) return false;
                // # possible if neighbor is not same color. go next loop.
                has_possible = true;
                continue;
            }
            // # until end of board
        } while (tg_row <= 7 && tg_row >= 0 && tg_col <= 7 && tg_col >= 0)
        // # finish the check
        return false;
    }

    handleTurn(row, col) {
        // even is white. odd is black.
        const disc = (this.turn % 2 == 0) ? 'w' : 'b';
        // process the game if valid cell
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
            this.board[row][col] = disc;
            this.reverse(row, col, disc);
            this.history.push(`${disc}_${row}_${col}`);
        } else {
            this.history.push('pass');
        }
        this.turn += 1;
    } 

    isFinish() {
        // finish if 2 passes continue
        if (this.history.length > 1) {
            const last = this.history.slice(-2);
            if (last[0] == 'pass' && last[1] == 'pass') return true;
        }
        // no place
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] == null) return false;
            }
        }
        return true;
    }

    reverse(row, col, disc) {
        if (this.isAvailableDir(row, col, this.UP))          this.reverseDir(row, col, disc, this.UP);
        if (this.isAvailableDir(row, col, this.UP_RIGHT))    this.reverseDir(row, col, disc, this.UP_RIGHT)   
        if (this.isAvailableDir(row, col, this.RIGHT))       this.reverseDir(row, col, disc, this.RIGHT)      
        if (this.isAvailableDir(row, col, this.DOWN_RIGHT))  this.reverseDir(row, col, disc, this.DOWN_RIGHT)
        if (this.isAvailableDir(row, col, this.DOWN))        this.reverseDir(row, col, disc, this.DOWN)       
        if (this.isAvailableDir(row, col, this.DOWN_LEFT))   this.reverseDir(row, col, disc, this.DOWN_LEFT)  
        if (this.isAvailableDir(row, col, this.LEFT))        this.reverseDir(row, col, disc, this.LEFT)       
        if (this.isAvailableDir(row, col, this.UP_LEFT))     this.reverseDir(row, col, disc, this.UP_LEFT)    
    }

    reverseDir(st_row, st_col, disc, dir) {
        let i = 0
        let tg_row = 0;
        let tg_col = 0;
        do {
            // # move target cell
            i += 1
            tg_row = st_row + dir.delta_row * i;
            tg_col = st_col + dir.delta_col * i;
            
            if (tg_row < 0) break;
            if (tg_col < 0) break;
            if (tg_row > 7) break;
            if (tg_col > 7) break;
            if (this.board[tg_row][tg_col] == disc) break;
            
            this.board[tg_row][tg_col] = disc;
            
            // # until end of board
        } while (tg_row <= 7 && tg_row >= 0 && tg_col <= 7 && tg_col >= 0)
    }

    getCount() {
        let count_b = 0;
        let count_w = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] == 'b') {
                    count_b += 1;
                }
                if (this.board[row][col] == 'w') {
                    count_w += 1;
                }
            }
        }
        return {b: count_b, w: count_w};
    }
    get playerOdd() {
        return this.player_odd;
    }
    set playerOdd(player_odd) {
        this.player_odd = player_odd;
    }
    get playerEven() {
        return this.player_even;
    }
    set playerEven(player_even) {
        this.player_even = player_even;
    }
    setBoard(row, col, disc) {
        this.board[row][col] = disc;
    }
}
