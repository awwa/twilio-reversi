require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gamesNewRouter = require('./routes/games/new'); // 新規ゲーム
var titleRouter = require('./routes/games/title');  // ゲーム参加のための入り口
var menuRouter = require('./routes/games/menu');    // ゲームメニュー
var entryRouter = require('./routes/games/entry');  // ゲームに参加する
var turnRouter = require('./routes/games/turn');    // ターン処理

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/games/new', gamesNewRouter);
app.use('/games/title', titleRouter);
app.use('/games/menu', menuRouter);
app.use('/games/entry', entryRouter);
app.use('/games/turn', turnRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Database
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

/**
 * データベース接続
 * データベース接続用の引数追加
 */
MongoClient.connect(url, connectOption, (err, client) => {
  assert.equal(null, err);
  /* 接続に成功すればコンソールに表示 */
  console.log('Connected successfully to server');
  app.locals.dbClient = client;
  app.locals.db = client.db(dbName);
});

module.exports = app;
