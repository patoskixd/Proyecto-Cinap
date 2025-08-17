// src/domain/scheduling.ts
export type CategoryId = "academica" | "investigacion" | "tesis" | "tecnologia";

export interface Category {
  id: CategoryId;
  icon: string;       // emoji
  name: string;
  description: string;
}

export interface Service {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  duration: string;   // "60 min", "90 min"
}

export interface Advisor {
  id: string;
  name: string;
  email: string;
  specialties: string[];
}

export type TimezoneId = string; // p.ej. "America/Santiago"

export interface SlotSelection {
  dayIndex: number;   // 0..4 (Lun..Vie)
  start: string;      // "09:00"
  end: string;        // "10:00"
  timezone: TimezoneId;
}

export interface WizardState {
  categoryId?: CategoryId;
  serviceId?: string;
  advisorId?: string;
  slot?: SlotSelection | null;
  notes?: string;
}
