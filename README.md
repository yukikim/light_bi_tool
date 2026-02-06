# かんたんBIツール（LightBI）

SQL実行/保存、Dashboard & Widget、CSVアップロード「1機能」、簡易認証までを最小構成で実装したMVPです。

- Frontend: Next.js (App Router)
- Backend: NestJS
- DB: PostgreSQL (Docker)

## クイックスタート（デモ: 5分）

前提: Node.js、Docker Desktop（Postgres用）

### 1) 依存関係のインストール

```bash
npm i
npm --prefix backend i
```

### 2) 環境変数の用意

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

### 3) DB起動 → migrate → seed

```bash
npm run dev:db
npm run db:migrate
npm run db:seed
```

### 4) backend起動 → frontend起動

別ターミナルでそれぞれ起動します。

```bash
npm run dev:backend
```

```bash
npm run dev
```

### 5) ログイン

- URL: `http://localhost:3000/login`
- デモユーザー（seed済み）
	- email: `demo@example.com`
	- password: `demo-password`

ログイン後、`/dashboard` にデモ用ダッシュボードが表示されます。

## スモークテスト

backend + frontend を起動した状態で実行します。

```bash
NEXT_BASE_URL=http://localhost:3000 npm run smoke:next
NEXT_BASE_URL=http://localhost:3000 npm run smoke:next:dw
NEXT_BASE_URL=http://localhost:3000 npm run smoke:next:csv
```

## よく使うコマンド

- DB起動: `npm run dev:db`
- DB migrate: `npm run db:migrate`
- DB seed: `npm run db:seed`
- backend: `npm run dev:backend`
- frontend: `npm run dev`
- DB停止: `npm run down:db`

※ DBを完全に初期化したい場合は `docker compose down -v` を使います。

## ドキュメント

- 要件: [docs/要件定義書.md](docs/%E8%A6%81%E4%BB%B6%E5%AE%9A%E7%BE%A9%E6%9B%B8.md)
- 基本設計: [docs/基本設計書.md](docs/%E5%9F%BA%E6%9C%AC%E8%A8%AD%E8%A8%88%E6%9B%B8.md)
- 実装計画: [docs/実装計画書.md](docs/%E5%AE%9F%E8%A3%85%E8%A8%88%E7%94%BB%E6%9B%B8.md)
- 開発ログ: [docs/dev_record.md](docs/dev_record.md)