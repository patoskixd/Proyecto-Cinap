import type { CreateSlotsData, CreateSlotsInput, CreateSlotsResult } from "@/domain/advisor/slots";

export interface SlotsRepo {
  getCreateSlotsData(): Promise<CreateSlotsData>;       
  createSlots(input: CreateSlotsInput): Promise<CreateSlotsResult>;
}
