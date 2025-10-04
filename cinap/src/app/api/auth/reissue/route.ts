import { NextRequest, NextResponse } from "next/server";
import { makeReissue } from "@application/auth/usecases/Reissue";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const repo = new AuthBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const reissueUC = makeReissue(repo);
    await reissueUC();

    const resp = new NextResponse(null, { 
      status: 204,
      headers: { "Cache-Control": "no-store" }
    });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json(
      { detail: e.message || "Token reissue failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
