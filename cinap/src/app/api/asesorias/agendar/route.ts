import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";


export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";


  const url = new URL(req.url);
  const qs = url.search; 

  const searchParams = Object.fromEntries(url.searchParams.entries());
  const isBackendFindPOST = true; 

  const upstream = await fetch(`${BACKEND}/slots/find${isBackendFindPOST ? "" : qs}`, {
    method: isBackendFindPOST ? "POST" : "GET",
    headers: {
      accept: "application/json",
      "content-type": isBackendFindPOST ? "application/json" : undefined as any,
      cookie,
    } as any,
    credentials: "include",
    cache: "no-store",
    body: isBackendFindPOST ? JSON.stringify(searchParams) : undefined,
  });

  const text = await upstream.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return NextResponse.json(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}


export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const payload = await req.json().catch(() => ({}));

  const upstream = await fetch(`${BACKEND}/api/asesorias`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      cookie,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}

  const resp = new NextResponse(JSON.stringify(body), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
  const anyHeaders = upstream.headers as any;
  const rawList: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : (upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : []);
  for (const c of rawList) {
    resp.headers.append("set-cookie", c.replace(/;\s*Domain=[^;]+/gi, ""));
  }
  return resp;
}
