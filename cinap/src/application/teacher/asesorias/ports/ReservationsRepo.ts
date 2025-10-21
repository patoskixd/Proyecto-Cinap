import type { Reservation } from "@domain/reservation";

export type ReservationTab = "upcoming" | "past";

export type ReservationListFilters = {
  status?: string;
  category?: string;
  service?: string;
  advisor?: string;
  dateFrom?: string;
};

export type ReservationListParams = {
  tab: ReservationTab;
  page: number;
  limit: number;
  filters?: ReservationListFilters;
};

export type ReservationListResult = {
  items: Reservation[];
  page: number;
  pages: number;
  total: number;
  capabilities: {
    canCancel: boolean;
    canConfirm: boolean;
  };
};

export interface ReservationsRepo {
  list(params: ReservationListParams): Promise<ReservationListResult>;
  cancel(id: string): Promise<void>;
  confirm(id: string): Promise<void>;
}
