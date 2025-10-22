import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminService } from "@/domain/admin/catalog";

export default class UpdateService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string, patch: { name?: string; durationMinutes?: number; active?: boolean }): Promise<AdminService> {
    return this.repo.updateService(id, patch);
  }
}
