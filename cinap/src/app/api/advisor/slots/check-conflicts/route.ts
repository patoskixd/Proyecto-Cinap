import { NextRequest, NextResponse } from "next/server";
import { SlotsBackendRepo } from "@/infrastructure/http/bff/advisor/slots/SlotsBackendRepo";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new SlotsBackendRepo(getCookieString(req));
    const result = await repo.checkConflicts(body);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    const message = e?.message ?? "Error al verificar conflictos de calendario";
    return NextResponse.json({ conflicts: [], error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
