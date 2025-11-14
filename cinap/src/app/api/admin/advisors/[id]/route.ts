import { NextRequest, NextResponse } from "next/server";
import { UpdateAdvisor } from "@/application/admin/advisors/usecases/UpdateAdvisors";
import { AdminAdvisorsBackendRepo } from "@infrastructure/http/bff/admin/advisors/AdminAdvisorsBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json().catch(() => ({}));
    const repo = new AdminAdvisorsBackendRepo(getCookieString(req));
    const data = await new UpdateAdvisor(repo).exec(id, payload);

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
    const repo = new AdminAdvisorsBackendRepo(getCookieString(req));
    const data = await repo.remove(id); 
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
