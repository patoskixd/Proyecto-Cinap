import { NextRequest, NextResponse } from "next/server";
import { ListAdvisors } from "@application/admin-advisors/usecases/ListAdvisors";
import { RegisterAdvisor } from "@application/admin-advisors/usecases/RegisterAdvisor";
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
    const advisors = await new ListAdvisors(advisorsRepo).exec();
    const resp = NextResponse.json(advisors, { status: 200 });
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
