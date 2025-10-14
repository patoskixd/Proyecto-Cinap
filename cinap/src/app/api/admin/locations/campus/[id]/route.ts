import { NextRequest, NextResponse } from "next/server";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import UpdateCampus from "@application/admin/location/usecases/Campus/UpdateCampus";
import DeleteCampus from "@application/admin/location/usecases/Campus/DeleteCampus";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";


type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const repo = new AdminLocationBackendRepo(getCookieString(req));
  const data = await new UpdateCampus(repo).exec(id, body);
  const resp = NextResponse.json(data, { status: 200 });
  appendSetCookies(repo.getSetCookies?.() ?? [], resp);
  return resp;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const repo = new AdminLocationBackendRepo(getCookieString(req));
  const data = await new UpdateCampus(repo).exec(id, body);
  const resp = NextResponse.json(data, { status: 200 });
  appendSetCookies(repo.getSetCookies?.() ?? [], resp);
  return resp;
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const repo = new AdminLocationBackendRepo(getCookieString(req));
  await new DeleteCampus(repo).exec(id);
  const resp = NextResponse.json({ ok: true }, { status: 200 });
  appendSetCookies(repo.getSetCookies?.() ?? [], resp);
  return resp;
}
