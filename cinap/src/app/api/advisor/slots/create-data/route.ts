import { NextRequest, NextResponse } from "next/server";
import { GetCreateSlotsData } from "@/application/advisor/slots/usecases/GetCreateSlotsData";
import { SlotsBackendRepo } from "@/infrastructure/http/bff/advisor/slots/SlotsBackendRepo";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new SlotsBackendRepo(getCookieString(req));
    const data = await new GetCreateSlotsData(repo).exec();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    const message = e?.message ?? "Error al cargar datos para crear cupos";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}