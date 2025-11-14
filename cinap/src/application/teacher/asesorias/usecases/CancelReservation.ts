import type { ReservationsRepo } from "../ports/ReservationsRepo";

export class CancelReservation {
  constructor(private readonly repo: ReservationsRepo) {}

  async exec(id: string): Promise<void> {
    await this.repo.cancel(id);
  }
}
