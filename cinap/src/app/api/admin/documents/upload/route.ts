import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AdminDocumentsBackendRepo } from "@/infrastructure/admin/documents/AdminDocumentsBackendRepo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const repo = new AdminDocumentsBackendRepo(cookieHeader);

  const form = await req.formData();
  if (!form.get("file")) {
    return NextResponse.json({ detail: "Archivo requerido" }, { status: 400 });
  }

  try {
    const data = await repo.upload(form);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Error al subir documento" }, { status: 500 });
  }
}
