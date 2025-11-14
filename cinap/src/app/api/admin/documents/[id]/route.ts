import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AdminDocumentsBackendRepo } from "@/infrastructure/http/bff/admin/documents/AdminDocumentsBackendRepo";
import { DeleteDocument } from "@/application/admin/documents/usecases/DeleteDocument";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const { id } = await ctx.params;
  
  const repo = new AdminDocumentsBackendRepo(cookieHeader);
  const useCase = new DeleteDocument(repo);
  
  try {
    const data = await useCase.execute(id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Error al eliminar documento" }, { status: 500 });
  }
}
