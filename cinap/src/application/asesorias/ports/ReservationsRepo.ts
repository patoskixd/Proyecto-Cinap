import type { Reservation } from "@domain/reservation";

export type ReservationsData = {
  upcoming: Reservation[];
  past: Reservation[];
};

export interface ReservationsRepo {
  // Si luego necesitas filtrar por usuario/docente, puedes añadir parámetros aquí
  list(): Promise<ReservationsData>;
}
