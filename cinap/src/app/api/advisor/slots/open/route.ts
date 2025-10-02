import { NextRequest, NextResponse } from "next/server";
import { CreateSlots } from "@application/slots/usecases/CreateSlots";
import { SlotsBackendRepo } from "@infrastructure/http/bff/advisor/slots/SlotsBackendRepo";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new SlotsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const result = await new CreateSlots(repo).exec(body);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
