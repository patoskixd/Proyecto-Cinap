// application/my-slots/usecases/DeleteMySlot.ts
import type { MySlotsRepo } from "../ports/MySlotsRepo";

export class DeleteMySlot {
  constructor(private readonly repo: MySlotsRepo) {}
  async exec(id: string): Promise<void> {
    return this.repo.deleteMySlot(id);
  }
}
