"use client";

import type { MySlotsRepo } from "@application/my-slots/ports/MySlotsRepo";
import type { MySlot } from "@domain/mySlots";

type PatchDTO = {
  date?: string;
  time?: string;
  duration?: number;
  notes?: string | null;
  status?: MySlot["status"];
};

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt || `HTTP ${res.status}`);
  }
}

function toPatchDTO(patch: Partial<MySlot>): PatchDTO {
  const dto: PatchDTO = {};
  if (patch.date) dto.date = patch.date;
  if (patch.time) dto.time = patch.time;
  if (typeof patch.duration === "number") dto.duration = patch.duration;
  if (patch.notes !== undefined) dto.notes = patch.notes ?? null;
  if (patch.status) dto.status = patch.status;
  return dto;
}

export class HttpMySlotsRepo implements MySlotsRepo {
  async getMySlots(): Promise<MySlot[]> {
    const res = await fetch("/api/my-slots", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudieron cargar los cupos");
    return parse<MySlot[]>(res);
  }

  async updateMySlot(id: string, patch: Partial<MySlot>): Promise<MySlot> {
    const res = await fetch(`/api/my-slots/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(toPatchDTO(patch)),
    });

    const data = await (async () => {
      try { return await parse<MySlot | any>(res); } catch (e: any) { throw new Error(e.message); }
    })();

    if (!res.ok) {
      const code = data?.detail?.code;
      const msg =
        code === "ADVISOR_TIME_CLASH" ? "Ya tienes otro cupo en ese horario. Elige otra hora." :
        code === "RESOURCE_BUSY"      ? "Conflicto con otro cupo del mismo recurso en ese horario." :
        data?.detail?.message || data?.detail || data?.message || "No se pudo guardar";
      throw new Error(msg);
    }
    return data as MySlot;
  }

  async deleteMySlot(id: string): Promise<void> {
    const res = await fetch(`/api/my-slots/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar el cupo");
  }

  async reactivateMySlot(id: string): Promise<MySlot> {
    const res = await fetch(`/api/my-slots/${id}/reactivate`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });


    const contentType = res.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");

    if (isHtml && !res.ok) {
      throw new Error("Ruta /api/my-slots/[id]/reactivate no encontrada (404). Revisa el route.ts y reinicia el dev server.");
    }

    const data = await parse<MySlot | any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar");
    return data as MySlot;
  }
}
