import { NextRequest, NextResponse } from "next/server";
import { appendSetCookies } from "@/app/api/_utils/cookies";
import { ListTeachers } from "@/application/admin/teachers/usecases/ListTeachers";
import { AdminTeachersBackendRepo } from "@infrastructure/http/bff/admin/teachers/AdminTeacherBackendRepo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new AdminTeachersBackendRepo(getCookieString(req));
    const listUC = new ListTeachers(repo);
    const teachers = await listUC.exec();

    const resp = NextResponse.json(teachers, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error" }, { status: 500 });
  }
}
