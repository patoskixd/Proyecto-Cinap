import { NextRequest, NextResponse } from "next/server";
import ListRooms from "@/application/admin/location/usecases/Rooms/ListRooms";
import CreateRoom from "@/application/admin/location/usecases/Rooms/CreateRooms";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic"; export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get("buildingId") ?? undefined;
    const repo = new AdminLocationBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new ListRooms(repo).exec({ buildingId });
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new AdminLocationBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
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
