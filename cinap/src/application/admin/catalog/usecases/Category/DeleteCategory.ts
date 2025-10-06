import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";

export default class DeleteCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<void> { return this.repo.deleteCategory(id); }
}