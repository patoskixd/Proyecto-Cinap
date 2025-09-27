import type { Campus } from "@/domain/adminLocation";
import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class CreateCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(payload: { name: string; address: string }): Promise<Campus> {
    return this.repo.createCampus(payload);
  }
}
