import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";
import type { AdminService } from "@domain/adminCatalog";

export default class ReactivateService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<AdminService> { return this.repo.reactivateService(id); }
}
