import { NextRequest, NextResponse } from "next/server";
import UpdateCampus from "@application/admin-location/usecases/Campus/UpdateCampus";
import DeleteCampus from "@application/admin-location/usecases/Campus/DeleteCampus";
import { AdminLocationBackendRepo } from "@infrastructure/http/bff/admin/locations/AdminLocationBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic"; export const revalidate = 0;

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const patch = await req.json().catch(() => ({}));
    const repo = new AdminLocationBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new UpdateCampus(repo).exec(id, patch);
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PUT(req, ctx); // mismo caso de uso; el repo decide PUT/PATCH según patch.active
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new AdminLocationBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    await new DeleteCampus(repo).exec(id);
    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 400 }); }
}
