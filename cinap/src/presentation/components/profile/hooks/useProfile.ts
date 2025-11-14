"use client";
import { useEffect, useState } from "react";
import { GetMyProfile } from "@/application/profile/usecases/GetMyProfile";
import { ProfileRepoHttp } from "@/infrastructure/http/profile/ProfileRepoHttp";
import type { ProfileSummary } from "@/application/profile/ports/ProfileRepo";

export function useProfile(initial?: ProfileSummary | null) {
  const [data, setData] = useState<ProfileSummary | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    const uc = new GetMyProfile(new ProfileRepoHttp());
    uc
      .execute()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((e: any) => {
        if (!initial) {
          setData(null);
        }
        setError(e?.message ?? "Error al cargar perfil");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, error, loading };
}
