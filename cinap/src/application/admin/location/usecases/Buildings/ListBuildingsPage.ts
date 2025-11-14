import type { Building } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";
import type { Page, BuildingStats } from "@application/admin/location/ports/AdminLocationRepo";

export default class ListBuildingsPage {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { campusId?: string; page?: number; limit?: number; q?: string; active?: boolean }): Promise<Page<Building, BuildingStats>> {
    return this.repo.listBuildingsPage(params);
  }
}
