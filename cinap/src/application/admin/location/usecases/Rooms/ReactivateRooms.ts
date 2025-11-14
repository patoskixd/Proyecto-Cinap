import type { Room } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class ReactivateRoom {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<Room> {
    return this.repo.reactivateRoom(id);
  }
}
