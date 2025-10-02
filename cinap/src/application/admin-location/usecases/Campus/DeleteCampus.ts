import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class DeleteCampus {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<void> {
    return this.repo.deleteCampus(id);
  }
}
