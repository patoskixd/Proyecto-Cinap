import type { Advisor, Category, CategoryId, Service } from "@domain/scheduling";

export type SchedulingData = {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  advisorsByService: Record<string, Advisor[]>;
  daysShort: string[];
  times: string[];
  defaultTimezone: string;
};

export interface SchedulingRepo {
  getSchedulingData(): Promise<SchedulingData>;
}
