import { NextRequest, NextResponse } from "next/server";
import { GetCreateSlotsData } from "@application/slots/usecases/GetCreateSlotsData";
import { SlotsBackendRepo } from "@infrastructure/http/bff/advisor/slots/SlotsBackendRepo";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const repo = new SlotsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new GetCreateSlotsData(repo).exec();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
