import { NextRequest, NextResponse } from "next/server";

import { ProfileBackendRepo } from "@/infrastructure/http/bff/profile/ProfileBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Cookie",
};

export async function GET(req: NextRequest) {
  try {
    const backend = new ProfileBackendRepo(getCookieString(req));
    const data = await backend.getSummary();

    const res = NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS });
    appendSetCookies(backend.getSetCookies(), res);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "No se pudo cargar el perfil" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
