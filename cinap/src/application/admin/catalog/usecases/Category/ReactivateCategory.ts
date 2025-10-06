import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminCategory } from "@/domain/admin/catalog";

export default class ReactivateCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<AdminCategory> { return this.repo.reactivateCategory(id); }
}
