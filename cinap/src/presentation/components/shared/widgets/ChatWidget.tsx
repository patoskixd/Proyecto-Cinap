"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatHttpAgent } from "@/infrastructure/chat/chatHttpAgent";
import { makeSendChatMessage } from "@/application/chat/usecases/SendChatMessage";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string; createdAt: string };
type ChatSession = { id: string; messages: ChatMessage[] };

const genId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const sendChatMessage = makeSendChatMessage(new ChatHttpAgent());

export default function ChatWidget() {
  const { me, mounted } = useAuth();
  const userKey = me.authenticated ? me.user.id : "anon";

  const KEYS = useMemo(
    () => ({
      session: `cinap-chat-${userKey}-session`,
      unread:  `cinap-chat-${userKey}-unread`,
      seen:    `cinap-chat-${userKey}-seenAt`,
    }),
    [userKey]
  );

  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [seenAt, setSeenAt] = useState<number>(() => Date.now());
  const [input, setInput] = useState("");

  const [session, setSession] = useState<ChatSession>(() => ({
    id: genId(),
    messages: [
      {
        id: genId(),
        role: "assistant",
        content: "¡Hola! Soy el asistente virtual del CINAP. ¿En qué puedo ayudarte hoy?",
        createdAt: new Date().toISOString(),
      },
    ],
  }));

  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEYS.session);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession;
        if (parsed?.id && Array.isArray(parsed.messages)) setSession(parsed);
      }
      const rawSeen = sessionStorage.getItem(KEYS.seen);
      if (rawSeen) setSeenAt(Number(rawSeen) || Date.now());
      const rawUnread = sessionStorage.getItem(KEYS.unread);
      if (rawUnread) setUnread(Number(rawUnread) || 0);
    } catch {}
  }, [KEYS.session, KEYS.seen, KEYS.unread]);


  useEffect(() => {
    if (!mounted || !me.authenticated) return;
    setSession((s) => (s.id === me.user.id ? s : { ...s, id: me.user.id }));
  }, [mounted, me]);


  useEffect(() => { try { sessionStorage.setItem(KEYS.session, JSON.stringify(session)); } catch {} }, [session, KEYS.session]);
  useEffect(() => { try { sessionStorage.setItem(KEYS.unread,  String(unread)); } catch {} }, [unread,  KEYS.unread]);
  useEffect(() => { try { sessionStorage.setItem(KEYS.seen,    String(seenAt)); }   catch {} }, [seenAt,  KEYS.seen]);

  const messages = session.messages;

  const scrollToBottom = () => requestAnimationFrame(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  });

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const addMessage = (role: Role, content: string) => {
    const nowIso = new Date().toISOString();
    setSession((s) => {
      const next = [...s.messages, { id: genId(), role, content, createdAt: nowIso }];
      const trimmed = next.length > 200 ? next.slice(-200) : next;
      return { ...s, messages: trimmed };
    });

    if (role === "assistant") {
      if (!isOpenRef.current || document.hidden) {
        setUnread((u) => Math.min(u + 1, 99));
      } else {
        setSeenAt(Date.now());
        setUnread(0);
      }
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setSeenAt(Date.now());
    setUnread(0);
    setTimeout(() => textareaRef.current?.focus(), 50);
    scrollToBottom();
  };
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => (isOpen ? closeChat() : openChat());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpenRef.current) {
        e.preventDefault();
        closeChat();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, isOpen]);
  useEffect(() => { autoResize(); }, [input, isOpen]);

  useEffect(() => {
    if (isOpen) return;
    const count = messages.filter(
      (m) => m.role === "assistant" && new Date(m.createdAt).getTime() > seenAt
    ).length;
    setUnread(count > 99 ? 99 : count);
  }, [messages, isOpen, seenAt]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && isOpenRef.current) {
        setSeenAt(Date.now());
        setUnread(0);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage("user", text);
    setInput("");
    autoResize();
    setIsLoading(true);

    try {
      const reply = await sendChatMessage({ message: text, sessionId: session.id });
      addMessage("assistant", reply);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
      {/* FAB */}
      <button
        type="button"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        onClick={toggleChat}
        className={classNames(
          "relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition transform",
          "bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-300",
          "pointer-events-auto"
        )}
      >
        {/* iconos */}
        <span className={classNames("absolute transition-opacity duration-200", isOpen ? "opacity-0" : "opacity-100")} aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span className={classNames("absolute transition-opacity duration-200", isOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90")} aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>

        {/* badge no leídos */}
        <span
          className={classNames(
            "absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow",
            unread > 0 ? "bg-red-500 text-white" : "hidden"
          )}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      </button>

      {/* Backdrop y Panel */}
      <div
        aria-hidden={!isOpen}
        className={classNames("fixed inset-0 z-40 md:static md:z-auto", isOpen ? "pointer-events-auto" : "pointer-events-none")}
      >
        {/* Backdrop */}
        <div
          onClick={(e) => { e.stopPropagation(); closeChat(); }}
          className={classNames("md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity", isOpen ? "opacity-100" : "opacity-0")}
        />

        {/* Panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Chat CINAP"
          className={classNames(
            "fixed right-5 bottom-24 w-[360px] max-w-[92vw] h-[520px] rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200",
            "md:translate-y-0 md:scale-100 transition-all duration-200",
            isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98]",
            "md:bottom-24 md:right-5",
            "sm:max-md:bottom-0 sm:max-md:right-0 sm:max-md:left-0 sm:max-md:top-0 sm:max-md:h-screen sm:max-md:w-screen sm:max-md:rounded-none",
            "pointer-events-auto"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full flex-col overflow-hidden rounded-2xl sm:max-md:rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-bold">C</div>
                <div className="flex flex-col">
                  <h3 className="text-base font-semibold">Chat CINAP</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs opacity-90">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span>En línea</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); closeChat(); }}
                className="rounded-md p-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Cerrar chat"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mensajes */}
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map((m) => (<MessageBubble key={m.id} message={m} />))}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <Avatar role="assistant" />
                  <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                    <div className="flex items-center gap-1">
                      <Dot /><Dot className="animation-delay-200" /><Dot className="animation-delay-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white p-4">
              <div className={classNames("flex items-end gap-2 rounded-2xl border-2 bg-slate-50 p-2", "focus-within:border-blue-600")}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  maxLength={500}
                  placeholder="Escribe tu mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="min-h-[36px] max-h-[120px] w-full resize-none bg-transparent p-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={classNames("flex h-10 w-10 items-center justify-center rounded-full text-white transition", "bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-[1.03] disabled:opacity-60")}
                  aria-label="Enviar mensaje"
                >
                  {isLoading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                      <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" className="opacity-90" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22,2 15,22 11,13 2,9 22,2" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Presiona <span className="font-semibold text-slate-500">Enter</span>,{" "}
                <span className="font-semibold text-slate-500">Shift+Enter</span> para nueva línea
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: Role }) {
  return (
    <div
      className={classNames(
        "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold",
        role === "assistant" ? "bg-gradient-to-br from-blue-600 to-blue-700" : "bg-emerald-500"
      )}
      aria-hidden
    >
      {role === "assistant" ? "C" : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const time = useMemo(
    () => new Date(message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    [message.createdAt]
  );
  const isUser = message.role === "user";
  return (
    <div className={classNames("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <Avatar role={message.role} />
      <div className={classNames("max-w-[80%] space-y-1", isUser && "items-end text-right")}>
        <div className={classNames("rounded-2xl px-3 py-2 text-sm shadow-sm", isUser ? "bg-emerald-500 text-white" : "border border-slate-200 bg-white text-slate-900")}>
          {message.content}
        </div>
        <div className="px-1 text-xs text-slate-400">{time}</div>
      </div>
    </div>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return <span className={classNames("inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400", className)} />;
}
