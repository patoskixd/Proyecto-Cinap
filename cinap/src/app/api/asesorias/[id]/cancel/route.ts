import { NextRequest, NextResponse } from "next/server";

import { appendSetCookies } from "@/app/api/_utils/cookies";
import { ReservationsBackendRepo } from "@/infrastructure/http/bff/reservations/ReservationsBackendRepo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const repo = new ReservationsBackendRepo(getCookieString(req));
    const { id } = await context.params;

    await repo.cancel(id);

    const res = NextResponse.json({ success: true }, { status: 200 });
    appendSetCookies?.(repo.getSetCookies?.() ?? [], res);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "No se pudo cancelar la asesoría" },
      { status: 500 }
    );
  }
}
