import { NextRequest, NextResponse } from "next/server";
import { CreateSlots } from "@/application/advisor/slots/usecases/CreateSlots";
import { SlotsBackendRepo } from "@infrastructure/http/bff/advisor/slots/SlotsBackendRepo";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new SlotsBackendRepo(getCookieString(req));
    const result = await new CreateSlots(repo).exec(body);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
