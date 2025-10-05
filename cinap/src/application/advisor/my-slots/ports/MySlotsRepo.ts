import type { MySlot } from "@/domain/advisor/mySlots";

export interface MySlotsRepo {
  getMySlots(): Promise<MySlot[]>;
  updateMySlot(id: string, patch: Partial<MySlot>): Promise<MySlot>;
  deleteMySlot(id: string): Promise<void>;
  reactivateMySlot(id: string): Promise<MySlot>;
}
