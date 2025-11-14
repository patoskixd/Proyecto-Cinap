import type {
  ReservationsRepo,
  ReservationListParams,
  ReservationListResult,
} from "../ports/ReservationsRepo";

export class GetReservationsPage {
  constructor(private readonly repo: ReservationsRepo) {}

  async exec(params: ReservationListParams): Promise<ReservationListResult> {
    return this.repo.list(params);
  }
}
