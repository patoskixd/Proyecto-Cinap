import type { ReservationsRepo, ReservationsData } from "../ports/ReservationsRepo";

export class GetReservations {
  constructor(private readonly repo: ReservationsRepo) {}

  async exec(): Promise<ReservationsData> {
    const { upcoming, past } = await this.repo.list();


    const sortAsc = (a: { dateISO: string }, b: { dateISO: string }) =>
      Date.parse(a.dateISO) - Date.parse(b.dateISO);
    const sortDesc = (a: { dateISO: string }, b: { dateISO: string }) =>
      Date.parse(b.dateISO) - Date.parse(a.dateISO);

    return {
      upcoming: [...upcoming].sort(sortAsc),
      past: [...past].sort(sortDesc),
    };
  }
}
