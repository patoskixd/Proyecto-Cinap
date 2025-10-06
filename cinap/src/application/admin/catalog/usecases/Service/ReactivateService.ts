import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminService } from "@/domain/admin/catalog";

export default class ReactivateService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<AdminService> { return this.repo.reactivateService(id); }
}
