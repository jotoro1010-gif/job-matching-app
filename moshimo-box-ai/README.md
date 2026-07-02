# もしもボックスAI

「もしも〇〇だったら」という架空の世界をClaude APIが生成し、案内人とのチャットで深掘りできるインタラクティブなウェブアプリ。

## 構成

```
moshimo-box-ai/
  server/   Node.js + Express（Claude APIへのプロキシ。APIキーはここでのみ保持）
  client/   React + Vite + Tailwind CSS
```

## セットアップ

### 1. サーバー

```bash
cd moshimo-box-ai/server
npm install
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定
npm run dev   # http://localhost:3002
```

### 2. クライアント

```bash
cd moshimo-box-ai/client
npm install
npm run dev   # http://localhost:5174
```

ブラウザで `http://localhost:5174` を開けば起動する。開発時は Vite の proxy 設定（`vite.config.js`）で `/api/*` を `localhost:3002` に転送するため、クライアント側の `.env` は不要。

## 使い方

1. タイトル画面のボックスをタップして開く
2. 左側の入力欄に「もしも」の続きを入力（例：「人類が月に住んでいたら」）。サジェスト例をクリックしても良い
3. 雰囲気タブ（SF風 / 感動系 / コメディ / 歴史考証風）を選んで「この世界を開く」を押す
4. 右側にタイトル・情景描写・世界観サマリー・現実との違いがカードで表示される
5. カード下のチャット欄で案内人に質問すると、その世界の設定を保った回答が返ってくる（履歴クリアも可能）
6. カード右上の「図鑑に保存」を押すと `localStorage` に保存され、「図鑑」タブから再度開ける

## 実装した機能

- P0: もしも入力 → 世界生成 → カード表示 → 深掘りチャット（複数ターン）
- P1: 雰囲気選択タブ、保存・図鑑機能、ボックスが開く/生成中の演出アニメーション

P2（画像生成連携・共有カード・ギャラリー公開）は未実装。

## デプロイ

`moshimo-box-ai/render.yaml` にRenderブループリントを定義済み。

1. サーバー（`moshimo-box-server`）を先にデプロイし、`ANTHROPIC_API_KEY` を設定
2. クライアント（`moshimo-box-client`）をデプロイし、`VITE_API_URL` にサーバーのURLを設定
3. サーバー側の `CLIENT_URL` にクライアントのURLを設定（CORS用）

## 環境変数

| 変数 | 対象 | 用途 |
|---|---|---|
| `ANTHROPIC_API_KEY` | server | Claude APIキー（必須） |
| `CLAUDE_MODEL` | server | 使用モデル名（未設定時は `claude-sonnet-4-6`。利用不可の場合はアカウントで使えるモデル名に変更） |
| `CLIENT_URL` | server | CORSで許可するオリジン |
| `VITE_API_URL` | client | APIサーバーのベースURL（本番デプロイ時に設定。開発時は空でOK） |
