import type { MySlotsRepo } from "../ports/MySlotsRepo";

export class DeleteMySlot {
  constructor(private readonly repo: MySlotsRepo) {}
  async exec(id: number): Promise<void> {
    return this.repo.deleteMySlot(id);
  }
}
