import type { AdminDocumentsRepo } from "../ports/AdminDocumentsRepo";
import type { DeleteDocumentResponse } from "@/domain/admin/documents";

export class DeleteDocument {
  constructor(private readonly repo: AdminDocumentsRepo) {}

  async execute(id: string): Promise<DeleteDocumentResponse> {
    return await this.repo.remove(id);
  }
}
