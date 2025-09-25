import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";

export default class DeleteService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<void> { return this.repo.deleteService(id); }
}
