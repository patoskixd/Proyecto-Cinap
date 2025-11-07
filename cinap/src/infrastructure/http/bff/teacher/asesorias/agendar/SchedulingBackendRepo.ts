import type { SchedulingRepo } from "@/application/teacher/asesorias/agendar/ports/SchedulingRepo";
import type {
  ReserveAsesoriaInput,
  CreateAsesoriaOut,
  FindSlotsInput,
  FoundSlot,
  CheckConflictsInput,
  CheckConflictsOutput,
} from "@/domain/teacher/scheduling";

const CL_TZ = "America/Santiago";

function toLocalParts(isoOrEpoch: string | number, tz = CL_TZ) {
  const d = typeof isoOrEpoch === "number" ? new Date(isoOrEpoch) : new Date(isoOrEpoch);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

// Normaliza el slot recibido del backend a tu dominio
function toFoundSlot(dto: any): FoundSlot {
  const rawDateTime =
    dto.inicio ??
    dto.starts_at ??
    dto.start_at ??
    dto.datetime ??
    dto.when ??
    dto.dateTime ??
    null;

  let dateISO: string | undefined = dto.dateISO ?? dto.date;
  let time: string | undefined = dto.time ?? dto.hora;

  if (rawDateTime) {
    const loc = toLocalParts(rawDateTime, CL_TZ);
    dateISO = loc.dateISO;
    time = loc.time;
  }

  return {
    cupoId: dto.cupoId ?? dto.slotId ?? dto.id,
    serviceId: dto.serviceId,
    category: dto.category ?? dto.categoryName,
    service: dto.service ?? dto.serviceName,
    date: dateISO ?? "",
    time: (time ?? "").slice(0, 5),
    duration: dto.duration ?? 0,
    campus: dto.campus ?? null,
    building: dto.building ?? null,
    roomNumber: dto.roomNumber ?? null,
    resourceAlias: dto.resourceAlias ?? null,
    notas: dto.notes ?? null,
  };
}

export class AsesoriasBackendRepo implements SchedulingRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL ?? 
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    this.cookie = cookie;
  }

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  private collectSetCookies(res: Response) {
    this.lastSetCookies = [];
    const anyHeaders = res.headers as any;
    const rawList: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];
    this.lastSetCookies.push(...rawList);
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try {
      return JSON.parse(txt) as T;
    } catch {
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }

  async findSlots(input: FindSlotsInput): Promise<FoundSlot[]> {
    const payload = { ...(input ?? {}), tz: CL_TZ };

    const res = await fetch(`${this.baseUrl}/api/slots/find`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        cookie: this.cookie,
      },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron obtener cupos");
    const raw = await this.parse<any[]>(res);
    return raw.map(toFoundSlot);
  }

  async reserve(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    const payload: any = { ...(input as any), tz: CL_TZ };

    const res = await fetch(`${this.baseUrl}/api/asesorias`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        cookie: this.cookie,
      },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo crear la asesoría");
    return data as CreateAsesoriaOut;
  }

  async getCreateData(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/asesorias/create-data`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok)
      throw new Error(data?.detail || data?.message || "No se pudo cargar create-data");
    return data;
  }

  async checkConflicts(input: CheckConflictsInput): Promise<CheckConflictsOutput> {
    const res = await fetch(`${this.baseUrl}/api/calendar/check-conflicts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        cookie: this.cookie,
      },
      credentials: "include",
      body: JSON.stringify(input),
      cache: "no-store",
    });

    this.collectSetCookies(res);
    
    if (!res.ok) {
      return { conflicts: [] };
    }
    
    const data = await this.parse<CheckConflictsOutput>(res);
    return data;
  }
}
