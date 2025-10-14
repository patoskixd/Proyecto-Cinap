import { NextRequest, NextResponse } from "next/server";
import { GetMySlotsPage } from "@/application/advisor/my-slots/usecases/GetMySlotsPage";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";
import type { SlotStatus } from "@/domain/advisor/mySlots";

function getCookieString(req: NextRequest): string {  
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 36);

    type StatusParam = "" | SlotStatus;
    const status = (url.searchParams.get("status") ?? "") as StatusParam;
    const date = url.searchParams.get("date") || undefined;
    const category = url.searchParams.get("category") || undefined;
    const service = url.searchParams.get("service") || undefined;
    const campus = url.searchParams.get("campus") || undefined;

    const repo = new MySlotsBackendRepo(getCookieString(req));
    const data = await new GetMySlotsPage(repo).exec({
      page, limit, status, date, category, service, campus
    });
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
