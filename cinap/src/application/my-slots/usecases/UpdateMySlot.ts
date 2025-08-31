import type { MySlotsRepo } from "../ports/MySlotsRepo";
import type { MySlot } from "@domain/mySlots";

export class UpdateMySlot {
  constructor(private readonly repo: MySlotsRepo) {}
  async exec(id: number, patch: Partial<MySlot>): Promise<MySlot> {
    return this.repo.updateMySlot(id, patch);
  }
}
