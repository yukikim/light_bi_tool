import { NextRequest, NextResponse } from "next/server";

// 簡易モック: queryId に応じてデータパターンを変える

export async function POST(req: NextRequest) {
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

  // モックデータパターン
  if (queryIdNum === 1) {
    // 日別売上推移
    const columns = ["date", "sales", "profit"];
    const rows = [
      { date: "2025-01-01", sales: 120, profit: 30 },
      { date: "2025-01-02", sales: 180, profit: 55 },
      { date: "2025-01-03", sales: 90, profit: 10 },
      { date: "2025-01-04", sales: 200, profit: 70 },
    ];
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
