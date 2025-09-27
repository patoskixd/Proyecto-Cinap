import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookie = req.headers.get("cookie") ?? "";
  const payload = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND}/admin/catalog/services/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie, accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const txt = await res.text(); let body: any = txt; try { body = JSON.parse(txt); } catch {}
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookie = req.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND}/admin/catalog/services/${id}`, {
    method: "DELETE", headers: { cookie, accept: "application/json" }, credentials: "include",
  });
  const txt = await res.text(); let body: any = txt; try { body = JSON.parse(txt); } catch {}
  return NextResponse.json(body, { status: res.status });
}
