import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

// 開発用の簡易ユーザーストア（メモリ上のみ、再起動で消える）
const users = new Map<string, string>(); // email -> password(平文)

function createToken(email: string): string {
  // 開発用の簡易トークン（本番では必ずJWT等に置き換える）
  return `dev-token-${Buffer.from(email).toString("base64url")}`;
}

export async function POST(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    try {
      const requestId = req.headers.get("x-request-id") ?? randomUUID();
      const upstream = await fetch(`${BACKEND_API_BASE_URL}/auth/register`, {
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
      console.error("/auth/register proxy error", error);
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

    if (users.has(email)) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "このメールアドレスは既に登録されています" } },
        { status: 409 },
      );
    }

    users.set(email, password);

    const token = createToken(email);

    return NextResponse.json({ token }, { status: 201 });
  } catch (error) {
    console.error("/auth/register error", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "登録処理でエラーが発生しました" } },
      { status: 500 },
    );
  }
}
