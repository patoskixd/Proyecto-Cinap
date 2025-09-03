import { httpPost } from "@/infrastructure/http/client";
import type { ChatAgent } from "@/application/chat/ports/ChatAgent";

type ChatResponse = { reply?: string; thread_id?: string };

export class ChatHttpAgent implements ChatAgent {

  async send(message: string, sessionId?: string): Promise<string> {
    try {

      const data = await httpPost<ChatResponse>("/assistant/chat", {
        message,
        thread_id: sessionId, 
      });
      return data.reply ?? "No se pudo obtener respuesta.";
    } catch (e: any) {
      if (e?.status === 401) return "Necesitas iniciar sesión para usar el asistente.";
      return "Hubo un problema al conectar con el asistente.";
    }
  }
}
