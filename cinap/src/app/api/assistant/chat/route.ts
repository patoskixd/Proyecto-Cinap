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

    const upstream = await fetch(`${BASE}/assistant/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: body?.message, thread_id: body?.thread_id }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    const resp = NextResponse.json(
      { reply: data?.reply ?? "Sin respuesta del asistente.",  thread_id: data?.thread_id },
      { status: upstream.ok ? 200 : upstream.status, headers: { "Cache-Control": "no-store" } }
    );

    forwardSetCookies(upstream, resp);
    return resp;
  } catch {
    return NextResponse.json(
      { reply: "Error al contactar el backend." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
