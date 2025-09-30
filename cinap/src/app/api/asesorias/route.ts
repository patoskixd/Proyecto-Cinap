import { NextRequest, NextResponse } from "next/server";
import { CreateAsesoria } from "@application/asesorias/agendar/usecases/CreateAsesoria";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";
import type { ReserveAsesoriaInput } from "@domain/scheduling";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json().catch(() => ({}))) as any;

    
    const payload: ReserveAsesoriaInput = {
      cupo_id: raw.cupo_id ?? raw.cupoId,
      origen: raw.origen ?? null,
      notas: raw.notas ?? null,
    };

    const repo = new AsesoriasBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const out = await new CreateAsesoria(repo).exec(payload);

    const resp = NextResponse.json(out, { status: 200 });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 });
  }
}
