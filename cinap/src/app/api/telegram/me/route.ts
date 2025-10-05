import { NextRequest, NextResponse } from "next/server";
import { GetTelegramMe } from "@application/telegram/usecases/GetTelegramMe";
import { TelegramBackendRepo } from "@infrastructure/http/bff/telegram/TelegramBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";


export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}


export async function GET(req: NextRequest) {
  try {
    const repo = new TelegramBackendRepo(getCookieString(req));
    const me = await new GetTelegramMe(repo).execute();
    const resp = NextResponse.json(me, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    console.error("Error en /api/telegram/me:", e.message);
    return NextResponse.json({ linked: false }, { status: 200 });
  }
}
