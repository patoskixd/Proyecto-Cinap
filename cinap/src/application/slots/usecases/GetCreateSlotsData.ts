import type { CreateSlotsData } from "@domain/slots";
import type { SlotsRepo } from "@app/slots/ports/SlotsRepo";

export class GetCreateSlotsData {
  constructor(private readonly repo: SlotsRepo) {}

  async exec(): Promise<CreateSlotsData> {
    return this.repo.getCreateSlotsData();
  }
}
