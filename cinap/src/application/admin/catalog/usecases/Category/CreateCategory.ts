import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminCategory } from "@/domain/admin/catalog";

export default class CreateCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(payload: { name: string; description: string }): Promise<AdminCategory> {
    return this.repo.createCategory(payload);
  }
}
