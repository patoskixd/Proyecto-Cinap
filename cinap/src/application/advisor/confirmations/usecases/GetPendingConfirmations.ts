import type { ConfirmationsRepo } from "@/application/advisor/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export class GetPendingConfirmations {
  constructor(private readonly repo: ConfirmationsRepo) {}
  async exec(): Promise<PendingConfirmation[]> {
    return this.repo.getPending();
  }
}
