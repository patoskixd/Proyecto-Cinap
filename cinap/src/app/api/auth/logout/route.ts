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
    const auth = req.headers.get("authorization");
    if (auth) headers.authorization = auth;

    const upstream = await fetch(`${BASE}/auth/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (upstream.status === 204) {
      const resp = new NextResponse(null, { status: 204 });
      resp.headers.set("Cache-Control", "no-store");
      forwardSetCookies(upstream, resp);  // ← aquí
      return resp;
    }

    const data = await upstream.json().catch(() => ({}));
    const resp = NextResponse.json(data, { status: upstream.status });
    resp.headers.set("Cache-Control", "no-store");

    forwardSetCookies(upstream, resp);    // ← aquí

    return resp;
  } catch {
    return NextResponse.json({ ok: false, error: "Logout failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
