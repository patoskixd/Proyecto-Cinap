import type { AdminDocument, UploadDocumentResponse, DeleteDocumentResponse } from "@/domain/admin/documents";

export interface AdminDocumentsRepo {
  list(): Promise<AdminDocument[]>;
  upload(formData: FormData): Promise<UploadDocumentResponse>;
  remove(id: string): Promise<DeleteDocumentResponse>;
}
