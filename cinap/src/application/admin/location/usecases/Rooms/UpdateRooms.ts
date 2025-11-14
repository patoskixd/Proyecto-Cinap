import type { Room } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class UpdateRoom {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string, patch: {
    name?: string;
    buildingId?: string;
    number?: string;
    type?: string;
    capacity?: number;
  }): Promise<Room> {
    return this.repo.updateRoom(id, patch);
  }
}
