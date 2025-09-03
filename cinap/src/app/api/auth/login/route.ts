import { NextRequest, NextResponse } from "next/server";
import { forwardSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = process.env.BACKEND_BASE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json().catch(() => ({}));
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const cookie = req.headers.get("cookie");
    if (cookie) headers.cookie = cookie;

    const upstream = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
    });


    const resp = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Cache-Control": "no-store",
        ...(upstream.headers.get("content-type")
          ? { "content-type": upstream.headers.get("content-type") as string }
          : {}),
      },
    });

    forwardSetCookies(upstream, resp); 
    return resp;
  } catch (e) {
    return NextResponse.json(
      { detail: "Login proxy failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
