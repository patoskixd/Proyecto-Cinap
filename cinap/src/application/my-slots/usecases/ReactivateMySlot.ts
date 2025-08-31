import type { MySlotsRepo } from "../ports/MySlotsRepo";
import type { MySlot } from "@domain/mySlots";

export class ReactivateMySlot {
  constructor(private readonly repo: MySlotsRepo) {}
  async exec(id: number): Promise<MySlot> {
    return this.repo.reactivateMySlot(id);
  }
}
