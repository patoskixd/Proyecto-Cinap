import { NextRequest, NextResponse } from "next/server";
import UpdateService from "@/application/admin/catalog/usecases/Service/UpdateService";
import DeleteService from "@/application/admin/catalog/usecases/Service/DeleteService";
import { AdminCatalogBackendRepo } from "@infrastructure/http/bff/admin/catalog/AdminCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const patch = await req.json().catch(() => ({}));
    const repo = new AdminCatalogBackendRepo(getCookieString(req));
    const data = await new UpdateService(repo).exec(id, patch);
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ detail: e?.detail || e?.message || "Error al actualizar el servicio" }, { status });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const repo = new AdminCatalogBackendRepo(getCookieString(req));
    await new DeleteService(repo).exec(id);
    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json(
      typeof e?.detail === "object" ? e.detail : { detail: e?.detail || e?.message || "Error al eliminar el servicio" },
      { status }
    );
  }
}
