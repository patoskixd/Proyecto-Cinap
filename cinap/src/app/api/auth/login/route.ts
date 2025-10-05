import { NextRequest, NextResponse } from "next/server";
import { makeLogin } from "@application/auth/usecases/Login";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

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

    const resp = NextResponse.json(result, { 
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e.message || "Login failed" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
