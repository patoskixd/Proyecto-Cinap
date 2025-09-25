import type { Building } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class UpdateBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string, patch: { name?: string; campusId?: string }): Promise<Building> {
    return this.repo.updateBuilding(id, patch);
  }
}
