import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export interface ConfirmationsRepo {
  getPending(): Promise<PendingConfirmation[]>;
}
