import type { Building } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class ListBuildings {
  constructor(private repo: AdminLocationRepo) {}
  exec(params?: { campusId?: string }): Promise<Building[]> {
    return this.repo.listBuildings(params);
  }
}
