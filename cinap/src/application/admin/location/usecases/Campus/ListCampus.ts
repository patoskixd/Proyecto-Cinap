import type { Campus } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class ListCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(): Promise<Campus[]> {
    return this.repo.listCampus();
  }
}
