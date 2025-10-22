import type { MySlot } from "@/domain/advisor/mySlots";

export interface MySlotsRepo {
  getMySlots(): Promise<MySlot[]>; // compat antigua

  getMySlotsPage(params: {
    page?: number;
    limit?: number;
    status?: "" | MySlot["status"];
    date?: string;
    category?: string;
    service?: string;
    campus?: string;
  }): Promise<{
    items: MySlot[];
    page: number;
    per_page: number;
    total: number;
    pages: number;
    stats: { total: number; disponibles: number; ocupadas_min: number };
  }>;

  updateMySlot(id: string, patch: Partial<MySlot>): Promise<MySlot>;
  deleteMySlot(id: string): Promise<void>;
  reactivateMySlot(id: string): Promise<MySlot>;
}
