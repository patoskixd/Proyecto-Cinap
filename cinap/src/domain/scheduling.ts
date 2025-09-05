export type CategoryId = "academica" | "investigacion" | "tesis" | "tecnologia";

export interface Category {
  id: CategoryId;
  icon: string;      
  name: string;
  description: string;
}

export interface Service {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  duration: string;   
}

export interface Advisor {
  id: string;
  name: string;
  email: string;
  specialties: string[];
}

export type TimezoneId = string; 

export interface SlotSelection {
  dayIndex: number;   
  start: string;      
  end: string;        
  timezone: TimezoneId;
}

export interface WizardState {
  categoryId?: CategoryId;
  serviceId?: string;
  advisorId?: string;
  slot?: SlotSelection | null;
  notes?: string;
}
