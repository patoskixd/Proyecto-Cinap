import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";

export default class DeleteCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<void> { return this.repo.deleteCategory(id); }
}