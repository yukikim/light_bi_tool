# 開発手順 3: フロントでのWidget描画構造（React）

Next.js App Router（`app/`）で、ダッシュボード上のウィジェットを描画する構造を整理します。

## 1. 主要ページ

- ダッシュボード詳細: `app/dashboard/[id]/page.tsx`
  - `react-grid-layout` でウィジェットを配置/リサイズ
  - 期間フィルタ（from/to）は draft → 適用ボタンで確定

- クエリエディタ: `app/queries/[id]/page.tsx`
  - name/sql/paramDefs を編集
  - `from/to` テンプレ追加など

## 2. Widgetのコンポーネント分割

- `WidgetContainer` … 枠、状態（loading/error）や高さ継承の土台
- `WidgetHeader` … タイトル、操作（再実行/編集など）
- `WidgetRenderer` … 実行パラメータ入力 + 実行 + table/bar/line の描画切替

## 3. 高さ（h）の伝播

`react-grid-layout` のセル高さに追従させるには、子要素が `h-full` / `min-h-0` を持つ必要があります。

- 例: `WidgetContainer` を `h-full min-h-0 flex flex-col` にする
- `WidgetRenderer` も `flex-1 min-h-0` として、
  - チャート: 親に追従（`h-full`）
  - テーブル: `overflow-auto` でスクロール

## 4. パラメータ入力の扱い

- 入力中（draft）と適用済み（committed）を分けるとUXが安定します
- `onBlur` で確定させると、入力途中での連続再実行を避けられます

## 5. 日付表示

- ISO文字列（`2025-03-31T...Z`）は `YYYY-MM-DD` に整形して表示すると読みやすい
- X軸tickやTooltipも同じ整形関数を使うと統一できます
