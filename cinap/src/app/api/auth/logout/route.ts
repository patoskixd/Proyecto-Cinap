import { NextRequest, NextResponse } from "next/server";
import { makeSignOut } from "@application/auth/usecases/SignOut";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";
function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const repo = new AuthBackendRepo(getCookieString(req));
    const signOutUC = makeSignOut(repo);
    await signOutUC();

    const resp = new NextResponse(null, { 
      status: 204,
      headers: { "Cache-Control": "no-store" }
    });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e.message || "Logout failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
