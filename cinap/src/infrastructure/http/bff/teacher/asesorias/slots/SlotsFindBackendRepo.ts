import type { SchedulingRepo } from "@application/asesorias/agendar/ports/SchedulingRepo";
import type { FindSlotsInput, FoundSlot, ReserveAsesoriaInput, CreateAsesoriaOut } from "@domain/scheduling";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";

export class SlotsFindBackendRepo implements SchedulingRepo {
  private inner: AsesoriasBackendRepo;

  constructor(private readonly baseUrl: string, private readonly cookie: string) {
    this.inner = new AsesoriasBackendRepo(baseUrl, cookie);
  }

  getSetCookies(): string[] {
    return typeof (this.inner as any).getSetCookies === "function"
      ? (this.inner as any).getSetCookies()
      : [];
  }

  async findSlots(input: FindSlotsInput): Promise<FoundSlot[]> {
    return this.inner.findSlots(input);
  }

  async reserve(_: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    throw new Error("SlotsFindBackendRepo no soporta reserve(). Usa AsesoriasBackendRepo.");
  }
}
