import { NextRequest, NextResponse } from "next/server";
import { createWidget, getWidgetsByDashboardId } from "@/lib/mockData";
import { randomUUID } from "crypto";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

async function proxyToBackend(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  const url = new URL(req.url);
  const upstreamUrl = new URL(`${BACKEND_API_BASE_URL}/widgets`);
  url.searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));

  const upstream = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
      "x-request-id": requestId,
    },
    body: req.method === "GET" ? undefined : await req.text(),
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const bodyText = await upstream.text();
  const upstreamRequestId = upstream.headers.get("x-request-id") ?? requestId;
  return new NextResponse(bodyText, {
    status: upstream.status,
    headers: { "Content-Type": contentType, "x-request-id": upstreamRequestId },
  });
}

export async function GET(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(req);
  }
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
  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(req);
  }
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
