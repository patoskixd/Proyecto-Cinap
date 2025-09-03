import type { Reservation } from "@domain/reservation";

export type ReservationsData = {
  upcoming: Reservation[];
  past: Reservation[];
};

export interface ReservationsRepo {

  list(): Promise<ReservationsData>;
}
