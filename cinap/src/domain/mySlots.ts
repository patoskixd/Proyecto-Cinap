export type SlotStatus = "disponible" | "ocupado" | "cancelado";

export type StudentRef = { name: string; email: string };

export type MySlot = {
  id: number;
  category: string;
  service: string;
  date: string;     // YYYY-MM-DD (local)
  time: string;     // HH:mm
  duration: number; // minutos
  location: string;
  room: string;
  status: SlotStatus;
  student: StudentRef | null;
  notes?: string;   // NUEVO: notas adicionales
};
