import { NextRequest, NextResponse } from "next/server";
import { GetPendingConfirmations } from "@application/confirmations/usecases/GetPendingConfirmations";
import { ConfirmationsBackendRepo } from "@infrastructure/http/bff/advisor/confirmations/ConfirmationsBackendRepo";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const repo = new ConfirmationsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new GetPendingConfirmations(repo).exec();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
