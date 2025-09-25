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

export type RoomType = "aula" | "laboratorio" | "auditorio" | "sala_reuniones";

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

export interface AdminLocationRepo {
  // Campus
  listCampus(): Promise<Campus[]>;
  createCampus(payload: { name: string; address: string }): Promise<Campus>;
  updateCampus(id: string, patch: { name?: string; address?: string }): Promise<Campus>;
  reactivateCampus(id: string, active?: boolean): Promise<Campus>;
  deleteCampus(id: string): Promise<void>;

  // Buildings
  listBuildings(): Promise<Building[]>;
  createBuilding(payload: { name: string; campusId: string }): Promise<Building>;
  updateBuilding(id: string, patch: { name?: string; campusId?: string }): Promise<Building>;
  reactivateBuilding(id: string, active?: boolean): Promise<Building>;
  deleteBuilding(id: string): Promise<void>;

  // Rooms
  listRooms(): Promise<Room[]>;
  createRoom(payload: {
    name: string;
    buildingId: string;
    number: string;
    type: RoomType;
    capacity: number;
  }): Promise<Room>;
  updateRoom(id: string, patch: {
    name?: string;
    buildingId?: string;
    number?: string;
    type?: RoomType;
    capacity?: number;
  }): Promise<Room>;
  reactivateRoom(id: string, active?: boolean): Promise<Room>;
  deleteRoom(id: string): Promise<void>;
}
