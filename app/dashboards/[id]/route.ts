import { NextRequest, NextResponse } from "next/server";
import { getDashboardById } from "@/lib/mockData";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "id が不正です" } },
      { status: 400 },
    );
  }

  const dashboard = getDashboardById(id);

  if (!dashboard) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "ダッシュボードが見つかりません" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: dashboard }, { status: 200 });
}
