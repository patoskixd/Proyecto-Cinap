import type { MySlot } from "@domain/mySlots";

export interface MySlotsRepo {
  getMySlots(): Promise<MySlot[]>;
  updateMySlot(id: number, patch: Partial<MySlot>): Promise<MySlot>;
  deleteMySlot(id: number): Promise<void>;
  reactivateMySlot(id: number): Promise<MySlot>;
}
