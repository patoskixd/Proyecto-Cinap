import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;             
  const cookie = req.headers.get("cookie") ?? "";
  const payload = await req.json().catch(() => ({}));

  const res = await fetch(`${BACKEND}/slots/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie, accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;              
  const cookie = req.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND}/slots/${id}`, {
    method: "DELETE",
    headers: { cookie, accept: "application/json" },
    credentials: "include",
  });

  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return NextResponse.json(body, { status: res.status });
}
