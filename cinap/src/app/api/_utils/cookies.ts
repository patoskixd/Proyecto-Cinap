import { NextResponse } from "next/server";


export function sanitizeSetCookie(raw: string) {
  return raw.replace(/;\s*Domain=[^;]+/gi, "");
}

export function forwardSetCookies(upstream: Response, resp: NextResponse) {
  const anyHeaders = upstream.headers as any;

  const rawList: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : (upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : []);

  for (const c of rawList) {
    resp.headers.append("set-cookie", sanitizeSetCookie(c));
  }
}
