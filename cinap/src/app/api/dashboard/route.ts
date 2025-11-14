import { NextRequest, NextResponse } from "next/server";
import { GetDashboard } from "@/application/dashboard/usecases/GetDashboard";
import { DashboardBackendRepo } from "@/infrastructure/http/bff/dashboard/DasboardBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") || "").toLowerCase() as "admin" | "teacher" | "advisor";
    const userId = searchParams.get("userId") || undefined;

    const repo = new DashboardBackendRepo(getCookieString(req));
    const data = await new GetDashboard(repo).exec({ role, userId });

    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies?.(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error cargando dashboard" }, { status: 500 });
  }
}
