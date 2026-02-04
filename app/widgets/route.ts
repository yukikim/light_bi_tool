import { NextRequest, NextResponse } from "next/server";
import { createWidget, getWidgetsByDashboardId } from "@/lib/mockData";

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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        dashboardId?: number | string;
        queryId?: number | string;
        name?: string;
        type?: "table" | "line" | "bar";
        config?: Record<string, unknown>;
      }
    | null;

  if (!body) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "body が不正です" } },
      { status: 400 },
    );
  }

  const dashboardId = Number(body.dashboardId);
  const queryId = Number(body.queryId);
  const name = body.name?.trim();
  const type = body.type;

  if (Number.isNaN(dashboardId) || dashboardId <= 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "dashboardId が不正です" } },
      { status: 400 },
    );
  }

  if (Number.isNaN(queryId) || queryId <= 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "queryId が不正です" } },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "name は必須です" } },
      { status: 400 },
    );
  }

  if (!type) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "type は必須です" } },
      { status: 400 },
    );
  }

  const widget = createWidget({
    dashboardId,
    queryId,
    name,
    type,
    config: body.config,
  });

  return NextResponse.json({ data: widget }, { status: 201 });
}
