import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminService } from "@/domain/admin/catalog";

export default class CreateService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(categoryId: string, payload: { name: string; durationMinutes: number; active?: boolean }): Promise<AdminService> {
    return this.repo.createService(categoryId, payload);
  }
}
