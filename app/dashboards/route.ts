import { NextRequest, NextResponse } from "next/server";
import { createDashboard, getDashboards } from "@/lib/mockData";

export async function GET() {
  const data = getDashboards();
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { name?: string } | null;

    if (!body?.name) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "name は必須です" } },
        { status: 400 },
      );
    }

    const dashboard = createDashboard(body.name);
    return NextResponse.json({ data: dashboard }, { status: 201 });
  } catch (error) {
    console.error("/dashboards POST error", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "ダッシュボード作成時にエラーが発生しました" } },
      { status: 500 },
    );
  }
}
