import type { ReservationsRepo } from "../ports/ReservationsRepo";

export class ConfirmReservation {
  constructor(private readonly repo: ReservationsRepo) {}

  async exec(id: string): Promise<void> {
    await this.repo.confirm(id);
  }
}
