import { NextRequest, NextResponse } from "next/server";
import ListRoomsPage from "@/application/admin/location/usecases/Rooms/ListRoomsPage";
import CreateRoom from "@/application/admin/location/usecases/Rooms/CreateRooms";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic"; export const revalidate = 0;
const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get("buildingId") ?? undefined;
    const page  = Number(searchParams.get("page")  ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const q     = searchParams.get("q") ?? undefined;
    const activeParam = searchParams.get("active");
    const active = activeParam === null ? undefined : activeParam === "true" ? true : activeParam === "false" ? false : undefined;

    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new ListRoomsPage(repo).exec({ buildingId, page, limit, q, active });
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new CreateRoom(repo).exec({
      name: body?.name ?? "",
      buildingId: body?.buildingId ?? "",
      number: body?.number ?? "",
      type: body?.type ?? "aula",
      capacity: Number(body?.capacity ?? 0),
    });
    const resp = NextResponse.json(data, { status: 201 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 400 }); }
}
