import { NextRequest, NextResponse } from "next/server";
import ReactivateCategory from "@/application/admin/catalog/usecases/Category/ReactivateCategory";
import { AdminCatalogBackendRepo } from "@infrastructure/http/bff/admin/catalog/AdminCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getCookieString = (req: NextRequest) => req.headers.get("cookie") ?? "";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new AdminCatalogBackendRepo(getCookieString(req));
    const data = await new ReactivateCategory(repo).exec(id);
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ detail: e?.detail || e?.message || "No se pudo reactivar la categoría" }, { status });
  }
}
