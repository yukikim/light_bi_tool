# かんたんBIツール（LightBI）

SQL実行/保存、Dashboard & Widget、CSVアップロード「1機能」、簡易認証までを最小構成で実装したMVPです。

- Frontend: Next.js (App Router)
- Backend: NestJS
- DB: PostgreSQL (Docker)

![アニメーションの説明](/docs/output-1.gif)


## MVPの整理

このリポジトリ（かんたんBIツール / LightBI）でいう「BIツール」を、MVPとして成立させるための最小要素に分解して整理します。

### 1. BIツールの最小機能（MVP）

- データ取得: SQL（主に `SELECT`）を実行して表形式の結果を得る
- 可視化: 結果を table / bar / line といったウィジェットに描画する
- ダッシュボード: 複数ウィジェットを並べて閲覧・共有できる単位
- フィルタ（パラメータ）: `from/to` などの入力でSQLを再実行できる
- CSV取り込み: 手元データをアップロードして即座に可視化できる

### 2. LightBIのアプローチ

- クエリはDBに保存し、実行時に `{{name}}` 形式の名前付きパラメータをバインド
- SQLは安全対策として `SELECT`（または `WITH`）のみ許可し、禁止語をブロック
- 取得結果には上限（強制 `LIMIT`）をかけ、重いクエリの影響を抑制

### 3. 典型的なユーザーフロー

1. CSVをアップロード（またはクエリを作成）
2. 生成されたクエリを確認・編集（必要なら `from/to` などのパラメータを追加）
3. ダッシュボードにウィジェットとして配置
4. 期間などのフィルタを適用して再実行

### 4. 非機能（最低限）

- 実行制限: statement_timeout / 最大行数
- 監査（簡易）: 実行ログ（duration, row_count, params, error）を保存

### 5. 用語

- クエリ: 保存されたSQL（+ パラメータ定義）
- ウィジェット: クエリ結果の描画単位（table/bar/line）
- ダッシュボード: ウィジェット配置（x,y,w,h）を持つ画面

## ウィジェットのグラフ設定（config JSON）

ダッシュボードのウィジェット（type: `line` / `bar`）には、任意で `config`（JSON）を持たせられます。

- `xKey`: X軸に使う列名（未指定の場合は先頭列を採用）
- `series`: 描画する系列の配列（未指定の場合は `yKey` / `yKeys` から補完）
	- `yKey`: Y軸に使う列名
	- `label`: 凡例表示名（任意）
	- `axis`: `left` / `right`（任意。未指定は `left`）
	- `color`: 系列の色（任意。これが最優先）
- `options`: 表示オプション（任意）
	- 共通: `showLegend`, `showGrid`, `showTooltip`, `numberFormat`
	- barのみ: `stacked`, `baseline`
	- 色指定: `colors`（パレット）, `colorsByKey`（yKeyごと）

色指定の優先順位は `series.color` → `options.colorsByKey[yKey]` → `options.colors` → デフォルトです。

### 最小例（yKeysを使う簡易指定）

```json
{ "xKey": "date", "yKeys": ["sales"] }
```

### 例: line（キー別に色を指定）

```json
{
	"xKey": "date",
	"series": [
		{ "yKey": "sales", "label": "売上", "axis": "left" },
		{ "yKey": "profit", "label": "利益", "axis": "right" }
	],
	"options": {
		"showLegend": true,
		"showGrid": true,
		"showTooltip": true,
		"numberFormat": "comma",
		"colorsByKey": {
			"sales": "#ff6467",
			"profit": "#05df72"
		}
	}
}
```

### 例: bar（パレットで色を指定）

```json
{
	"xKey": "category",
	"series": [
		{ "yKey": "sales", "label": "売上" },
		{ "yKey": "orders", "label": "注文件数", "axis": "right" }
	],
	"options": {
		"stacked": false,
		"baseline": "zero",
		"showLegend": true,
		"showGrid": true,
		"showTooltip": true,
		"numberFormat": "compact",
		"colors": ["#51a2ff", "#ffb900"]
	}
}
```

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