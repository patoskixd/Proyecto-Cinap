// app/api/my-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetMySlots } from "@/application/advisor/my-slots/usecases/GetMySlots";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";

function getCookieString(req: NextRequest): string {  
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const repo = new MySlotsBackendRepo(getCookieString(req));
    const data = await new GetMySlots(repo).exec();
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
