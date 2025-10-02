import { NextRequest, NextResponse } from "next/server";
import { appendSetCookies } from "@/app/api/_utils/cookies";
import { GetSchedulingData } from "@application/asesorias/agendar/usecases/GetSchedulingData";
import { CreateAsesoria } from "@application/asesorias/agendar/usecases/CreateAsesoria";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";


const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

const CL_TZ = "America/Santiago";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);


    const input: any = {
      serviceId: url.searchParams.get("serviceId") ?? undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined,
      campusId: url.searchParams.get("campusId") ?? undefined,
      buildingId: url.searchParams.get("buildingId") ?? undefined,
      resourceId: url.searchParams.get("resourceId") ?? undefined,
      tz: CL_TZ,
    };


    const singleDate = url.searchParams.get("date");
    if (singleDate && !input.dateFrom && !input.dateTo) {
      input.dateFrom = singleDate;
      input.dateTo = singleDate;
    }

    const repo = new AsesoriasBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const data = await new GetSchedulingData(repo).exec(input);

    const resp = NextResponse.json(data, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error buscando cupos" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json().catch(() => ({}))) as any;

    const payload = {
      cupo_id: raw.cupo_id ?? raw.cupoId,
      origen: raw.origen ?? null,
      notas: raw.notas ?? null,
      tz: CL_TZ,
    };

    const repo = new AsesoriasBackendRepo(BACKEND, req.headers.get("cookie") ?? "");
    const out = await new CreateAsesoria(repo).exec(payload as any);

    const resp = NextResponse.json(out, { status: 200 });
    appendSetCookies(repo.getSetCookies?.() ?? [], resp);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Error al reservar" }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
