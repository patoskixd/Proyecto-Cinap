import type { Building } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class UpdateBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string, patch: { name?: string; campusId?: string; code?: string; active?: boolean }): Promise<Building> {
    return this.repo.updateBuilding(id, patch);
  }
}
