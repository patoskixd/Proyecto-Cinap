import type { MySlotsRepo } from "../ports/MySlotsRepo";
import type { MySlot } from "@domain/mySlots";

export class GetMySlots {
  constructor(private readonly repo: MySlotsRepo) {}
  async exec(): Promise<MySlot[]> {
    return this.repo.getMySlots();
  }
}
