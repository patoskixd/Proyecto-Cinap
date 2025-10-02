// app/api/assistant/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeSendChatMessage } from "@application/chat/usecases/SendChatMessage";
import { AssistantBackendAgent } from "@infrastructure/http/bff/chat/ChatBackendAgent";
import { appendSetCookies } from "@/app/api/_utils/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE =
  process.env.ASSISTANT_BASE_URL ??
  process.env.BACKEND_BASE_URL ??
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message: string = body?.message ?? "";
    const sessionId: string | undefined = body?.thread_id ?? body?.sessionId;

    const agent = new AssistantBackendAgent(BASE, req.headers.get("cookie") ?? "");
    const sendChatMessage = makeSendChatMessage(agent);

    const reply = await sendChatMessage({ message, sessionId });
    const resp = NextResponse.json(
      { reply, thread_id: agent.getLastThreadId() },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    appendSetCookies(agent.getSetCookies(), resp);
    return resp;
  } catch {
    return NextResponse.json(
      { reply: "Error al contactar el backend." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
