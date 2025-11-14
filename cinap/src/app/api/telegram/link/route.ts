import { NextRequest, NextResponse } from "next/server";
import { GetTelegramLink } from "@application/telegram/usecases/GetTelegramLink";
import { UnlinkTelegram } from "@application/telegram/usecases/UnlinkTelegram";
import { TelegramBackendRepo } from "@infrastructure/http/bff/telegram/TelegramBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";


export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const repo = new TelegramBackendRepo(getCookieString(req));
    const out = await new GetTelegramLink(repo).execute();
    const resp = NextResponse.json(out, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const repo = new TelegramBackendRepo(getCookieString(req));
    await new UnlinkTelegram(repo).execute();
    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
