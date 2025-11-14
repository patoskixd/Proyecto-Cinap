import { NextRequest, NextResponse } from "next/server";
import { GetAdvisorCatalog } from "@/application/advisor/catalog/usecases/GetAdvisorCatalog";
import { AdvisorCatalogBackendRepo } from "@infrastructure/http/bff/advisor/catalog/AdvisorCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";



export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new AdvisorCatalogBackendRepo(getCookieString(req));
    const data = await new GetAdvisorCatalog(repo).exec();

    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error cargando catálogo" }, { status: 500 });
  }
}
