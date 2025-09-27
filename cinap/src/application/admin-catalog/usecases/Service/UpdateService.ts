import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";
import type { AdminService } from "@domain/adminCatalog";

export default class UpdateService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string, patch: { name?: string; durationMinutes?: number; active?: boolean }): Promise<AdminService> {
    return this.repo.updateService(id, patch);
  }
}
