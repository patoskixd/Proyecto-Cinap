import type { AdminDocumentsRepo } from "../ports/AdminDocumentsRepo";
import type { AdminDocument } from "@/domain/admin/documents";

export class ListDocuments {
  constructor(private readonly repo: AdminDocumentsRepo) {}

  async execute(): Promise<AdminDocument[]> {
    return await this.repo.list();
  }
}
