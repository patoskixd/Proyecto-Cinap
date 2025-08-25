import type { CreateSlotsInput, CreateSlotsResult, SlotRule } from "@domain/slots";
import type { SlotsRepo } from "@app/slots/ports/SlotsRepo";
import { normalizeSchedules, type UIRule } from "./NormalizeSchedules";

export class CreateSlots {
  constructor(private readonly repo: SlotsRepo) {}

  async exec(input: CreateSlotsInput & { schedules: (SlotRule & { isoDate?: string })[] }): Promise<CreateSlotsResult> {
    // 1) normalizar/validar
    const { merged, errors } = normalizeSchedules(input.schedules as UIRule[]);
    if (errors.length) {
      // en real life puedes mapear a un error de dominio
      throw new Error(errors.join("; "));
    }

    // 2) quitar meta de UI antes de pasar al repo
    const cleanSchedules: SlotRule[] = merged.map(({ isoDate, ...r }) => r);

    // 3) delegar en el repo
    return this.repo.createSlots({ ...input, schedules: cleanSchedules });
  }
}
