import type { MySlotsRepo } from "../ports/MySlotsRepo";
import type { MySlot } from "@/domain/advisor/mySlots";

export class GetMySlotsPage {
  constructor(private readonly repo: MySlotsRepo) {}

  async exec(params: {
    page?: number;
    limit?: number;
    status?: "" | MySlot["status"];
    date?: string;
    category?: string;
    service?: string;
    campus?: string;
  } = {}) {
    return this.repo.getMySlotsPage(params);
  }
}
