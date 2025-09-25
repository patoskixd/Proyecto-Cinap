import type { Campus } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class UpdateCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string, patch: { name?: string; address?: string }): Promise<Campus> {
    return this.repo.updateCampus(id, patch);
  }
}
