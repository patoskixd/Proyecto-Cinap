import type { PendingConfirmation } from "@domain/confirmations";

export interface ConfirmationsRepo {
  getPending(): Promise<PendingConfirmation[]>;
}
