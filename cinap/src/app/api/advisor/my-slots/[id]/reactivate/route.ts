import { NextRequest, NextResponse } from "next/server";
import { ReactivateMySlot } from "@/application/advisor/my-slots/usecases/ReactivateMySlot";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";

export const dynamic = "force-dynamic"; 
export const revalidate = 0;
function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new MySlotsBackendRepo(getCookieString(req));
    const data = await new ReactivateMySlot(repo).exec(id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
