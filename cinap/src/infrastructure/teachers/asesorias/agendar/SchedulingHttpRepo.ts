import { SchedulingRepo } from "@/application/teacher/asesorias/agendar/ports/SchedulingRepo";
import { FindSlotsInput, FoundSlot, ReserveAsesoriaInput, CreateAsesoriaOut } from "@/domain/teacher/scheduling";

export class SchedulingHttpRepo implements SchedulingRepo {
  private readonly baseAsesoriasUrl = "/api/asesorias";
  private readonly baseSlotsUrl = "/api/slots";

  async findSlots(input: FindSlotsInput): Promise<FoundSlot[]> {
    const isServer = typeof window === "undefined";
    let url = `${this.baseSlotsUrl}/find`;
    const init: RequestInit = {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...(input ?? {}), tz: "America/Santiago" }),
      cache: "no-store",
    };

    if (isServer) {
      const mod = await import("next/headers");
      const h = await (mod as any).headers();
      const proto = h.get("x-forwarded-proto") || "http";
      const host = h.get("x-forwarded-host") || h.get("host");
      url = `${proto}://${host}${url}`;
      init.headers = { ...(init.headers as any), cookie: h.get("cookie") || "" };
    }

    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`Error buscando cupos: ${res.status}`);
    return (await res.json()) as FoundSlot[];
  }

  async reserve(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    const isServer = typeof window === "undefined";
    let url = this.baseAsesoriasUrl;
    const init: RequestInit = {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    };

    if (isServer) {
      const mod = await import("next/headers");
      const h = await (mod as any).headers();
      const proto = h.get("x-forwarded-proto") || "http";
      const host = h.get("x-forwarded-host") || h.get("host");
      url = `${proto}://${host}${url}`;
      init.headers = { ...(init.headers as any), cookie: h.get("cookie") || "" };
    }

    const res = await fetch(url, init);
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `Error al reservar: ${res.status}`);
    }
    return (await res.json()) as CreateAsesoriaOut;
  }

  async getCreateData(): Promise<{
    categories: any[];
    servicesByCategory: Record<string, any[]>;
    advisorsByService: Record<string, any[]>;
    times: string[];
  }> {
    const isServer = typeof window === "undefined";
    let url = `${this.baseAsesoriasUrl}/create-data`;
    const init: RequestInit = {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    };

    if (isServer) {
      const mod = await import("next/headers");
      const h = await (mod as any).headers();
      const proto = h.get("x-forwarded-proto") || "http";
      const host = h.get("x-forwarded-host") || h.get("host");
      url = `${proto}://${host}${url}`;
      init.headers = { ...(init.headers as any), cookie: h.get("cookie") || "" };
    }

    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error((await res.text().catch(() => "")) || "No se pudo cargar create-data");
    }
    return res.json();
  }
}
