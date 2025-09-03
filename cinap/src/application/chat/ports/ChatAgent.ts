export interface ChatAgent {
  send(message: string, sessionId?: string): Promise<string>;
}
