import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

// 簡易モック: queryId に応じてデータパターンを変える

export async function POST(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    const authorization = req.headers.get("authorization") ?? "";
    const upstream = await fetch(`${BACKEND_API_BASE_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") ?? "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: await req.text(),
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const bodyText = await upstream.text();
    return new NextResponse(bodyText, { status: upstream.status, headers: { "Content-Type": contentType } });
  }

  const body = (await req.json().catch(() => null)) as
    | { queryId?: number | string; params?: Record<string, unknown> }
    | null;

  if (!body?.queryId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "queryId は必須です" } },
      { status: 400 },
    );
  }

  const queryIdNum = Number(body.queryId);
  const params = body.params ?? {};

  // モックデータパターン
  if (queryIdNum === 1) {
    // 日別売上推移
    const columns = ["date", "sales", "profit"];
    let rows = [
      { date: "2025-01-01", sales: 120, profit: 30 },
      { date: "2025-01-02", sales: 180, profit: 55 },
      { date: "2025-01-03", sales: 90, profit: 10 },
      { date: "2025-01-04", sales: 200, profit: 70 },
    ];

    const from = typeof params.from === "string" ? params.from : undefined;
    const to = typeof params.to === "string" ? params.to : undefined;
    if (from || to) {
      rows = rows.filter((r) => {
        const d = String(r.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    return NextResponse.json({ data: { columns, rows } }, { status: 200 });
  }

  if (queryIdNum === 2) {
    // カテゴリ別売上
    const columns = ["category", "sales", "orders"];
    const rows = [
      { category: "食品", sales: 300, orders: 42 },
      { category: "日用品", sales: 180, orders: 28 },
      { category: "家電", sales: 120, orders: 10 },
    ];
    return NextResponse.json({ data: { columns, rows } }, { status: 200 });
  }

  // デフォルト: 汎用テーブル
  const columns = ["id", "value"];
  const rows = [
    { id: 1, value: "foo" },
    { id: 2, value: "bar" },
  ];

  return NextResponse.json({ data: { columns, rows } }, { status: 200 });
}
