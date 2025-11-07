export type FoundSlot = {
  cupoId: string;
  serviceId: string;
  category: string;
  service: string;
  date: string; 
  time: string; 
  duration: number;
  campus?: string | null;
  building?: string | null;
  roomNumber?: string | null;
  resourceAlias?: string | null;
  notas?: string | null;
};

export type FindSlotsInput = {
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  campusId?: string;
  buildingId?: string;
  resourceId?: string;
  tz?: string;
};

export type ReserveAsesoriaInput = {
  cupo_id: string;
  origen?: string | null;
  notas?: string | null;
};

export type CreateAsesoriaOut = {
  asesoria_id: string;
  cupo_id: string;
  estado: string;
  creado_en: string;
  servicio_nombre: string;
  categoria_nombre: string;
  docente_nombre: string;
  docente_email: string;
  inicio: string;
  fin: string;
  edificio_nombre?: string | null;
  campus_nombre?: string | null;
  sala_numero?: string | null;
  recurso_alias?: string | null;
};

export type CalendarConflict = {
  id: string;
  title: string;
  start: string;
  end: string;
  html_link?: string;
};

export type CheckConflictsInput = {
  start: string;  // ISO datetime string
  end: string;    // ISO datetime string
};

export type CheckConflictsOutput = {
  conflicts: CalendarConflict[];
  error?: string;
};
