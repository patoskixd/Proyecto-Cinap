import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("app_session")?.value;
    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
            Vary: "Cookie",
          },
        }
      );
    }

    const res = await fetch(`${BACKEND}/auth/me`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") || "" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
            Vary: "Cookie",
          },
        }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        Vary: "Cookie",
      },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
          Vary: "Cookie",
        },
      }
    );
  }
}
