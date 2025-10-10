import { NextRequest, NextResponse } from "next/server";
import ListCampus from "@/application/admin/location/usecases/Campus/ListCampus";
import CreateCampus from "@/application/admin/location/usecases/Campus/CreateCampus";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic"; export const revalidate = 0;


function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new ListCampus(repo).exec();
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
