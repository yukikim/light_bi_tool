# 開発手順 5: MVP実装テンプレ（NestJS + React / repo構成）

このリポジトリの構成と、ローカル開発の最小手順をまとめます。

## 1. ディレクトリ構成（概要）

- `app/` … Next.js（App Router）フロントエンド
- `backend/` … NestJS API
- `docker-compose.yml` … ローカルPostgreSQL
- `lib/` … フロント用 API client / mock
- `docs/` … 設計/手順

## 2. 起動手順（ローカル）

1) DB起動
- `npm run dev:db`

2) マイグレーション
- `npm run db:migrate`

3) （必要なら）seed
- `npm run db:seed`

4) Backend
- `npm run dev:backend`

5) Frontend
- `npm run dev`

## 3. 通信（Next API Route）

- Next側は `app/api/*` を用意し、
  - `BACKEND_API_BASE_URL` がある場合はバックエンドにプロキシ
  - ない場合は `lib/mockData.ts` を利用

## 4. MVPで守ること

- 仕様追加より、
  - Execute安全設計
  - Widgetの高さ/スクロール
  - CSVアップロード→即可視化
  の完成を優先する
