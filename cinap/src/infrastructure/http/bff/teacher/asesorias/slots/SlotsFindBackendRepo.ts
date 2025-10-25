import type { SchedulingRepo } from "@/application/teacher/asesorias/agendar/ports/SchedulingRepo";
import type { FindSlotsInput, FoundSlot, ReserveAsesoriaInput, CreateAsesoriaOut } from "@/domain/teacher/scheduling";
import { AsesoriasBackendRepo } from "@infrastructure/http/bff/teacher/asesorias/agendar/SchedulingBackendRepo";

export class SlotsFindBackendRepo implements SchedulingRepo {
  private inner: AsesoriasBackendRepo;
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL ?? "";
    this.cookie = cookie;
    this.inner = new AsesoriasBackendRepo(cookie); 
  }

  getSetCookies(): string[] {
    return typeof (this.inner as any).getSetCookies === "function"
      ? (this.inner as any).getSetCookies()
      : [];
  }

  async findSlots(input: FindSlotsInput): Promise<FoundSlot[]> {
    return this.inner.findSlots(input);
  }

  async reserve(_input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    void _input;
    throw new Error("SlotsFindBackendRepo no soporta reserve(). Usa AsesoriasBackendRepo.");
  }
}
