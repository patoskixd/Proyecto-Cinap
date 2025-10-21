export type PendingTeacherConfirmation = {
  id: string;
  categoria: string;
  servicio: string;
  inicioISO?: string; 
  fecha?: string;
  hora?: string;
  ubicacion?: string;
  estudiante?: string | null;
};
