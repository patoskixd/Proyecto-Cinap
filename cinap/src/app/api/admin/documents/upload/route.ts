import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AdminDocumentsBackendRepo } from "@/infrastructure/http/bff/admin/documents/AdminDocumentsBackendRepo";
import { UploadDocument } from "@/application/admin/documents/usecases/UploadDocument";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const repo = new AdminDocumentsBackendRepo(cookieHeader);
  const useCase = new UploadDocument(repo);

  const form = await req.formData();
  if (!form.get("file")) {
    return NextResponse.json({ detail: "Archivo requerido" }, { status: 400 });
  }

  try {
    const data = await useCase.execute(form);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Error al subir documento" }, { status: 500 });
  }
}
