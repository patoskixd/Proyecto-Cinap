"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

export default function ChatWidget() {
  //  estado del chat
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [input, setInput] = useState("");
  const [session, setSession] = useState<ChatSession>(() => ({
    id: genId(),
    messages: [
      {
        id: genId(),
        role: "assistant",
        content:
          "¡Hola! Soy el asistente virtual del CINAP. ¿En qué puedo ayudarte hoy?",
        createdAt: new Date().toISOString(),
      },
    ],
  }));

  //  refs 
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // persistencia en localStorage
  // (para mantener el estado entre recargas)
  const STORAGE_KEY = "cinap-chat-session-v1";
  const UNREAD_KEY = "cinap-chat-unread-v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const rawUnread = localStorage.getItem(UNREAD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession;
        if (parsed?.id && Array.isArray(parsed.messages)) setSession(parsed);
      }
      if (rawUnread) setUnread(Number(rawUnread) || 0);
    } catch {
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(UNREAD_KEY, String(unread));
    } catch {
    }
  }, [unread]);

  // derivar mensajes del estado
  const messages = session.messages;

  // ayuda a mantener el scroll al final
  const scrollToBottom = () => {
    // pequeño delay para esperar al paint
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const addMessage = (role: Role, content: string) => {
    setSession((s) => ({
      ...s,
      messages: [
        ...s.messages,
        { id: genId(), role, content, createdAt: new Date().toISOString() },
      ],
    }));
  };

  const generateResponse = (userText: string) => {
    const responses = [
      "Entiendo tu consulta. Te ayudo a encontrar la mejor opción de asesoría.",
      "Perfecto, puedo ayudarte con eso. ¿Podrías darme más detalles?",
      "Excelente pregunta. Déjame revisar las opciones disponibles para ti.",
      "¿Hay algún horario específico que prefieras?",
      "Claro, puedo asistirte con la programación de tu asesoría.",
      "Busquemos el asesor ideal para tu necesidad.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // abrir/cerrar chat
  const openChat = () => {
    setIsOpen(true);
    setUnread(0);
    // focus al input
    setTimeout(() => textareaRef.current?.focus(), 50);
    scrollToBottom();
  };
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => (isOpen ? closeChat() : openChat());

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        closeChat();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Click fuera 
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (!panelRef.current.contains(target)) {
        closeChat();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // focus trap (para accesibilidad)
  useEffect(() => {
    if (!isOpen) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    panelRef.current?.addEventListener("keydown", trap as any);
    return () => panelRef.current?.removeEventListener("keydown", trap as any);
  }, [isOpen]);

  // auto-scroll cuando cambian mensajes o abres
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isOpen]);

  // auto-resize del textarea
  useEffect(() => {
    autoResize();
  }, [input, isOpen]);

  // Simular mensajes entrantes si está cerrado 
  useEffect(() => {
    const id = setInterval(() => {
      if (!isOpen && Math.random() < 0.1) {
        setUnread((u) => Math.min(u + 1, 99));
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isOpen]);

  // enviar mensaje al presionar Enter
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // agrega mensaje del usuario
    addMessage("user", text);
    setInput("");
    autoResize();
    setIsLoading(true);

    // “typing” simulado + respuesta
    setTimeout(() => {
      const reply = generateResponse(text);
      addMessage("assistant", reply);
      setIsLoading(false);
      if (!isOpen) setUnread((u) => Math.min(u + 1, 99));
    }, 900 + Math.random() * 800);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* FAB */}
      <button
        type="button"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        onClick={toggleChat}
        className={classNames(
          "relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition transform",
          "bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-300"
        )}
      >
        {/* iconos */}
        <span
          className={classNames(
            "absolute transition-opacity duration-200",
            isOpen ? "opacity-0" : "opacity-100"
          )}
          aria-hidden
        >
          {/* chat icon */}
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span
          className={classNames(
            "absolute transition-opacity duration-200",
            isOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
          )}
          aria-hidden
        >
          {/* close icon */}
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

      {/* Panel + backdrop  */}
      <div
        aria-hidden={!isOpen}
        className={classNames(
          "fixed inset-0 z-40 md:static md:z-auto",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop solo visible en móviles */}
        <div
          onClick={closeChat}
          className={classNames(
            "md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity",
            isOpen ? "opacity-100" : "opacity-0"
          )}
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
            "sm:max-md:bottom-0 sm:max-md:right-0 sm:max-md:left-0 sm:max-md:top-0 sm:max-md:h-screen sm:max-md:w-screen sm:max-md:rounded-none"
          )}
        >
          {/* Contenedor interno */}
          <div className="flex h-full flex-col overflow-hidden rounded-2xl sm:max-md:rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 text-white">
              <div className="flex flex-col">
                <h3 className="text-base font-semibold">Chat CINAP</h3>
                <div className="mt-0.5 flex items-center gap-2 text-xs opacity-90">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span>En línea</span>
                </div>
              </div>
              <button
                onClick={closeChat}
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
            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
            >
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}

              {/* typing */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <Avatar role="assistant" />
                  <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                    <div className="flex items-center gap-1">
                      <Dot />
                      <Dot className="animation-delay-200" />
                      <Dot className="animation-delay-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white p-4">
              <div className={classNames(
                "flex items-end gap-2 rounded-2xl border-2 bg-slate-50 p-2",
                "focus-within:border-blue-600"
              )}>
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
                  className={classNames(
                    "flex h-10 w-10 items-center justify-center rounded-full text-white transition",
                    "bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-[1.03] disabled:opacity-60"
                  )}
                  aria-label="Enviar mensaje"
                >
                  {isLoading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="opacity-30"
                      />
                      <path
                        d="M21 12a9 9 0 0 1-9 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="opacity-90"
                      />
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
                Presiona <span className="font-semibold text-slate-500">Enter</span> para enviar,{" "}
                <span className="font-semibold text-slate-500">Shift+Enter</span> para nueva línea
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Presentational bits ---------- */

function Avatar({ role }: { role: Role }) {
  return (
    <div
      className={classNames(
        "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-white",
        role === "assistant" ? "bg-gradient-to-br from-blue-600 to-blue-700" : "bg-emerald-500"
      )}
      aria-hidden
    >
      {role === "assistant" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Zm9 7V7l-6-6H5C3.89 1 3 1.89 3 3v16a2 2 0 0 0 2 2h6v-2H5V3h8v6h8Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const time = useMemo(
    () =>
      new Date(message.createdAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.createdAt]
  );

  const isUser = message.role === "user";

  return (
    <div className={classNames("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <Avatar role={message.role} />
      <div className={classNames("max-w-[80%] space-y-1", isUser && "items-end text-right")}>
        <div
          className={classNames(
            "rounded-2xl px-3 py-2 text-sm shadow-sm",
            isUser
              ? "bg-emerald-500 text-white"
              : "border border-slate-200 bg-white text-slate-900"
          )}
        >
          {message.content}
        </div>
        <div className="px-1 text-xs text-slate-400">{time}</div>
      </div>
    </div>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return (
    <span
      className={classNames(
        "inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400",
        className
      )}
    />
  );
}
