# Twilio Reversi
Twilioでオセロをします。
Twilioの機能を学習するためのサンプルアプリです。

## 概要
Node.js/Express上で動作するWebアプリケーションです。  
Twilioの着信時のWebhookを受信します。  
ゲーム参加者にSMSを送信します。  

## 前提条件

- [Twilioアカウント](https://cloudapi.kddi-web.com/signup)
  - VoiceとSMSが利用できる番号が必要です
- [MongoDB](https://www.mongodb.com/)
- [Node.js](https://nodejs.org/en/)
- [ngrok](https://ngrok.com/)（必要に応じて）

## 環境の準備

### MongoDB

MongoDBをインストールして、以下のコマンドでDBの準備を行います。

```
## MongoDB起動（起動コマンドは環境依存）
$ sudo service mongod start

## mongoコマンド実行
$ mongo

## adminDBを利用
> use admin
switched to db admin

## ユーザーとパスワードとロール(root スーパーユーザー)を追加
> db.createUser({user:"mongo", pwd:"password", roles:["root"]})
Successfully added user: { "user" : "mongo", "roles" : [ "root" ] }

## データベース作成
> use reversi_development
switched to db reversi_development

## コレクション作成
> db.createCollection('games')
{ "ok" : 1 }

## ユニークインデックス作成
> db.games.createIndex({ token: 1 }, { unique: true })
{
  "createdCollectionAutomatically" : false,
  "numIndexesBefore" : 1,
  "numIndexesAfter" : 2,
  "ok" : 1
}

## 準備完了
> exit
```

### アプリケーション

リポジトリからソースコードをクローンして起動します。

```
## Gitでリポジトリをクローン
$ git clone ....

## 依存関係の解決
$ cd twilio-reversi
$ npm install

## 設定ファイルのコピーと編集
$ cp .env.example .env
$ vi .env

NUMBER=Twilioで購入した電話番号
MONGO_URL=mongodb://mongo:password@localhost:27017
MONGO_DB=reversi_development
TWILIO_ACCOUNT_SID=TwilioのAccountSid
TWILIO_AUTH_TOKEN=TwilioのAuthToken

## アプリケーションの起動
$ npm start
```

## ngrok

開発環境で実行する場合、HTTPをトンネリングしてWebhookを受信できるようにします。
待受ポートは環境に依存しますが、一般的には3000番にトンネリングします。

```
ngrok http -subdomain=hoge 3000
```

## Twilio

Twilioのダッシュボードで[電話番号 / 番号の管理 / アクティブな電話番号 / Voice & FAX]で以下のように設定します。
ACCEPT INCOMING: `Voice Calls`
A CALL COMES IN: `Webhook`, `アプリケーションURL/title/``

<img src="https://github.com/awwa/twilio-reversi/blob/main/docs/image/twilio.png?raw=true" width="900px" />

## 動作確認

ブラウザからアプリケーションのトップページURLにアクセスします。
以下のようなメッセージが表示されたら準備完了です。

```
Twilio Reversi
Welcome to Twilio Reversi

__Start a new game__
```

# 遊び方

## ブラウザで操作

`__Start a new game__` リンクをクリックすると、電話番号とゲームトークンが表示されます。

```
Start a new game
Call to #NUMBER

Game token is `#TOKEN`

__Back__
```

## 携帯電話で操作

- `Call to #NUMBER` の番号に電話をかけます
- ゲームに参加する場合は1を入力します
- 続いてゲームトークンを入力して最後にシャープ（#）入力して、ゲームに参加します
- 別の電話機から同じ番号に電話をかけて、同様にゲームに参加します
  先手は黒、後手は白です
- 先手にSMSでゲームボードが送信されてくるので同じ番号に電話をかけます
  プレイヤーが石を置ける場所は*で表記されます

   ```
   Turn 1.
   You are b.
   Call to #NUMBER
     0 1 2 3 4 5 6 7
   0
   1
   2       *
   3     * w b
   4       b w *
   5         *
   6
   7
   ```

- 参加中のゲームで石を置く場合は2を入力します
- ゲームトークンに続けて*を入力し、石を置く座標を2桁（行列）で入力し、最後にシャープ（#）を入力します
  例えば、トークン1234で座標(3,2)に石を置く場合は次のように入力します。
  ```
  1234*32#
  ```

- 以降はこれの繰り返しです
- パスをする場合、座標として99と入力してください
- 両プレイヤーが連続でパスをするか、石を置く場所がなくなったらゲーム終了です

<img src="https://github.com/awwa/twilio-reversi/blob/main/docs/image/sms.png?raw=true" width="300px" />
