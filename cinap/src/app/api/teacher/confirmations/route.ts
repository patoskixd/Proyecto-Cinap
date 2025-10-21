import { NextRequest, NextResponse } from "next/server";
import { GetTeacherPendingConfirmations } from "@/application/teacher/confirmations/usecases/GetPendingConfirmations";
import { TeacherConfirmationsBackendRepo } from "@/infrastructure/http/bff/teacher/confirmations/TeacherConfirmationsBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new TeacherConfirmationsBackendRepo(getCookieString(req));
    const data = await new GetTeacherPendingConfirmations(repo).exec();

    const res = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], res);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "BFF error" },
      { status: 500 }
    );
  }
}
