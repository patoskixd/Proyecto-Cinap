import type { TelegramRepo, TelegramMe } from "../ports/TelegramRepo";

export class GetTelegramMe {
  constructor(private repo: TelegramRepo) {}
  async execute(): Promise<TelegramMe> {
    return this.repo.me();
  }
}
