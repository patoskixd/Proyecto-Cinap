import { NextRequest, NextResponse } from "next/server";
import ListCampusPage from "@/application/admin/location/usecases/Campus/ListCampusPage";
import CreateCampus from "@/application/admin/location/usecases/Campus/CreateCampus";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic"; export const revalidate = 0;
const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Number(searchParams.get("page")  ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const q     = searchParams.get("q") ?? undefined;
    const activeParam = searchParams.get("active");
    const active = activeParam === null ? undefined : activeParam === "true" ? true : activeParam === "false" ? false : undefined;

    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new ListCampusPage(repo).exec({ page, limit, q, active });
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new CreateCampus(repo).exec({ name: body?.name ?? "", address: body?.address ?? "" , code: body?.code ?? "" });
    const resp = NextResponse.json(data, { status: 201 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
