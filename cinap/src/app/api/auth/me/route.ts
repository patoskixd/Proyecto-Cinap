import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8000";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Cookie",
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("app_session")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: NO_STORE_HEADERS });
    }

    const res = await fetch(`${BACKEND}/auth/me`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") || "" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: NO_STORE_HEADERS });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: NO_STORE_HEADERS });
  }
}
