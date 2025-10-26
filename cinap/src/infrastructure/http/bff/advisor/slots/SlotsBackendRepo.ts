import type { SlotsRepo } from "@/application/advisor/slots/ports/SlotsRepo";
import type { CreateSlotsData, CreateSlotsInput, CreateSlotsResult } from "@/domain/advisor/slots";

export class SlotsBackendRepo implements SlotsRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private lastSetCookies: string[] = [];

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL ??
      "";
    this.cookie = cookie;
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async getCreateSlotsData(): Promise<CreateSlotsData> {
    const res = await fetch(`${this.baseUrl}/api/slots/create-data`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudieron cargar los datos de creación");
    return this.parse<CreateSlotsData>(res);
  }

async createSlots(input: CreateSlotsInput): Promise<CreateSlotsResult> {
  const payload = {
    ...input,
    tz: "America/Santiago",
    schedules: input.schedules.map(s => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      isoDate: (s as any).isoDate ?? null,
    })),
  };

  const res = await fetch(`${this.baseUrl}/api/slots/open`, {
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

  const data = await this.parse<any>(res);
  if (!res.ok) {
    const detail = data?.detail;
    const detailMessage =
      typeof detail === "string"
        ? detail
        : typeof detail?.message === "string"
          ? detail.message
          : undefined;
    const message = detailMessage || data?.message || "No se pudieron abrir los cupos";
    const err = new Error(message);
    (err as any).detail = detail ?? data;
    (err as any).status = res.status;
    throw err;
  }
  return { createdSlots: data?.createdSlots ?? 0 };
}

}
