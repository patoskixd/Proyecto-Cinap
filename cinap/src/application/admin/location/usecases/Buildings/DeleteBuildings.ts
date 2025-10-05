import type AdminLocationRepo from "@application/admin/location/ports/AdminLocationRepo";

export default class DeleteBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<void> {
    return this.repo.deleteBuilding(id);
  }
}
