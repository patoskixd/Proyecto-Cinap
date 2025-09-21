
export type CategoryId = string;

export type Category = {
  id: string;
  icon: string;
  name: string;
  description: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string; 
};

export type Advisor = {
  id: string;
  name: string;
  email: string;
  specialties: string[];
};

export type WizardState = {
  categoryId?: CategoryId;
  serviceId?: string;
  advisorId?: string;
  slot: {
    dayIndex: number;
    start: string;
    end: string;
    timezone: string;
    date: string;
    cupoId: string;
    location?: string;
    room?: string;
  } | null;
  notes: string;
};
