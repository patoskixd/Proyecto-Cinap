import type { Room } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class ListRooms {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { buildingId?: string }): Promise<Room[]> {
    return this.repo.listRooms(params);
  }
}
