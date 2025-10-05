// application/my-slots/usecases/ReactivateMySlot.ts
import type { MySlotsRepo } from "@/application/advisor/my-slots/ports/MySlotsRepo";
import type { MySlot } from "@/domain/advisor/mySlots";

export class ReactivateMySlot {
  constructor(private repo: MySlotsRepo) {}

  async exec(id: string): Promise<MySlot> {
    return this.repo.reactivateMySlot(id);
  }
}
