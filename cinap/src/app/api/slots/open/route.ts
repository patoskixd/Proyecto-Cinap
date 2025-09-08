import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const payload = await req.json().catch(() => ({}));

  const res = await fetch(`${BACKEND}/slots/open`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return NextResponse.json(body, { status: res.status });
}
