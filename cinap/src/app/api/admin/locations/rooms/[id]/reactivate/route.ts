import { NextRequest, NextResponse } from "next/server";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import ReactivateRoom from "@application/admin/location/usecases/Rooms/ReactivateRooms";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const repo = new AdminLocationBackendRepo(getCookieString(req));
  const data = await new ReactivateRoom(repo).exec(id);
  const resp = NextResponse.json(data, { status: 200 });
  appendSetCookies(repo.getSetCookies?.() ?? [], resp);
  return resp;
}
