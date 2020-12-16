var express = require('express');
var router = express.Router();
const GameController = require('../../helpers/game_controller');

/* POST home page. */
router.post('/', async function(req, res, next) {
    console.log(req);
    // 入力 req.body.Caller
    const db = req.app.locals.db;
    const gameController = new GameController(db);
    res.type('application/xml');
    res.send(gameController.menu(req.body));
});

module.exports = router;
