import type { Room } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class ListRooms {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { buildingId?: string }): Promise<Room[]> {
    return this.repo.listRooms(params);
  }
}
