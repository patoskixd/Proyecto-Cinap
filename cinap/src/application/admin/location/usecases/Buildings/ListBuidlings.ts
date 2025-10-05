import type { Building } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class ListBuildings {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { campusId?: string }): Promise<Building[]> {
    return this.repo.listBuildings(params);
  }
}
