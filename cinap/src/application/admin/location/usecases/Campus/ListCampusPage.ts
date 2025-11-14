import type { Campus } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";
import type { Page, CampusStats } from "@application/admin/location/ports/AdminLocationRepo";

export default class ListCampusPage {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { page?: number; limit?: number; q?: string; active?: boolean }): Promise<Page<Campus, CampusStats>> {
    return this.repo.listCampusPage(params);
  }
}
