import type { Campus, Building, Room } from "@/domain/admin/location";

export type Page<T, S = undefined> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  stats?: S;
};


export type CampusStats = { total: number; activos: number; inactivos: number };
export type BuildingStats = { total: number; activos: number; inactivos: number };
export type RoomStats = { total: number; activos: number; inactivos: number; capacity_sum?: number }; 

export interface AdminLocationRepo {
  listCampus(): Promise<Campus[]>;
  createCampus(payload: { name: string; address: string; code: string }): Promise<Campus>;
  updateCampus(id: string, patch: { name?: string; address?: string; code?: string; active?: boolean }): Promise<Campus>;
  deleteCampus(id: string): Promise<void>;
  reactivateCampus(id: string): Promise<Campus>;

  listBuildings(params?: { campusId?: string }): Promise<Building[]>;
  createBuilding(payload: { name: string; campusId: string; code?: string }): Promise<Building>;
  updateBuilding(id: string, patch: { name?: string; campusId?: string; code?: string; active?: boolean }): Promise<Building>;
  deleteBuilding(id: string): Promise<void>;
  reactivateBuilding(id: string): Promise<Building>;

  listRooms(params?: { buildingId?: string }): Promise<Room[]>;
  createRoom(payload: { name: string; buildingId: string; number: string; type: string; capacity: number }): Promise<Room>;
  updateRoom(id: string, patch: { name?: string; buildingId?: string; number?: string; type?: string; capacity?: number; active?: boolean }): Promise<Room>;
  deleteRoom(id: string): Promise<void>;
  reactivateRoom(id: string): Promise<Room>;

  listCampusPage(params?: { page?: number; limit?: number; q?: string; active?: boolean }): Promise<Page<Campus, CampusStats>>;
  listBuildingsPage(params?: { campusId?: string; page?: number; limit?: number; q?: string; active?: boolean }): Promise<Page<Building, BuildingStats>>;
  listRoomsPage(params?: { buildingId?: string; page?: number; limit?: number; q?: string; active?: boolean }): Promise<Page<Room, RoomStats>>;
}

export default AdminLocationRepo;
