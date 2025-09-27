import type { TelegramRepo } from "../ports/TelegramRepo";

export class UnlinkTelegram {
  constructor(private repo: TelegramRepo) {}
  async execute(): Promise<void> {
    return this.repo.unlink();
  }
}
