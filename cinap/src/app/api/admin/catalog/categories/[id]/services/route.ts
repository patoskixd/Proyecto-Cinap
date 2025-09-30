import { NextRequest, NextResponse } from "next/server";
import CreateService from "@application/admin-catalog/usecases/Service/CreateService";
import { AdminCatalogBackendRepo } from "@infrastructure/http/bff/admin/catalog/AdminCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic"; export const revalidate = 0;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const repo = new AdminCatalogBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new CreateService(repo).exec(id, {
      name: body?.name ?? "",
      durationMinutes: Number(body?.durationMinutes ?? 0),
      active: body?.active ?? true,
    });
    const resp = NextResponse.json(data, { status: 201 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
