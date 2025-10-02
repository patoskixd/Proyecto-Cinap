// app/api/my-slots/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UpdateMySlot } from "@application/my-slots/usecases/UpdateMySlot";
import { DeleteMySlot } from "@application/my-slots/usecases/DeleteMySlot";
import { MySlotsBackendRepo } from "@infrastructure/http/bff/advisor/my-slots/MySlotsBackendRepo";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json().catch(() => ({}));
    const repo = new MySlotsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new UpdateMySlot(repo).exec(id, payload);
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const repo = new MySlotsBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    await new DeleteMySlot(repo).exec(id);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
