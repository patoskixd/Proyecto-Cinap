import type { Room } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

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
