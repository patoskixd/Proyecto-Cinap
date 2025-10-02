import { NextRequest, NextResponse } from "next/server";
import { GetTelegramLink } from "@application/telegram/usecases/GetTelegramLink";
import { UnlinkTelegram } from "@application/telegram/usecases/UnlinkTelegram";
import { TelegramBackendRepo } from "@infrastructure/http/bff/telegram/TelegramBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const repo = new TelegramBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
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
    const repo = new TelegramBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    await new UnlinkTelegram(repo).execute();
    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
