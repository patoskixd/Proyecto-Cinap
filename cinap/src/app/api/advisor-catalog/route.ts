import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("app_session")?.value ?? "";
  const res = await fetch(`${BACKEND}/advisor-catalog`, {
    method: "GET",
    headers: {
      accept: "application/json",
      cookie: cookie ? `app_session=${cookie}` : "",
    },
    cache: "no-store",
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
