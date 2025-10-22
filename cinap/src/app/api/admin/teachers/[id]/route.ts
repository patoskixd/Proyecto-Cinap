import { NextRequest, NextResponse } from "next/server";
import { appendSetCookies } from "@/app/api/_utils/cookies";
import { UpdateTeacher } from "@/application/admin/teachers/usecases/UpdateTeacher";
import { DeleteTeacher } from "@/application/admin/teachers/usecases/DeleteTeacher";
import { AdminTeachersBackendRepo } from "@infrastructure/http/bff/admin/teachers/AdminTeacherBackendRepo";
import type { Teacher } from "@/domain/admin/teachers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json().catch(() => ({}));
    const repo = new AdminTeachersBackendRepo(getCookieString(req));
    const updateUC = new UpdateTeacher(repo);
    const teacher: Teacher = {
      id,
      name: payload?.name ?? payload?.basic?.name ?? "",
      email: payload?.email ?? payload?.basic?.email ?? "",
    };

    await updateUC.exec(teacher);

    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new AdminTeachersBackendRepo(getCookieString(req));
    const delUC = new DeleteTeacher(repo);
    await delUC.exec(id);

    const resp = NextResponse.json({ ok: true }, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error" }, { status: 400 });
  }
}
