import type { Campus } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class ReactivateCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<Campus> {
    return this.repo.reactivateCampus(id);
  }
}
