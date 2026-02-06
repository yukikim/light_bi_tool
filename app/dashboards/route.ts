import { NextRequest, NextResponse } from "next/server";
import { createDashboard, getDashboards } from "@/lib/mockData";
import { randomUUID } from "crypto";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

async function proxyToBackend(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  const upstream = await fetch(`${BACKEND_API_BASE_URL}/dashboards`, {
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
  const data = getDashboards();
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(req);
  }
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
      { error: { code: "INTERNAL_SERVER_ERROR", message: "ダッシュボード作成時にエラーが発生しました" } },
      { status: 500 },
    );
  }
}
