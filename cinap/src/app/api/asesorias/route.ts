import { NextRequest, NextResponse } from "next/server";

import { appendSetCookies } from "@/app/api/_utils/cookies";
import { ReservationsBackendRepo } from "@/infrastructure/http/bff/reservations/ReservationsBackendRepo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const kind = (url.searchParams.get("kind") ?? "upcoming") as "upcoming" | "past";
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "30");
    const status = url.searchParams.get("status") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const service = url.searchParams.get("service") ?? undefined;
    const advisor = url.searchParams.get("advisor") ?? undefined;
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;

    const repo = new ReservationsBackendRepo(getCookieString(req));
    const result = await repo.list({
      tab: kind,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 30,
      filters: { status, category, service, advisor, dateFrom },
    });

    const res = NextResponse.json(result, { status: 200 });
    appendSetCookies?.(repo.getSetCookies?.() ?? [], res);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "Error al cargar asesorías" },
      { status: 500 }
    );
  }
}
