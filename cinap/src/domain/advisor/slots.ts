export type WeekdayId = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export type SlotRule = {
  day: WeekdayId;
  startTime: string; 
  endTime: string;  
  isoDate?: string | null;
};

export type Resource = {
  id: string;
  type: string;                  
  buildingId: string;
  building: string;
  campusId: string;
  campus: string;
  alias: string;
  number?: string | null;
  capacity?: number | null;
};

export type CategoryId = string;

export type Service = {
  id: string;
  name: string;
  duration: string;
};

export type CreateSlotsData = {
  categories: CategoryId[];
  servicesByCategory: Record<CategoryId, Service[]>;
  times: string[];
  resources: Resource[];             
};

export type CreateSlotsInput = {
  advisorId?: string;
  categoryId: CategoryId;
  serviceId: string;
  recursoId?: string;                
  location: string;
  room: string;
  roomNotes?: string;
  schedules: SlotRule[];
};
