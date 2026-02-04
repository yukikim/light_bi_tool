import { NextRequest, NextResponse } from "next/server";
import { getDashboardById } from "@/lib/mockData";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

async function proxyToBackend(req: NextRequest, id: string) {
  const authorization = req.headers.get("authorization") ?? "";
  const upstream = await fetch(`${BACKEND_API_BASE_URL}/dashboards/${id}`, {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: req.method === "GET" ? undefined : await req.text(),
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const bodyText = await upstream.text();
  return new NextResponse(bodyText, { status: upstream.status, headers: { "Content-Type": contentType } });
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;

  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(_req, idParam);
  }

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
