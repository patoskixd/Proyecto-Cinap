import type { CreateSlotsData, CreateSlotsInput, CreateSlotsResult } from "@domain/slots";

export interface SlotsRepo {
  getCreateSlotsData(): Promise<CreateSlotsData>;       
  createSlots(input: CreateSlotsInput): Promise<CreateSlotsResult>;
}
