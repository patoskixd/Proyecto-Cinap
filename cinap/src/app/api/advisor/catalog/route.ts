import { NextRequest, NextResponse } from "next/server";
import { GetAdvisorCatalog } from "@application/advisor-catalog/usecases/GetAdvisorCatalog";
import { AdvisorCatalogBackendRepo } from "@infrastructure/http/bff/advisor/catalog/AdvisorCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") ?? "";

    const repo = new AdvisorCatalogBackendRepo(BACKEND, cookie);
    const data = await new GetAdvisorCatalog(repo).exec();

    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error cargando catálogo" }, { status: 500 });
  }
}
