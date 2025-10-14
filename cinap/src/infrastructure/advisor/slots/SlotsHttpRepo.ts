import { httpGetCached, httpPost } from "@/infrastructure/http/client";
import type { SlotsRepo } from "@/application/advisor/slots/ports/SlotsRepo";
import type {CreateSlotsData,CreateSlotsResult,CreateSlotsInput,SlotRule} from "@/domain/advisor/slots";

type UIRulePayload = {
  day: string;
  startTime: string;
  endTime: string;
  isoDate?: string | null;
};

export class SlotsHttpRepo implements SlotsRepo {
  async getCreateSlotsData(): Promise<CreateSlotsData> {
    return httpGetCached<CreateSlotsData>("advisor/slots/create-data", { ttlMs: 60_000 });
  }
  
  async createSlots(input: {
    serviceId: string;
    recursoId?: string | null;
    location: string;
    room: string;
    roomNotes?: string | null;
    schedules: UIRulePayload[] }
  ): Promise<CreateSlotsResult> {
    const payload = {
      serviceId: input.serviceId,
      recursoId: (input as any).recursoId ?? null,
      location: input.location ?? "",
      room: input.room ?? "",
      roomNotes: input.roomNotes ?? null,
      tz: "America/Santiago",
      schedules: input.schedules.map((s) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        isoDate: s.isoDate ?? null,
      })),
    };

    const res = await httpPost<{ createdSlots: number }>("advisor/slots/open", payload);
    return { createdSlots: res.createdSlots ?? 0 };
  }
}



