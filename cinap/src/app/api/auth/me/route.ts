import { NextRequest, NextResponse } from "next/server";
import { makeGetMe } from "@application/auth/usecases/getMe";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Cookie",
};

export async function GET(req: NextRequest) {
  try {
    const repo = new AuthBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
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
