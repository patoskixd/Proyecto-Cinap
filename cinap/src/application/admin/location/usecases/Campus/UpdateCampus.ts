import type { Campus } from "@/domain/admin/location";
import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class UpdateCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string, patch: { name?: string; address?: string; code?: string }): Promise<Campus> {
    return this.repo.updateCampus(id, patch);
  }
}
