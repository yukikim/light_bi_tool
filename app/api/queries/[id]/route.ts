import { NextRequest, NextResponse } from "next/server";
import { getQueryById, updateQuery } from "@/lib/mockData";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
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
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "id が不正です" } },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => null)) as { name?: string; sql?: string } | null;

  if (!body?.name || !body?.sql) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "name と sql は必須です" } },
      { status: 400 },
    );
  }

  const updated = updateQuery(id, { name: body.name, sql: body.sql });

  if (!updated) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クエリが見つかりません" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: updated }, { status: 200 });
}
