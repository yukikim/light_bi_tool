import { NextRequest, NextResponse } from "next/server";
import { createQuery, getQueries } from "@/lib/mockData";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

async function proxyToBackend(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const upstream = await fetch(`${BACKEND_API_BASE_URL}/queries`, {
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

export async function GET(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(req);
  }

  const data = getQueries();
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: NextRequest) {
  if (BACKEND_API_BASE_URL) {
    return proxyToBackend(req);
  }

  try {
    const body = (await req.json().catch(() => null)) as { name?: string; sql?: string } | null;

    if (!body?.name) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "name は必須です" } },
        { status: 400 },
      );
    }

    const sql = body.sql ?? "SELECT 1";
    const query = createQuery(body.name, sql);
    return NextResponse.json({ data: query }, { status: 201 });
  } catch (error) {
    console.error("/api/queries POST error", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "クエリ作成時にエラーが発生しました" } },
      { status: 500 },
    );
  }
}
