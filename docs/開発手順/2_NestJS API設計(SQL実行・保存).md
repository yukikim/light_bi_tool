# 開発手順 2: NestJS API設計（SQL実行・保存）

このMVPは「クエリを保存して安全に実行する」ことが中核です。ここでは現状の実装に合わせて、主要APIの責務と入出力をまとめます。

## 1. 認証

- `POST /auth/register` … ユーザー登録
- `POST /auth/login` … JWT発行

MVPはJWTを必須とし、以降のAPIはガードで保護します。

## 2. クエリCRUD

- `GET /queries` … 一覧
- `GET /queries/:id` … 詳細
- `POST /queries` … 作成（name/sql/paramDefs）
- `PUT /queries/:id` … 更新
- `DELETE /queries/:id` … 削除

削除について:
- `widgets.query_id` が `RESTRICT` のため、参照ウィジェットがある場合は削除方針が必要です。
- 推奨: 参照がある場合は `409 Conflict` とメッセージを返し、`?force=1` で強制削除（参照ウィジェットも削除）を許可。

## 3. 実行API（中核）

- `POST /execute` … `queryId` と `params` を受け取り実行

ポイント:
- SQLはDBから取得（クライアントから直接SQLは受けない）
- `{{name}}` 形式の名前付きパラメータを `$1..$n` にコンパイルして実行
- 強制LIMITとstatement_timeoutを適用

レスポンス（概念）:
- `columns: string[]`
- `rows: Record<string, unknown>[]`

## 4. CSVアップロード

- `POST /csv/upload` … CSVを受け取り、
  - テーブル作成・投入
  - クエリ自動生成（`CSV: <filename>`）
  - ダッシュボード + ウィジェット自動生成

## 5. エラー形式

- 成功: `{ data: ... }`
- 失敗: `{ error: { code, message } }`（Next側のAPIもこの形式を踏襲）
