// src/infrastructure/http/ChatHttpAgent.ts
import type { ChatAgent } from "@/application/chat/ports/ChatAgent";

export class ChatHttpAgent implements ChatAgent {
  constructor(private readonly base = "/api/assistant") {}

  async send(message: string, sessionId?: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${this.base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
        signal: controller.signal,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();
      return data?.reply ?? "No se pudo obtener respuesta.";
    } catch (e) {
      return "Hubo un problema al conectar con el asistente.";
    } finally {
      clearTimeout(timeout);
    }
  }
}
