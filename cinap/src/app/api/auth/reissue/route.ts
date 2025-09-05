import { NextRequest, NextResponse } from "next/server";
import { forwardSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = process.env.BACKEND_BASE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.cookie = cookie;

    const upstream = await fetch(`${BASE}/auth/reissue`, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({}),
    });

    const resp = new NextResponse(upstream.body, { status: upstream.status });
    resp.headers.set("Cache-Control", "no-store");
    forwardSetCookies(upstream, resp);
    return resp;
  } catch {
    return NextResponse.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
