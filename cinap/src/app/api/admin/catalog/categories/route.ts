import { NextRequest, NextResponse } from "next/server";
import ListCategories from "@application/admin-catalog/usecases/ListCategories";
import CreateCategory from "@application/admin-catalog/usecases/Category/CreateCategory";
import { AdminCatalogBackendRepo } from "@infrastructure/http/bff/admin/catalog/AdminCatalogBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic"; export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const repo = new AdminCatalogBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new ListCategories(repo).exec();
    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = new AdminCatalogBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new CreateCategory(repo).exec({ name: body?.name ?? "", description: body?.description ?? "" });
    const resp = NextResponse.json(data, { status: 201 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
