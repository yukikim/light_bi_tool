# 開発手順 4: SQL実行の安全設計（実装レベル）

MVPでは「SQLを安全に実行する」ことが最重要です。現状の実装（`backend/src/execute/*`）に沿って、守っている制約をまとめます。

## 1. 方針

- 書き換え系SQLは禁止（`SELECT` / `WITH` のみ許可）
- 複数ステートメント禁止（`;` を含むSQLは拒否）
- 禁止キーワードの検出（`insert/update/delete/drop/...`）
- パラメータは必ずバインド（文字列連結しない）
- 強制 `LIMIT` により結果行数を上限化
- statement_timeout により実行時間を上限化
- 実行ログ（成功/失敗）を `query_executions` に保存

## 2. 実装ポイント

### 2.1 SQL安全チェック

- 実装: `backend/src/execute/sqlSafety.ts`
- コメントとブロックコメントを除去してからチェック
- 先頭が `select` または `with` であること
- 禁止語を単語境界で検出

### 2.2 名前付きパラメータのコンパイル

- 実装: `backend/src/execute/compileNamedParams.ts`
- SQL中の `{{ paramName }}` を `$1, $2, ...` に置換
- 同名は同じ番号に再利用
- paramsに存在しない場合は `missing_param:<name>` としてエラー

### 2.3 強制LIMIT

- 実装: `backend/src/execute/execute.service.ts`
- コンパイル後SQLをサブクエリ化して `LIMIT $n` を必ず付与

例（概念）:

```sql
SELECT * FROM (
  <compiled sql>
) AS __q
LIMIT $<last>
```

### 2.4 statement_timeout

- `SET LOCAL statement_timeout = <ms>` をトランザクション内で設定

## 3. 注意（タイムゾーン）

- `timestamptz` や UTC相当の文字列を「日付」で絞る場合、
  DB上の解釈と表示タイムゾーンにより前日/翌日ズレが起きます。
- 対策はクエリ側で明示変換する（例: UTC→JSTへ変換して `::date`）。

## 4. 将来拡張

- ホワイトリスト（許可スキーマ/許可テーブル）
- クエリコスト見積もり（EXPLAIN）
- テナント単位の実行回数/時間制限
