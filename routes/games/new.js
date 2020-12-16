var express = require('express');
var router = express.Router();
const Game = require('../../helpers/game');

/* GET users listing. */
router.get('/', async function(req, res, next) {
    try {
        const db = req.app.locals.db;
        const game = new Game(db);
        await game.init();
        const token = game.getToken;
        await game.saveGame();
        // 画面に電話番号とゲームトークンを表示
        res.render('new_game', { title: process.env.NUMBER, token: token });
    } catch (err) {
        console.error(err);
        res.render('error', {error: err});
    }
});

module.exports = router;
