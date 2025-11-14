export type DocumentId = string;

export type AdminDocument = {
  id: DocumentId;
  name: string;
  url?: string | null;
  kind?: string | null;
  chunks: number;
  createdAt: string;
};

export type AdminDocumentsPage = {
  items: AdminDocument[];
  total: number;
};

export type UploadDocumentRequest = {
  file: File;
};

export type UploadDocumentResponse = {
  ok: boolean;
  id: DocumentId;
  name: string;
  inserted?: number;
};

export type DeleteDocumentResponse = {
  ok: boolean;
  deleted?: number;
};
