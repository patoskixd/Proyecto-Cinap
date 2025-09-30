import { NextRequest, NextResponse } from "next/server";
import UpdateCategory from "@application/admin-catalog/usecases/Category/UpdateCategory";
import DeleteCategory from "@application/admin-catalog/usecases/Category/DeleteCategory";
import { AdminCatalogBackendRepo } from "@infrastructure/http/bff/admin/catalog/AdminCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic"; export const revalidate = 0;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const patch = await req.json().catch(() => ({}));
    const repo = new AdminCatalogBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new UpdateCategory(repo).exec(id, patch);
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new AdminCatalogBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    await new DeleteCategory(repo).exec(id);
    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
