import type { Room } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

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
