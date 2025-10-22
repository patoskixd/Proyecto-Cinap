export type Campus = {
  id: string;
  name: string;
  address: string;
  code: string;
  active: boolean;
};

export type Building = {
  id: string;
  name: string;
  campusId: string;
  campusName?: string;
  code: string;
  active: boolean;
};

export type RoomType = "aula" | "laboratorio" | "auditorio" | "sala_reuniones" | "oficina"| "sala_virtual";

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
