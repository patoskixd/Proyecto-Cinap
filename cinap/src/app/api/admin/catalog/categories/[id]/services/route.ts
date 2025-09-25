import { NextRequest, NextResponse } from "next/server";
const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; 
  const cookie = req.headers.get("cookie") ?? "";
  const payload = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND}/admin/catalog/categories/${id}/services`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const txt = await res.text();
  let body: any = txt;
  try {
    body = JSON.parse(txt);
  } catch {}
  return NextResponse.json(body, { status: res.status });
}
