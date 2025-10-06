import type { Campus } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class CreateCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(payload: { name: string; address: string }): Promise<Campus> {
    return this.repo.createCampus(payload);
  }
}
