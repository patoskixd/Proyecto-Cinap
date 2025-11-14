
export type PendingConfirmation = {
  id: string;
  categoryLabel: string;     // “Matemáticas”, “Física”, etc.
  serviceTitle: string;      // “Cálculo Diferencial - Sesión Individual”
  teacher: string;           // “Dr. Carlos Mendoza”
  teacherEmail: string;
  dateISO: string;           // YYYY-MM-DD
  time: string;              // HH:mm (24h)
  location: string;          // “Edificio A, Piso 2”
  room: string;              // “Sala 201-A”
  createdAtISO: string;      // para “hace 2 horas”
  status: "pending"| "PENDIENTE";
};
