# 開発手順 1: DB設計（テーブル構成）

このMVPで必要な最小テーブルと、参照整合性（削除ポリシー）を整理します。

## 1. スキーマ概要

- アプリ管理テーブル: public スキーマ
- CSV取り込みテーブル: `csv_schema` スキーマ（CSVごとに動的テーブルを作成）

## 2. 主要テーブル（現状実装に準拠）

以下は [backend/sql/schema.sql](../backend/sql/schema.sql) と同等の構成を想定します。

### users

- `id` (PK)
- `email` (UNIQUE)
- `password_hash`
- `created_at`

### queries

- `id` (PK)
- `name`
- `sql`
- `param_defs` (JSONB) … `[{ name, label?, type, required?, default? }, ...]`
- `created_at`, `updated_at`

### dashboards

- `id` (PK)
- `name`
- `created_at`

### widgets

- `id` (PK)
- `dashboard_id` → dashboards(id) `ON DELETE CASCADE`
- `query_id` → queries(id) `ON DELETE RESTRICT`
- `name`, `type` (table/bar/line)
- `config` (JSONB)
- `position_x`, `position_y`, `width`, `height`
- `created_at`, `updated_at`

ポイント:
- `widgets.query_id` が `RESTRICT` のため、参照中のクエリはそのまま削除できません。
  - 運用設計としては「削除を拒否して理由を返す」または「強制削除で参照ウィジェットも削除」が選択肢になります。

### query_executions

- `id` (PK)
- `query_id` → queries(id) `ON DELETE CASCADE`
- `executed_at`
- `duration_ms`
- `row_count`
- `params` (JSONB)
- `error_code`, `error_message`

## 3. CSV取り込み（csv_schema）

- `CREATE SCHEMA IF NOT EXISTS csv_schema;`
- CSVアップロード時に `csv_schema.<base>_<timestamp>_<rand>` のようなテーブルを作成
- 列名は正規化（英数字 + `_`）し、型を推定（bigint / double precision / boolean / date / timestamptz / text）

## 4. マイグレーション/初期化

- ローカル開発では `docker compose` のDBに対して migrate/seed を流す想定
- 例:
  - `npm run dev:db`
  - `npm run db:migrate`
  - `npm run db:seed`
