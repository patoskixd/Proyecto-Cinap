import type { Category, CategoryId, Service } from "@domain/scheduling";

export type WeekdayId =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

export type SlotRule = {
  day: WeekdayId;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  type: "single" | "multiple";
};

export type CreateSlotsInput = {
  advisorId?: string; // opcional por ahora
  categoryId: CategoryId;
  serviceId: string;
  location: string;
  room: string;
  roomNotes?: string;
  schedules: SlotRule[];
};

export type CreateSlotsResult = { createdSlots: number };

export type CreateSlotsData = {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  times: string[]; // para selects de horas
};
