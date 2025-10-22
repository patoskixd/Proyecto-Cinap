import { NextRequest, NextResponse } from "next/server";
import { ListAdvisors } from "@/application/admin/advisors/usecases/ListAdvisors";
import { RegisterAdvisor } from "@/application/admin/advisors/usecases/RegisterAdvisor";
import { AdminAdvisorsBackendRepo } from "@infrastructure/http/bff/admin/advisors/AdminAdvisorsBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

function createRepos(req: NextRequest) {
  const cookies = getCookieString(req);
  const advisorsRepo = new AdminAdvisorsBackendRepo(cookies);
  return { advisorsRepo };
}

export async function GET(req: NextRequest) {
  try {
    const { advisorsRepo } = createRepos(req);
    const params = req.nextUrl.searchParams;
    const page = Number(params.get("page") ?? "1") || 1;
    const limit = Number(params.get("limit") ?? "20") || 20;
    const query = params.get("q") || undefined;
    const categoryId = params.get("category_id") || undefined;
    const serviceId = params.get("service_id") || undefined;

    const advisors = await new ListAdvisors(advisorsRepo).exec({
      page,
      limit,
      query,
      categoryId,
      serviceId,
    });
    const resp = NextResponse.json(
      {
        items: advisors.items,
        page: advisors.page,
        per_page: advisors.perPage,
        total: advisors.total,
        pages: advisors.pages,
      },
      { status: 200 },
    );
    appendSetCookies(advisorsRepo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { advisorsRepo } = createRepos(req);

    const registerRequest = {
      basic: {
        name: body?.name ?? body?.basic?.name ?? "",
        email: body?.email ?? body?.basic?.email ?? "",
      },
      categories: body?.categories ?? [],
      services: body?.service_ids ?? body?.services ?? [],
    };

    const advisor = await new RegisterAdvisor(advisorsRepo).exec(registerRequest);
    const resp = NextResponse.json(advisor, { status: 201 });
    appendSetCookies(advisorsRepo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
