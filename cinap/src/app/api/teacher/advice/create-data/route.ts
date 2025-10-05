import { NextRequest, NextResponse } from "next/server";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}
export async function GET(req: NextRequest) {
  try {
    const repo = new AsesoriasBackendRepo(getCookieString(req));
    const data = await repo.getCreateData?.(); 
    const resp = NextResponse.json(data ?? {}, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
