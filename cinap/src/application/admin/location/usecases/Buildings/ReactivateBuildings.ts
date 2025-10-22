import type { Building } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class ReactivateBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<Building> {
    return this.repo.reactivateBuilding(id);
  }
}
