import { NextRequest, NextResponse } from "next/server";
import ReactivateBuilding from "@/application/admin/location/usecases/Buildings/ReactivateBuildings";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";


export const dynamic = "force-dynamic";
 export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new AdminLocationBackendRepo(getCookieString(req));
    const data = await new ReactivateBuilding(repo).exec(id);
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 400 }); }
}
