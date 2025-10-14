import type { Building } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class CreateBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(payload: { name: string; campusId: string; code: string }): Promise<Building> {
    return this.repo.createBuilding(payload);
  }
}
