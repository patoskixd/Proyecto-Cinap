// app/api/my-slots/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UpdateMySlot } from "@/application/advisor/my-slots/usecases/UpdateMySlot";
import { DeleteMySlot } from "@/application/advisor/my-slots/usecases/DeleteMySlot";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";

function getCookieString(req: NextRequest): string {  
  return req.headers.get("cookie") ?? "";
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json().catch(() => ({}));
    const repo = new MySlotsBackendRepo(getCookieString(req));
    const data = await new UpdateMySlot(repo).exec(id, payload);
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new MySlotsBackendRepo(getCookieString(req));
    await new DeleteMySlot(repo).exec(id);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
