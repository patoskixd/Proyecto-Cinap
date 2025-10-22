"use client";
import { useCallback, useEffect, useState } from "react";
import type { PendingTeacherConfirmation } from "@/domain/teacher/confirmations";
import { TeacherConfirmationsHttpRepo } from "@/infrastructure/teachers/confirmations/TeacherConfirmationsHttpRepo";

export function useTeacherPendingConfirmations() {
  const [data, setData] = useState<PendingTeacherConfirmation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repo = new TeacherConfirmationsHttpRepo();
      const rows = await repo.getPending();
      setData(rows);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
