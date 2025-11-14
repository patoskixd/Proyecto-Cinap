export type TelegramMe = { linked: boolean; username?: string | null };

export interface TelegramRepo {
  link(): Promise<{ url: string }>;
  me(): Promise<TelegramMe>;
  unlink(): Promise<void>; 
}
