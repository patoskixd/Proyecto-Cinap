import type { Campus } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class ListCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(): Promise<Campus[]> {
    return this.repo.listCampus();
  }
}
