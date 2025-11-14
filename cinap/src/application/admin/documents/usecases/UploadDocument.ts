import type { AdminDocumentsRepo } from "../ports/AdminDocumentsRepo";
import type { UploadDocumentResponse } from "@/domain/admin/documents";

export class UploadDocument {
  constructor(private readonly repo: AdminDocumentsRepo) {}

  async execute(formData: FormData): Promise<UploadDocumentResponse> {
    return await this.repo.upload(formData);
  }
}
