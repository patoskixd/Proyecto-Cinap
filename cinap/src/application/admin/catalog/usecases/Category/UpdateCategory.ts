import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminCategory } from "@/domain/admin/catalog";

export default class UpdateCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string, patch: { name?: string; description?: string; active?: boolean }): Promise<AdminCategory> {
    return this.repo.updateCategory(id, patch);
  }
}