import type { Campus, Building, Room, } from "@/domain/adminLocation";

export interface AdminLocationRepo {
  // Campus
  listCampus(): Promise<Campus[]>;
  createCampus(payload: { name: string; address: string }): Promise<Campus>;
  updateCampus(id: string, patch: { name?: string; address?: string }): Promise<Campus>;
  deleteCampus(id: string): Promise<void>;
  reactivateCampus(id: string): Promise<Campus>;

  // Buildings
  listBuildings(params?: { campusId?: string }): Promise<Building[]>;
  createBuilding(payload: { name: string; campusId: string }): Promise<Building>;
  updateBuilding(id: string, patch: { name?: string; campusId?: string }): Promise<Building>;
  deleteBuilding(id: string): Promise<void>;
  reactivateBuilding(id: string): Promise<Building>;

  // Rooms
  listRooms(params?: { buildingId?: string }): Promise<Room[]>;
  createRoom(payload: {
    name: string;
    buildingId: string;
    number: string;
    type: string;
    capacity: number;
  }): Promise<Room>;
  updateRoom(id: string, patch: {
    name?: string;
    buildingId?: string;
    number?: string;
    type?: string;
    capacity?: number;
  }): Promise<Room>;
  deleteRoom(id: string): Promise<void>;
  reactivateRoom(id: string): Promise<Room>;

}

export default AdminLocationRepo;
