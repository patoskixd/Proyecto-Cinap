import type { TelegramRepo } from "../ports/TelegramRepo";

export class GetTelegramLink {
  constructor(private repo: TelegramRepo) {}
  async execute(): Promise<{ url: string }> {
    return this.repo.link();
  }
}
