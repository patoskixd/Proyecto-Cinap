// application/my-slots/usecases/UpdateMySlot.ts
import type { MySlotsRepo } from "../ports/MySlotsRepo";
import type { MySlot } from "@/domain/advisor/mySlots";

export class UpdateMySlot {
  constructor(private readonly repo: MySlotsRepo) {}
  async exec(id: string, patch: Partial<MySlot>): Promise<MySlot> {
    return this.repo.updateMySlot(id, patch);
  }
}
