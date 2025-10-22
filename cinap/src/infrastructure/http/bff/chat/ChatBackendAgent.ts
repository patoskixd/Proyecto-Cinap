// infrastructure/http/bff/assistant/AssistantBackendAgent.ts
import type { ChatAgent } from "@application/chat/ports/ChatAgent";

type ChatDTO = { reply?: string; thread_id?: string };

export class AssistantBackendAgent implements ChatAgent {
  private lastSetCookies: string[] = [];
  private lastThreadId: string | undefined;
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    this.cookie = cookie;
  }

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  getLastThreadId(): string | undefined {
    return this.lastThreadId;
  }

  private collectSetCookies(res: Response) {
    this.lastSetCookies = [];
    const anyHeaders = res.headers as any;
    const rawList: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : (res.headers.get("set-cookie")
            ? [res.headers.get("set-cookie") as string]
            : []);
    this.lastSetCookies.push(...rawList);
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; }
    catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async send(message: string, sessionId?: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/assistant/chat`, {
      method: "POST",
      headers: {
        cookie: this.cookie,
        accept: "application/json",
        "content-type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ message, thread_id: sessionId }),
    });

    this.collectSetCookies(res);

    const data = await this.parse<ChatDTO>(res);
    this.lastThreadId = data?.thread_id;

    if (!res.ok) {
      // Mensajes “amistosos” similares a tu HttpAgent
      if (res.status === 401) return "Necesitas iniciar sesión para usar el asistente.";
      return data?.reply || "Hubo un problema al conectar con el asistente.";
    }

    return data?.reply ?? "Sin respuesta del asistente.";
  }
}
