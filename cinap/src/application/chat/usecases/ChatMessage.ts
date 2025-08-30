
import type { ChatAgent } from "@application/chat/ports/ChatAgent";

export function makeSendChatMessage(agent: ChatAgent) {
  return async function sendChatMessage(input: { message: string; sessionId?: string }) {
    const cleaned = input.message.trim();
    if (!cleaned) return "Mensaje vacío.";
    return agent.send(cleaned, input.sessionId);
  };
}
