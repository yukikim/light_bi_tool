import { NextRequest, NextResponse } from "next/server";
import { deleteWidget, updateWidget } from "@/lib/mockData";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

async function proxyToBackend(req: NextRequest, id: string) {
  const authorization = req.headers.get("authorization") ?? "";
  const upstream = await fetch(`${BACKEND_API_BASE_URL}/widgets/${id}`, {
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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;

  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(req, idParam);
  }

  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "id が不正です" } },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | {
        queryId?: number | string;
        name?: string;
        type?: "table" | "line" | "bar";
        config?: Record<string, unknown>;
        positionX?: number;
        positionY?: number;
        width?: number;
        height?: number;
      }
    | null;

  if (!body) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "body が不正です" } },
      { status: 400 },
    );
  }

  if (body.queryId !== undefined) {
    const queryId = Number(body.queryId);
    if (Number.isNaN(queryId) || queryId <= 0) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "queryId が不正です" } },
        { status: 400 },
      );
    }
    body.queryId = queryId;
  }

  const updated = updateWidget(id, {
    queryId: body.queryId as number | undefined,
    name: body.name,
    type: body.type,
    config: body.config,
    positionX: body.positionX,
    positionY: body.positionY,
    width: body.width,
    height: body.height,
  });

  if (!updated) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "ウィジェットが見つかりません" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: updated }, { status: 200 });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

  const ok = deleteWidget(id);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "ウィジェットが見つかりません" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: { id } }, { status: 200 });
}
