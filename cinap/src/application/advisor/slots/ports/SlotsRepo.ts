import type { CreateSlotsData, CreateSlotsInput, CheckConflictsInput, CheckConflictsOutput } from "@/domain/advisor/slots";

export type CreateSlotsResult = {
  createdSlots: number;
  skipped?: number;
};

export interface SlotsRepo {
  getCreateSlotsData(): Promise<CreateSlotsData>;
  createSlots(input: CreateSlotsInput): Promise<CreateSlotsResult>;
  checkConflicts(input: CheckConflictsInput): Promise<CheckConflictsOutput>;
}
