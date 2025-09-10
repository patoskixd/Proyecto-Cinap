import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND}/slots/my`, {
    method: "GET",
    headers: { cookie },
    credentials: "include",
    cache: "no-store",
  });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return NextResponse.json(body, { status: res.status });
}
