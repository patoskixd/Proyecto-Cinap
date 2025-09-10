// domain/mySlots.ts
export type SlotStatus = "disponible" | "ocupado" | "cancelado" | "expirado";

export type Student = { name: string; email: string };

export type MySlot = {
  id: string;                 // UUID desde backend
  category: string;
  service: string;
  date: string;               // YYYY-MM-DD (local)
  time: string;               // HH:mm (local)
  duration: number;           // minutos
  location: string;
  room: string;
  status: SlotStatus;
  student: Student | null;
  notes?: string | null;
};

