import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const res = await fetch(`${API_BASE}/telegram/me`, {
    method: "GET",
    headers: { cookie: req.headers.get("cookie") ?? "" },
    credentials: "include",
    cache: "no-store",
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
