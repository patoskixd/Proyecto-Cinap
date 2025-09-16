import { SchedulingRepo } from "@/application/asesorias/agendar/ports/SchedulingRepo";
import { FindSlotsInput, FoundSlot, ReserveAsesoriaInput, CreateAsesoriaOut } from "@/domain/scheduling";

export class SchedulingHttpRepo implements SchedulingRepo {
  async findSlots(input: FindSlotsInput): Promise<FoundSlot[]> {
    const res = await fetch("/api/slots/find", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input ?? {}),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Error buscando cupos: ${res.status}`);
    const data = await res.json();
    return data as FoundSlot[];
  }

  async reserve(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    const res = await fetch("/api/asesorias/agendar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `Error al reservar: ${res.status}`);
    }
    return (await res.json()) as CreateAsesoriaOut;
  }
}

