import { NextRequest, NextResponse } from "next/server";
import { createQuery, getQueries } from "@/lib/mockData";

export async function GET() {
  const data = getQueries();
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { name?: string; sql?: string } | null;

    if (!body?.name) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "name は必須です" } },
        { status: 400 },
      );
    }

    const sql = body.sql ?? "SELECT 1";
    const query = createQuery(body.name, sql);
    return NextResponse.json({ data: query }, { status: 201 });
  } catch (error) {
    console.error("/api/queries POST error", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "クエリ作成時にエラーが発生しました" } },
      { status: 500 },
    );
  }
}
