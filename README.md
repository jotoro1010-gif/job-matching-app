# 就活Match - セットアップ手順

## 必要なもの
- Node.js (v18以上) → https://nodejs.org/ja からダウンロード

## 起動方法

### 1. サーバーのセットアップ
```bash
cd server
npm install
npm run dev
```

### 2. クライアントのセットアップ（別のターミナルで）
```bash
cd client
npm install
npm run dev
```

### 3. ブラウザで開く
http://localhost:5173 にアクセス

## 機能
- 就活生・企業それぞれでアカウント登録
- スワイプ（右: 興味あり / 左: 興味なし）
- 双方が「興味あり」でマッチング成立
- マッチした相手とリアルタイムDM
