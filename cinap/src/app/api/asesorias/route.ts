import { NextRequest, NextResponse } from "next/server";
import { forwardSetCookies } from "../_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";


export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const body = await req.json().catch(() => ({})); 

  const payload =
    body && typeof body === "object"
      ? {
          cupo_id: body.cupo_id ?? body.cupoId,
          origen: body.origen ?? null,
          notas: body.notas ?? null,
        }
      : {};

  const upstream = await fetch(`${BACKEND}/api/asesorias`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  let data: any = text;
  try { data = JSON.parse(text); } catch {}

  const resp = NextResponse.json(data, { status: upstream.status });
  forwardSetCookies(upstream, resp);
  return resp;
}
