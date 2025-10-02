import type { ConfirmationsRepo } from "@application/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@domain/confirmations";

export class GetPendingConfirmations {
  constructor(private readonly repo: ConfirmationsRepo) {}
  async exec(): Promise<PendingConfirmation[]> {
    return this.repo.getPending();
  }
}
