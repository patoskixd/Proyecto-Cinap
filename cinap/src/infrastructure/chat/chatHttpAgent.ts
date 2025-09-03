import { httpPost } from "@/infrastructure/http/client";
import type { ChatAgent } from "@/application/chat/ports/ChatAgent";

type ChatResponse = { reply?: string };

export class ChatHttpAgent implements ChatAgent {
  async send(message: string, sessionId?: string): Promise<string> {
    try {
      // httpPost usa base "/api" → esto llama a /api/assistant/chat
      const data = await httpPost<ChatResponse>("/assistant/chat", { message, sessionId });
      return data.reply ?? "No se pudo obtener respuesta.";
    } catch (e: any) {
      if (e?.status === 401) return "Necesitas iniciar sesión para usar el asistente.";
      return "Hubo un problema al conectar con el asistente.";
    }
  }
}
