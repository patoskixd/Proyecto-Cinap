import type { CreateSlotsData } from "@/domain/advisor/slots";
import type { SlotsRepo } from "@/application/advisor/slots/ports/SlotsRepo";

export class GetCreateSlotsData {
  constructor(private readonly repo: SlotsRepo) {}

  async exec(): Promise<CreateSlotsData> {
    return this.repo.getCreateSlotsData();
  }
}
