import { NextRequest, NextResponse } from "next/server";
import { makeLogin } from "@application/auth/usecases/Login";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const TOKEN_KEYS = ["token", "access_token", "refresh_token", "id_token", "authorization", "jwt"];

function shouldStripKey(key: string) {
  const lower = key.toLowerCase();
  return TOKEN_KEYS.some((k) => lower === k || lower.endsWith(`_${k}`) || lower.includes(`${k}_`)) || lower.includes("token");
}

function sanitizeAuthPayload<T = any>(value: T): T {
  if (value === null || value === undefined) return {} as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeAuthPayload(v)) as T;
  if (typeof value !== "object") return value;

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value as Record<string, any>)) {
    if (shouldStripKey(k)) continue;
    out[k] = sanitizeAuthPayload(v);
  }
  return out as T;
}

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const repo = new AuthBackendRepo(getCookieString(req));
    const loginUC = makeLogin(repo);
    const result = await loginUC(email, password);

    const safePayload = sanitizeAuthPayload(result);

    const resp = NextResponse.json(safePayload, { 
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    const status = 502;
    return NextResponse.json(
      { detail: e.message || "Login failed" },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
