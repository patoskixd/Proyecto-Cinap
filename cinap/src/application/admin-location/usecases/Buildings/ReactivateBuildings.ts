import type { Building } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class ReactivateBuilding {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<Building> {
    return this.repo.reactivateBuilding(id);
  }
}
