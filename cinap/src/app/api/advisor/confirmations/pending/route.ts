import { NextRequest, NextResponse } from "next/server";
import { GetPendingConfirmations } from "@/application/advisor/confirmations/usecases/GetPendingConfirmations";
import { ConfirmationsBackendRepo } from "@infrastructure/http/bff/advisor/confirmations/ConfirmationsBackendRepo";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new ConfirmationsBackendRepo(getCookieString(req));
    const data = await new GetPendingConfirmations(repo).exec();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
