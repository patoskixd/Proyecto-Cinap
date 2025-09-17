import type { TelegramRepo, TelegramMe } from "@/application/telegram/ports/TelegramRepo";

export class TelegramHttpRepo implements TelegramRepo {
  async link(): Promise<{ url: string }> {
    const r = await fetch("/api/telegram/link", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) throw new Error(`Link HTTP ${r.status}`);
    return r.json();
  }

  async me(): Promise<TelegramMe> {
    const r = await fetch("/api/telegram/me", { credentials: "include", cache: "no-store" });
    if (!r.ok) return { linked: false };
    return r.json();
  }
}
