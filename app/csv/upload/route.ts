import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

export async function POST(req: NextRequest) {
  if (!BACKEND_API_BASE_URL) {
    return NextResponse.json(
      { error: { code: "NOT_IMPLEMENTED", message: "BACKEND_API_BASE_URL が未設定のためCSVアップロードは利用できません" } },
      { status: 501 },
    );
  }

  const requestId = req.headers.get("x-request-id") ?? randomUUID();

  const upstream = await fetch(`${BACKEND_API_BASE_URL}/csv/upload`, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/octet-stream",
      ...(req.headers.get("authorization") ? { Authorization: req.headers.get("authorization") as string } : {}),
      "x-request-id": requestId,
    },
    body: await req.arrayBuffer(),
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const bodyText = await upstream.text();
  const upstreamRequestId = upstream.headers.get("x-request-id") ?? requestId;
  return new NextResponse(bodyText, {
    status: upstream.status,
    headers: { "Content-Type": contentType, "x-request-id": upstreamRequestId },
  });
}
