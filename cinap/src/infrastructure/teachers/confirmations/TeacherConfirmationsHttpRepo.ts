"use client";
import type { PendingTeacherConfirmation } from "@/domain/teacher/confirmations";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
}

export class TeacherConfirmationsHttpRepo {
  async getPending(): Promise<PendingTeacherConfirmation[]> {
    const res = await fetch("/api/teacher/confirmations/pending", {
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    return parse<PendingTeacherConfirmation[]>(res);
  }
}
