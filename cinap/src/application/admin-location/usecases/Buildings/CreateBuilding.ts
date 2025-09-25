import type { Building } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class CreateBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(payload: { name: string; campusId: string }): Promise<Building> {
    return this.repo.createBuilding(payload);
  }
}
