import type { CreateSlotsInput, CreateSlotsResult, SlotRule } from "@domain/slots";
import type { SlotsRepo } from "@application/slots/ports/SlotsRepo";
import { normalizeSchedules, type UIRule } from "./NormalizeSchedules";

export class CreateSlots {
  constructor(private readonly repo: SlotsRepo) {}

  async exec(input: CreateSlotsInput & { schedules: (SlotRule & { isoDate?: string })[] }): Promise<CreateSlotsResult> {

    const { merged, errors } = normalizeSchedules(input.schedules as UIRule[]);
    if (errors.length) {

      throw new Error(errors.join("; "));
    }

    const cleanSchedules: SlotRule[] = merged.map(({ isoDate, ...r }) => r);


    return this.repo.createSlots({ ...input, schedules: cleanSchedules });
  }
}
