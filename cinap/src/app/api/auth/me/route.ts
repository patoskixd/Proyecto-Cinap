// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    // toma la cookie entrante del browser
    const cookie = req.headers.get("cookie") || "";

    const res = await fetch(`${BACKEND}/auth/me`, {
      method: "GET",
      headers: {
        // reenviamos la cookie al backend
        cookie,
        // opcionalmente, deshabilita caché intermedia
        "cache-control": "no-store",
      },
    });

    // si backend cae, devolvemos false para que el front redirija
    if (!res.ok) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const data = await res.json();
    // devolvemos tal cual al cliente
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    // ante cualquier error devolvemos no autenticado
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
