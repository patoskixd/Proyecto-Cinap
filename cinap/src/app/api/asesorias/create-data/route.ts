import { NextRequest, NextResponse } from "next/server";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const repo = new AsesoriasBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await repo.getCreateData?.(); 
    const resp = NextResponse.json(data ?? {}, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
