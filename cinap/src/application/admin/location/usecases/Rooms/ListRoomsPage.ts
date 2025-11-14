import type { Room } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";
import type { Page, RoomStats } from "@application/admin/location/ports/AdminLocationRepo";

export default class ListRoomsPage {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { buildingId?: string; page?: number; limit?: number; q?: string; active?: boolean }): Promise<Page<Room, RoomStats>> {
    return this.repo.listRoomsPage(params);
  }
}
