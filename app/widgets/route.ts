import { NextRequest, NextResponse } from "next/server";
import { getWidgetsByDashboardId } from "@/lib/mockData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dashboardIdParam = searchParams.get("dashboardId");

  if (!dashboardIdParam) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "dashboardId は必須です" } },
      { status: 400 },
    );
  }

  const dashboardId = Number(dashboardIdParam);

  if (Number.isNaN(dashboardId)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "dashboardId が不正です" } },
      { status: 400 },
    );
  }

  const data = getWidgetsByDashboardId(dashboardId);
  return NextResponse.json({ data }, { status: 200 });
}
