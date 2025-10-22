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
    const params = req.nextUrl.searchParams;
    const page = Number(params.get("page") ?? "1") || 1;
    const limit = Number(params.get("limit") ?? "20") || 20;
    const query = params.get("q") || undefined;

    const teachers = await listUC.exec({ page, limit, query });

    const resp = NextResponse.json(
      {
        items: teachers.items,
        page: teachers.page,
        per_page: teachers.perPage,
        total: teachers.total,
        pages: teachers.pages,
      },
      { status: 200 },
    );
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error" }, { status: 500 });
  }
}
