---
name: debugAuthFlow
description: Fix login failures after switching to backend-proxied authentication.
argument-hint: Symptoms, failing URL/status, env vars, and any relevant logs
---
以下の状況で「ログインが通らない」問題を、原因特定→修正→検証までやり切ってください。

前提（一般形）:
- フロントは Next.js（App Router）で、ログイン画面が `fetch` で認証APIを呼ぶ。
- フロントの Route Handler が環境変数（例: `BACKEND_API_BASE_URL`）の有無で、
  - (A) backend へプロキシする
  - (B) フロント内のモック/開発用認証で処理する
  の二系統を持つ。
- backend 側は DB 永続のユーザーを前提にする（未登録メールは 401 になりうる）。

あなたのゴール:
1) どの経路（プロキシ/モック）が使われているか特定する
2) UI から「登録→ログイン」または「既存ユーザーでログイン」できる状態に直す
3) 再現性あるスモークで通ったことを確認する

進め方（必須）:
1. 失敗の観測
   - ブラウザのネットワーク/コンソール、またはサーバーログから、失敗しているリクエストの
     URL / method / status / response body を特定する。
   - `401`/`400` の場合は message を抽出し、どの層（Next Route Handler / backend）から返っているか推定する。

2. 設定と経路の特定
   - フロントの環境変数（例: `NEXT_PUBLIC_API_BASE_URL`, `BACKEND_API_BASE_URL`, `AUTH_DEV_*`）の値を確認し、
     現在どちらの経路 (A)/(B) が有効かを断定する。
   - ルーティング（ログインページ）→ APIクライアント → Route Handler → backend の呼び出し連鎖を追って、
     payload（email/passwordのtrim有無、Content-Type、JSON形式）とレスポンス形式（tokenの位置など）を照合する。

3. よくある根本原因のチェック
   - backend運用（DBユーザー前提）に切り替わったのに、UIに「新規登録」導線が無く、
     未登録メールでログインしようとして 401 になっている。
   - フロントが期待するレスポンス形式と backend のレスポンス形式がズレている（例: `{token}` vs `{data:{...}}`）。
   - メールアドレスの前後空白など入力正規化不足で認証失敗している。

4. 修正方針（必要なものを実装）
   - UIに `register` 画面/導線を追加し、登録成功後に自動ログインして token を保存する。
   - ログイン時に email を `trim()` する。
   - APIクライアントに `register()` を追加し、backend とモック両方のレスポンス差分を吸収する（必要なら）。
   - 既存機能を壊さないよう、環境変数による段階移行（backend proxyあり/なし）を維持する。

5. 検証（必須）
   - `curl` か Node の簡易スクリプトで `POST /auth/register` → `POST /auth/login` が通ることを確認する。
   - 可能なら `npm run smoke:*` のような再現可能なスモークを追加/更新し、成功ログを出す。
   - 画面（`/login`, `/register`）が 200 で表示でき、登録→ログイン→保護ページ遷移が成立することを確認する。

出力形式:
- 変更したファイルへのリンク（必要なら行リンク）
- 何が原因だったか（1〜2行）
- どう直したか（箇条書き）
- どう検証したか（実行したコマンド/結果）
