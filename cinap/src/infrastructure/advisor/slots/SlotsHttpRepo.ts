import { httpGetCached, httpPost } from "@/infrastructure/http/client";
import type { SlotsRepo, CreateSlotsResult } from "@/application/advisor/slots/ports/SlotsRepo";
import type { CreateSlotsData, CheckConflictsInput, CheckConflictsOutput } from "@/domain/advisor/slots";

type UIRulePayload = {
  day: string;
  startTime: string;
  endTime: string;
  isoDate?: string | null;
};

export class SlotsHttpRepo implements SlotsRepo {
  async getCreateSlotsData(): Promise<CreateSlotsData> {
    return httpGetCached<CreateSlotsData>("/slots/create-data", { ttlMs: 60_000 });
  }
  
  async createSlots(input: {
    serviceId: string;
    recursoId?: string | null;
    location: string;
    room: string;
    roomNotes?: string | null;
    schedules: UIRulePayload[];
    skipConflicts?: boolean;
  }): Promise<CreateSlotsResult> {
    const payload = {
      serviceId: input.serviceId,
      recursoId: (input as any).recursoId ?? null,
      location: input.location ?? "",
      room: input.room ?? "",
      roomNotes: input.roomNotes ?? null,
      tz: "America/Santiago",
      skipConflicts: input.skipConflicts ?? false,
      schedules: input.schedules.map((s) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        isoDate: s.isoDate ?? null,
      })),
    };

    if (process.env.NODE_ENV !== "production") {
      console.debug("[SlotsHttpRepo] createSlots payload", payload);
    }

    const res = await httpPost<{ createdSlots: number; skipped?: number }>("/slots/open", payload);

    if (process.env.NODE_ENV !== "production") {
      console.debug("[SlotsHttpRepo] createSlots response", res);
    }

    const result: CreateSlotsResult = { createdSlots: res.createdSlots ?? 0 };
    if (typeof res.skipped === "number") {
      result.skipped = res.skipped;
    }
    return result;
  }

  async checkConflicts(input: CheckConflictsInput): Promise<CheckConflictsOutput> {
    const payload = {
      schedules: input.schedules.map((s) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        isoDate: s.isoDate ?? null,
      })),
      tz: input.tz ?? "America/Santiago",
    };

    try {
      const res = await httpPost<CheckConflictsOutput>("/slots/check-conflicts", payload);
      return res;
    } catch (error) {
      console.error("[SlotsHttpRepo] checkConflicts error", error);
      return { conflicts: [] };
    }
  }
}
