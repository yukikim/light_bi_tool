import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

// register と同じモジュールスコープのストアは共有されない可能性があるため、
// ここでは暫定的に単一ユーザーを環境変数で認証する形にする。

const DEV_EMAIL = process.env.AUTH_DEV_EMAIL;
const DEV_PASSWORD = process.env.AUTH_DEV_PASSWORD;

function createToken(email: string): string {
  return `dev-token-${Buffer.from(email).toString("base64url")}`;
}

export async function POST(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    try {
      const requestId = req.headers.get("x-request-id") ?? randomUUID();
      const upstream = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": req.headers.get("content-type") ?? "application/json",
          "x-request-id": requestId,
        },
        body: await req.text(),
      });

      const contentType = upstream.headers.get("content-type") ?? "application/json";
      const bodyText = await upstream.text();
      const upstreamRequestId = upstream.headers.get("x-request-id") ?? requestId;
      return new NextResponse(bodyText, {
        status: upstream.status,
        headers: { "Content-Type": contentType, "x-request-id": upstreamRequestId },
      });
    } catch (error) {
      console.error("/auth/login proxy error", error);
      return NextResponse.json(
        {
          error: {
            code: "UPSTREAM_UNREACHABLE",
            message:
              `バックエンドAPIに接続できません (${BACKEND_API_BASE_URL}). ` +
              "backend を起動してから再試行してください。",
          },
        },
        { status: 502 },
      );
    }
  }

  try {
    const body = await req.json().catch(() => null) as { email?: string; password?: string } | null;

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "email と password は必須です" } },
        { status: 400 },
      );
    }

    const { email, password } = body;

    if (!DEV_EMAIL || !DEV_PASSWORD) {
      return NextResponse.json(
        { error: { code: "SERVER_CONFIG_ERROR", message: "AUTH_DEV_EMAIL / AUTH_DEV_PASSWORD が設定されていません" } },
        { status: 500 },
      );
    }

    if (email !== DEV_EMAIL || password !== DEV_PASSWORD) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "メールアドレスまたはパスワードが正しくありません" } },
        { status: 401 },
      );
    }

    const token = createToken(email);

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("/auth/login error", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "ログイン処理でエラーが発生しました" } },
      { status: 500 },
    );
  }
}
