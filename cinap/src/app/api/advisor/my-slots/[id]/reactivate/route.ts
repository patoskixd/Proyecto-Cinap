import { NextRequest, NextResponse } from "next/server";
import { ReactivateMySlot } from "@application/my-slots/usecases/ReactivateMySlot";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic"; 
export const revalidate = 0;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new MySlotsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new ReactivateMySlot(repo).exec(id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
