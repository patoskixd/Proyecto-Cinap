// src/application/ports/ChatAgent.ts
export interface ChatAgent {
  send(message: string, sessionId?: string): Promise<string>;
}
