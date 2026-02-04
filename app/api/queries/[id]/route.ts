import { NextRequest, NextResponse } from "next/server";
import { getQueryById, updateQuery } from "@/lib/mockData";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

async function proxyToBackend(req: NextRequest, id: string) {
  const authorization = req.headers.get("authorization") ?? "";
  const upstream = await fetch(`${BACKEND_API_BASE_URL}/queries/${id}`, {
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

  const query = getQueryById(id);

  if (!query) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クエリが見つかりません" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: query }, { status: 200 });
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
        name?: string;
        sql?: string;
        paramDefs?: Array<{
          name: string;
          label?: string;
          type: "string" | "number" | "date" | "boolean";
          required?: boolean;
          default?: string | number | boolean;
        }>;
      }
    | null;

  if (!body?.name || !body?.sql) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "name と sql は必須です" } },
      { status: 400 },
    );
  }

  const paramDefs = body.paramDefs;
  if (paramDefs !== undefined) {
    if (!Array.isArray(paramDefs) || paramDefs.length > 50) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "paramDefs が不正です" } },
        { status: 400 },
      );
    }
    for (const p of paramDefs) {
      if (!p || typeof p !== "object") {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "paramDefs が不正です" } },
          { status: 400 },
        );
      }
      if (!p.name || typeof p.name !== "string") {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "paramDefs.name は必須です" } },
          { status: 400 },
        );
      }
      if (!p.type || typeof p.type !== "string") {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "paramDefs.type は必須です" } },
          { status: 400 },
        );
      }
    }
  }

  const updated = updateQuery(id, { name: body.name, sql: body.sql, ...(paramDefs !== undefined ? { paramDefs } : {}) });

  if (!updated) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クエリが見つかりません" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: updated }, { status: 200 });
}
