import { NextRequest, NextResponse } from "next/server";
import { UpdateAdvisor } from "@application/admin-advisors/usecases/UpdateAdvisors";
import { AdminAdvisorsBackendRepo } from "@infrastructure/http/bff/admin/advisors/AdminAdvisorsBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const repo = new AdminAdvisorsBackendRepo(req.headers.get("cookie") ?? "");

    const updateReq = { services: body?.services ?? body?.service_ids ?? [] };
    const data = await new UpdateAdvisor(repo).exec(id, updateReq);

    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
