export type Campus = {
  id: string;
  name: string;
  address: string;
  active: boolean;
};

export type Building = {
  id: string;
  name: string;
  campusId: string;
  campusName?: string;
  active: boolean;
};

export type RoomType = "aula" | "laboratorio" | "auditorio" | "sala_reuniones" | "oficina";

export type Room = {
  id: string;
  name: string;
  buildingId: string;
  buildingName?: string;
  number: string;
  type: RoomType;
  capacity: number;
  active: boolean;
};
