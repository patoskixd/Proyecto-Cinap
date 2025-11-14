import { NextRequest, NextResponse } from "next/server";
import ListBuildingsPage from "@application/admin/location/usecases/Buildings/ListBuildingsPage";
import CreateBuilding from "@application/admin/location/usecases/Buildings/CreateBuilding";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campusId = searchParams.get("campusId") ?? undefined;
    const page  = Number(searchParams.get("page")  ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const q     = searchParams.get("q") ?? undefined;
    const activeParam = searchParams.get("active");
    const active = activeParam === null ? undefined : activeParam === "true" ? true : activeParam === "false" ? false : undefined;

    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new ListBuildingsPage(repo).exec({ campusId, page, limit, q, active });
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ detail: e?.detail ?? e?.message ?? "Error" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new CreateBuilding(repo).exec({ name: body?.name ?? "", campusId: body?.campusId ?? "", code: body?.code ?? "" });
    const resp = NextResponse.json(data, { status: 201 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ detail: e?.detail ?? e?.message ?? "Error" }, { status });
  }
}
