// app/api/my-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetMySlots } from "@application/my-slots/usecases/GetMySlots";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const repo = new MySlotsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new GetMySlots(repo).exec();
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
