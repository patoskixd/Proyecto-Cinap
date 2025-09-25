import type AdminLocationRepo from "../../ports/AdminLocationRepo";

export default class DeleteRoom {
  constructor(private repo: AdminLocationRepo) {}
  exec(id: string): Promise<void> {
    return this.repo.deleteRoom(id);
  }
}
