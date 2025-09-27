import type { Room } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class ReactivateRoom {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<Room> {
    return this.repo.reactivateRoom(id);
  }
}
