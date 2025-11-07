import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AdminDocumentsBackendRepo } from "@/infrastructure/admin/documents/AdminDocumentsBackendRepo";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const repo = new AdminDocumentsBackendRepo(cookieHeader);
  try {
    const data = await repo.remove(ctx.params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Error al eliminar documento" }, { status: 500 });
  }
}
