import { NextRequest, NextResponse } from "next/server";
import { CreateAsesoria } from "@/application/teacher/asesorias/agendar/usecases/CreateAsesoria";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";
import type { ReserveAsesoriaInput } from "@/domain/teacher/scheduling";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json().catch(() => ({}))) as any;

    
    const payload: ReserveAsesoriaInput = {
      cupo_id: raw.cupo_id ?? raw.cupoId,
      origen: raw.origen ?? null,
      notas: raw.notas ?? null,
    };

    const repo = new AsesoriasBackendRepo(getCookieString(req));
    const out = await new CreateAsesoria(repo).exec(payload);

    const resp = NextResponse.json(out, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
