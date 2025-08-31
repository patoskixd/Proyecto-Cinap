import { NextRequest, NextResponse } from "next/server";
import { forwardSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = process.env.ASSISTANT_BASE_URL ?? process.env.BACKEND_BASE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.authorization = auth;

    const upstream = await fetch(`${BASE}/assistant/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    const resp = NextResponse.json(
      { reply: data?.reply ?? "Sin respuesta del asistente." },
      { status: upstream.ok ? 200 : upstream.status }
    );
    resp.headers.set("Cache-Control", "no-store");

    forwardSetCookies(upstream, resp);    // ← aquí

    return resp;
  } catch {
    return NextResponse.json({ reply: "Error al contactar el backend." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
