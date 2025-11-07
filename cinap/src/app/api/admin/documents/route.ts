import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AdminDocumentsBackendRepo } from "@/infrastructure/http/bff/admin/documents/AdminDocumentsBackendRepo";
import { ListDocuments } from "@/application/admin/documents/usecases/ListDocuments";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const repo = new AdminDocumentsBackendRepo(cookieHeader);
  const useCase = new ListDocuments(repo);

  try {
    const items = await useCase.execute();
    return NextResponse.json(items, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message }, { status: 500 });
  }
}