import type { Campus } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class ReactivateCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<Campus> {
    return this.repo.reactivateCampus(id);
  }
}
