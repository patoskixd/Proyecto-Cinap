import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AdminDocumentsBackendRepo } from "@/infrastructure/admin/documents/AdminDocumentsBackendRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const repo = new AdminDocumentsBackendRepo(cookieHeader);

  try {
    const items = await repo.list();
    return NextResponse.json(items, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message }, { status: 500 });
  }
}