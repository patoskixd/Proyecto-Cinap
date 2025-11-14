import type { Room } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class CreateRoom {
  constructor(private repo: AdminLocationRepo) {}
  exec(payload: {
    name: string;
    buildingId: string;
    number: string;
    type: string;
    capacity: number;
  }): Promise<Room> {
    return this.repo.createRoom(payload);
  }
}
