import { NextRequest, NextResponse } from "next/server";
import { makeGetMe } from "@application/auth/usecases/getMe";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";
function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Cookie",
};

export async function GET(req: NextRequest) {
  try {
    const repo = new AuthBackendRepo(getCookieString(req));
    const getMeUC = makeGetMe(repo);
    const me = await getMeUC();

    const resp = NextResponse.json(me, { status: 200, headers: NO_STORE_HEADERS });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    console.error("Error en /api/auth/me:", e.message);
    return NextResponse.json({ authenticated: false }, { status: 200, headers: NO_STORE_HEADERS });
  }
}
