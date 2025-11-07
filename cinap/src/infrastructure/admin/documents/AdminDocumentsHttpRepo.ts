"use client";

import type { AdminDocumentsRepo } from "@/application/admin/documents/ports/AdminDocumentsRepo";
import type { AdminDocument, UploadDocumentResponse, DeleteDocumentResponse } from "@/domain/admin/documents";

async function parse<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let data: any = null;
  try { 
    data = raw ? JSON.parse(raw) : null; 
  } catch { 
    data = raw; 
  }

  if (!res.ok) {
    let msg: string = `HTTP ${res.status}`;
    if (data) {
      const d = (data.detail ?? data.message ?? data);
      if (typeof d === "string") {
        msg = d;
      } else if (d && typeof d === "object") {
        msg = d.message ?? JSON.stringify(d);
      }
    }
    throw new Error(msg);
  }
  return data as T;
}

function mapToAdminDocument(raw: any): AdminDocument {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    url: raw.url ?? null,
    kind: raw.kind ?? null,
    chunks: raw.chunks ?? 0,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export class AdminDocumentsHttpRepo implements AdminDocumentsRepo {
  private baseUrl: string;

  constructor(baseUrl = "/api/admin/documents") {
    this.baseUrl = baseUrl;
  }

  async list(): Promise<AdminDocument[]> {
    const res = await fetch(this.baseUrl, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const data = await parse<any[]>(res);
    return data.map(mapToAdminDocument);
  }

  async upload(formData: FormData): Promise<UploadDocumentResponse> {
    const res = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await parse<any>(res);
    return {
      ok: data.ok ?? true,
      id: data.id,
      name: data.name,
      inserted: data.inserted,
    };
  }

  async remove(id: string): Promise<DeleteDocumentResponse> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });

    const data = await parse<any>(res);
    return {
      ok: data.ok ?? true,
      deleted: data.deleted,
    };
  }
}
