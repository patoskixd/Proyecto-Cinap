import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookie = req.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND}/admin/catalog/categories/${id}/reactivate`, {
    method: "POST", headers: { cookie, accept: "application/json" }, credentials: "include",
  });
  const txt = await res.text(); let body: any = txt; try { body = JSON.parse(txt); } catch {}
  return NextResponse.json(body, { status: res.status });
}
