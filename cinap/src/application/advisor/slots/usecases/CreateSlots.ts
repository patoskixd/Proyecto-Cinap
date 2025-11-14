import type { CreateSlotsInput } from "@/domain/advisor/slots";
import type { SlotsRepo, CreateSlotsResult } from "@/application/advisor/slots/ports/SlotsRepo";
import { normalizeSchedules, type UIRule } from "./NormalizeSchedules";

export class CreateSlots {
  constructor(private readonly repo: SlotsRepo) {}

  async exec(input: CreateSlotsInput & { schedules: UIRule[] }): Promise<CreateSlotsResult> {
    const { merged, errors } = normalizeSchedules(input.schedules);
    if (errors.length) {
      throw new Error(errors.join("; "));
    }

    return this.repo.createSlots({ ...input, schedules: merged as any });
  }
}
