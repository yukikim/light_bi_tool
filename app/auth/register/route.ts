import { NextRequest, NextResponse } from "next/server";

// 開発用の簡易ユーザーストア（メモリ上のみ、再起動で消える）
const users = new Map<string, string>(); // email -> password(平文)

function createToken(email: string): string {
  // 開発用の簡易トークン（本番では必ずJWT等に置き換える）
  return `dev-token-${Buffer.from(email).toString("base64url")}`;
}

export async function POST(req: NextRequest) {
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
      { error: { code: "INTERNAL_ERROR", message: "登録処理でエラーが発生しました" } },
      { status: 500 },
    );
  }
}
