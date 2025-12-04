"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChatHttpAgent } from "@/infrastructure/chat/chatHttpAgent";
import { makeSendChatMessage } from "@/application/chat/usecases/SendChatMessage";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string; createdAt: string };
type ChatSession = { id: string; messages: ChatMessage[] };
type QuickAction = {
  id: string;
  label: string;
  template: string;
  description?: string;
};

type PaginatedItem = {
  title?: string;
  subtitle?: string;
  start?: string;
  end?: string;
  meta?: Record<string, any>;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "reserve",
    label: "Agendar asesoría",
    template:
      "Reserva una asesoria con [agregar nombre] para [agregar servicio] el [agregar fecha] desde las [agregar hora]",
    description: "Llega invitación al correo del docente",
  },
  {
    id: "confirm",
    label: "Confirmar asesoría",
    template:
      "confirma mi asistencia a mi asesoria con [agregar nombre] del [agregar fecha] desde las [agregar hora]",
    description: "Llega confirmación al correo del asesor",
  },
  {
    id: "cancel",
    label: "Cancelar asesoría",
    template:
      "cancela mi asesoria con [agregar nombre] del [agregar fecha] desde las [agregar hora]",
    description: "Llega cancelación al correo del docente",
  },
  {
    id: "list-availability",
    label: "Ver cupos disponibles",
    template: "Muestra cupos disponibles para [agregar servicio] el [agregar fecha]",
    description: "Consulta de cupos cercanos",
  },
  {
    id: "list-sessions",
    label: "Listar asesorías",
    template: "Lista mis asesorias de [agregar periodo]",
    description: "Pendientes, confirmadas y canceladas",
  },
  {
    id: "list-advisors",
    label: "Listar asesores",
    template: "Lista los asesores disponibles para [agregar servicio]",
    description: "Ver quién puede atender",
  },
  {
    id: "list-services",
    label: "Listar servicios",
    template: "Lista los servicios de asesoría disponibles",
    description: "Descubrir opciones",
  },
  {
    id: "rag-info",
    label: "Mostrar información",
    template: "¿Qué dice la documentación sobre [agregar tema]?",
    description: "Consulta la base documental",
  },
];

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
  const [showActions, setShowActions] = useState(false);

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
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const actionScrollRef = useRef<HTMLDivElement | null>(null);

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

  const sendQuick = async (text: string) => {
    if (!text || isLoading) return;
    addMessage("user", text);
    setIsLoading(true);
    try {
      const reply = await sendChatMessage({ message: text, sessionId: session.id });
      addMessage("assistant", reply);
    } finally {
      setIsLoading(false);
    }
  };
  const handleQuickAction = (text: string) => {
    if (!text) return;
    setShowActions(false);
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handlePrefillFromList = useCallback((text: string) => {
    if (!text) return;
    setShowActions(false);
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

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

  useEffect(() => {
    if (!showActions) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (actionMenuRef.current?.contains(target) || actionButtonRef.current?.contains(target)) {
        return;
      }
      setShowActions(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showActions]);

  useEffect(() => {
    if (showActions) {
      actionScrollRef.current?.scrollTo({ top: 0 });
    }
  }, [showActions]);


  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const hasPlaceholders = /\[agregar [^\]]+\]/i.test(text);
    if (hasPlaceholders) {
      const msg = "Completa los campos marcados con [agregar ...] antes de enviar.";
      const last = messages[messages.length - 1];
      if (!(last && last.role === "assistant" && last.content === msg)) {
        addMessage("assistant", msg);
      }
      textareaRef.current?.focus();
      return;
    }

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
        aria-controls="cinap-chat-panel"
        aria-expanded={isOpen}
        onClick={toggleChat}
        className={classNames(
          "relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 transform",
          "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 hover:scale-110 hover:shadow-2xl",
          "focus:outline-none focus:ring-4 focus:ring-blue-400/50 focus:ring-offset-2",
          "active:scale-95",
          "pointer-events-auto"
        )}
      >
        {/* iconos */}
        <span className={classNames("absolute transition-all duration-300", isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100")} aria-hidden>
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span className={classNames("absolute transition-all duration-300", isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75")} aria-hidden>
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>

        {/* badge no leídos */}
        <span
          className={classNames(
            "absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-3 border-white text-xs font-bold shadow-lg animate-pulse",
            unread > 0 ? "bg-gradient-to-br from-red-500 to-red-600 text-white" : "hidden"
          )}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      </button>

      {/* Backdrop y Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 pointer-events-auto md:static md:z-auto">
          {/* Backdrop */}
          <div
            onClick={(e) => { e.stopPropagation(); closeChat(); }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            id="cinap-chat-panel"
            role="dialog"
            aria-label="Chat CINAP"
            aria-modal="true"
            className={classNames(
              "fixed inset-x-4 bottom-4 top-auto h-[560px] max-h-[80vh] rounded-2xl bg-white shadow-2xl ring-2 ring-blue-100 backdrop-blur-sm",
              "sm:inset-x-6 sm:bottom-6 sm:max-h-[82vh]",
              "md:inset-x-auto md:left-auto md:right-5 md:bottom-24 md:h-[560px] md:max-h-[85vh] md:w-[380px] md:max-w-[min(380px,_90vw)] md:rounded-3xl",
              "transition-all duration-300 ease-out opacity-100 translate-y-0 scale-100 md:translate-y-0",
              "pointer-events-auto overflow-hidden"
            )}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex h-full flex-col overflow-hidden md:rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5 text-blue-900">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 font-bold text-lg text-white shadow-md">
                  C
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">Chat CINAP</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-blue-700">
                    <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-sm" />
                    <span>Asistente en línea</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); closeChat(); }}
                className="rounded-xl p-2.5 text-blue-700 transition-all duration-200 hover:bg-blue-200/50 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                aria-label="Cerrar chat"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mensajes */}
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 p-6">
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onQuickSend={sendQuick}
                  onPrefillInput={handlePrefillFromList}
                  hasUserReplyAfter={messages.slice(i + 1).some(mm => mm.role === "user")}
                />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar role="assistant" />
                  <div className="max-w-[80%] rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-blue-700 shadow-lg ring-1 ring-blue-100">
                    <div className="flex items-center gap-1">
                      <Dot /><Dot className="animation-delay-200" /><Dot className="animation-delay-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-white p-5">
              <div
                className={classNames(
                  "relative flex items-end gap-3 rounded-2xl border-2 border-blue-200/50 bg-white p-3 shadow-md backdrop-blur-sm transition-all",
                  "focus-within:border-blue-400 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-blue-200/50"
                )}
              >
                <button
                  ref={actionButtonRef}
                  type="button"
                  aria-expanded={showActions}
                  aria-controls="chat-quick-actions"
                  onClick={() => setShowActions((prev) => !prev)}
                  disabled={isLoading}
                  className={classNames(
                    "flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-sm transition-all",
                    "hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200",
                    "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {showActions && (
                  <div
                    id="chat-quick-actions"
                    ref={(node) => {
                      actionMenuRef.current = node;
                    }}
                    className={classNames(
                      "absolute left-1/2 z-10 w-full max-w-[260px] -translate-x-1/2",
                      "sm:max-w-[280px] md:max-w-[300px]",
                      "rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/95 to-blue-50/80 p-4 text-left shadow-2xl ring-1 ring-blue-200/70",
                      "backdrop-blur-xl max-h-[360px] md:max-h-[420px] flex flex-col gap-3"
                    )}
                    style={{ bottom: "calc(100% + 16px)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                      Acciones rápidas
                    </p>
                    <div
                      ref={actionScrollRef}
                      className="max-h-[280px] md:max-h-[320px] overflow-y-auto pr-2"
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => handleQuickAction(action.template)}
                            className={classNames(
                              "rounded-2xl border border-blue-100/70 bg-white/90 px-3 py-3 text-left text-sm text-blue-900 shadow-sm transition-all",
                              "hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-lg",
                              "focus:outline-none focus:ring-2 focus:ring-blue-200"
                            )}
                          >
                            <span className="block font-semibold">{action.label}</span>
                            {action.description ? (
                              <span className="block text-xs text-blue-600">{action.description}</span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-500 bg-white/85 backdrop-blur-sm rounded-2xl px-3 py-2">
                      Completa los campos marcados con [agregar ...] antes de enviar.
                    </p>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  maxLength={500}
                  placeholder="Escribe tu mensaje..."
                  value={input}
                  onChange={(e) => { setInput(e.target.value); }}
                  onKeyDown={onKeyDown}
                  className="min-h-[40px] max-h-[120px] w-full resize-none bg-transparent p-2 text-sm text-blue-900 outline-none placeholder:text-blue-400"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={classNames("flex h-11 w-11 items-center justify-center rounded-xl text-white transition-all shadow-md", "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:scale-100")}
                  aria-label="Enviar mensaje"
                >
                  {isLoading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                      <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" className="opacity-90" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22,2 15,22 11,13 2,9 22,2" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-blue-600">
                Presiona <span className="font-semibold text-blue-800">Enter</span> para enviar,{" "}
                <span className="font-semibold text-blue-800">Shift+Enter</span> para nueva línea
              </p>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ role }: { role: Role }) {
  return (
    <div
      className={classNames(
        "mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold shadow-md ring-2 ring-white",
        role === "assistant" ? "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" : "bg-gradient-to-br from-emerald-500 to-emerald-600"
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

function PaginatedList({
  items,
  pageSize = 2,
  cardMinH = 90,
  onSelect,
}: {
  items: PaginatedItem[];
  pageSize?: number;
  cardMinH?: number;
  onSelect?: (item: PaginatedItem, index: number) => void;
}) {
  const [page, setPage] = useState(0);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize;
  const slice = items.slice(start, start + pageSize);
  const missing = Math.max(0, pageSize - slice.length);

  return (
    <div className={classNames("mt-2 text-left mx-auto", "w-[min(220px,80vw)]")}>
      <ul className={classNames("flex flex-col gap-2", "w-full")}>
        {slice.map((it, idx) => {
          const absoluteIndex = start + idx;
          const clickable = !!onSelect;
          return (
            <li
              key={`it-${absoluteIndex}`}
              style={{ minHeight: cardMinH }}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : -1}
              onClick={() => onSelect?.(it, absoluteIndex)}
              onKeyDown={(e) => {
                if (!onSelect) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(it, absoluteIndex);
                }
              }}
              className={classNames(
                "w-full rounded-xl border border-blue-100 bg-white/80 p-3 flex flex-col justify-center text-center shadow-sm transition-all duration-200",
                clickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              )}
            >
              <div className="font-medium text-blue-900 leading-snug text-balance break-words">
                {it.title || "(sin título)"}
              </div>
              {it.subtitle && <div className="text-xs text-blue-500 mt-0.5">{it.subtitle}</div>}
              {(it.start || it.end) && (
                <div className="text-xs text-blue-500 mt-0.5">
                  {it.start || ""}{(it.start || it.end) ? " - " : ""}{it.end || ""}
                </div>
              )}
            </li>
          );
        })}
        {/* Placeholders */}
        {Array.from({ length: missing }).map((_, i) => (
          <li
            key={`ph-${i}`}
            aria-hidden
            className="w-full rounded-xl border border-transparent p-3 opacity-0 pointer-events-none"
            style={{ minHeight: cardMinH }}
          />
        ))}
      </ul>

      {/* Paginador */}
      {pages > 1 && (
        <div className={classNames("mt-3 flex items-center justify-center gap-3", "w-full")}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-full border border-blue-200 bg-white px-3 py-1.5 
                       text-sm text-blue-700 disabled:opacity-40"
          >
            ◀
          </button>
          <span className="text-xs text-blue-600">
            Página {page + 1} de {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1}
            className="rounded-full border border-blue-200 bg-white px-3 py-1.5 
                       text-sm text-blue-700 disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

function parseCinapListMarker(content: string): { clean: string; list: null | { kind: string; items: any[] } } {
  const re = /<!--CINAP_LIST:([A-Za-z0-9+/=]+)-->/g;
  let match: RegExpExecArray | null;
  let lastList: any = null;
  let clean = content;

  while ((match = re.exec(content)) !== null) {
    try {
      const b64 = match[1];
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const jsonStr = new TextDecoder("utf-8").decode(bytes);
      lastList = JSON.parse(jsonStr);
    } catch { /* ignore */ }
    clean = clean.replace(match[0], "").trim();
  }
  return { clean, list: lastList };
}

function parseCinapConfirmMarker(content: string): { clean: string; confirm: null | { idempotency?: string; ttl_sec?: number } } {
  const re = /<!--CINAP_CONFIRM:([A-Za-z0-9+/=]+)-->/g;
  let match: RegExpExecArray | null;
  let last: any = null;
  let clean = content;

  while ((match = re.exec(content)) !== null) {
    try {
      const b64 = match[1];
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const jsonStr = new TextDecoder("utf-8").decode(bytes);
      last = JSON.parse(jsonStr);
    } catch { /* ignore */ }
    clean = clean.replace(match[0], "").trim();
  }
  return { clean, confirm: last };
}

function parseCinapSourceMarker(content: string): {
  clean: string;
  source: null | { title?: string | null; page?: number | null };
} {
  const re = /<!--CINAP_SOURCE:([A-Za-z0-9+/=]+)-->/g;
  let match: RegExpExecArray | null;
  let last: any = null;
  let clean = content;

  while ((match = re.exec(content)) !== null) {
    try {
      const b64 = match[1];
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const jsonStr = new TextDecoder("utf-8").decode(bytes);
      last = JSON.parse(jsonStr);
    } catch {
      /* ignore */
    }
    clean = clean.replace(match[0], "").trim();
  }

  if (!last) return { clean, source: null };

  return {
    clean,
    source: {
      title: last.title ?? last.doc_title ?? null,
      page: last.page ?? last.page_no ?? null,
    },
  };
}

function MessageBubble({
  message,
  onQuickSend,
  onPrefillInput,
  hasUserReplyAfter,
}: {
  message: ChatMessage;
  onQuickSend?: (text: string) => void;
  onPrefillInput?: (text: string) => void;
  hasUserReplyAfter?: boolean;
}) {
  const time = useMemo(
    () => new Date(message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    [message.createdAt]
  );
  const isUser = message.role === "user";

  const { clean: afterList, list } = useMemo(() => parseCinapListMarker(message.content),[message.content]);
  const { clean: afterConfirm, confirm } = useMemo(() => parseCinapConfirmMarker(afterList),[afterList]);
  const { clean, source } = useMemo(() => parseCinapSourceMarker(afterConfirm),[afterConfirm]);
  const listKind = useMemo(() => (list?.kind || "").toLowerCase(),[list?.kind]);
  const isReservableList = useMemo(() => {
    if (!listKind) return false;
    const allowed = new Set([
      "list_slots",
      "slots",
      "list_availability",
      "availability",
      "list_professor_availability",
      "list_professor_slots",
    ]);
    return allowed.has(listKind) || listKind.includes("slot") || listKind.includes("availability");
  }, [listKind]);

  const [decided, setDecided] = useState(false);
  const handleChoice = useCallback((ans: "si" | "no") => {
    if (decided || hasUserReplyAfter) return;
    setDecided(true);
    onQuickSend?.(ans);
  }, [decided, hasUserReplyAfter, onQuickSend]);

  const handleSelectItem = useCallback((item: PaginatedItem) => {
    if (isUser || !isReservableList || !onPrefillInput) return;
    const normalize = (v: unknown) => {
      if (typeof v === "string") return v.trim();
      if (v === null || v === undefined) return "";
      return String(v).trim();
    };
    const titleRaw = normalize(item?.title);
    const subtitleRaw = normalize(item?.subtitle);
    const advisor = subtitleRaw || titleRaw;
    const start = normalize(item?.start);
    const end = normalize(item?.end);
    const timeFromStart = (start || "").match(/\d{1,2}:\d{2}/)?.[0] || "";
    const timeLabel = timeFromStart || end || "";
    let dateLabel = start;
    if (timeFromStart && dateLabel.includes(timeFromStart)) {
      dateLabel = dateLabel.replace(timeFromStart, "").trim();
    }
    const fmtDate = (() => {
      const s = dateLabel || "";
      const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
      const iso = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (iso) {
        const [, y, m, d] = iso;
        const mi = Number(m) - 1;
        const month = monthNames[mi] || m;
        return `${d.padStart(2, "0")} de ${month}${y ? " de " + y : ""}`;
      }
      const inv = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (inv) {
        const [, d, m, y] = inv;
        const mi = Number(m) - 1;
        const month = monthNames[mi] || m;
        return `${d.padStart(2, "0")} de ${month}${y ? " de " + y : ""}`;
      }
      return s || "[agregar fecha]";
    })();
    const service = (() => {
      let s = titleRaw || subtitleRaw;
      const patterns = [
        /^\s*cupo\s*[—–-]?\s*/i,
        /^\s*cupo\s*[:—–-]\s*/i,
        /^\s*cupo\s+/i,
      ];
      patterns.forEach((re) => { s = s.replace(re, ""); });
      s = s.replace(/\bcupo\b\s*/i, "").trim();
      return s || "[agregar servicio]";
    })();
    const text = `Reserva una asesoria con ${advisor || "[agregar nombre]"} de ${service} para el ${fmtDate} las ${timeLabel || "[agregar hora]"}`;
    onPrefillInput(text);
  }, [isUser, isReservableList, onPrefillInput]);

  const disabled = decided || !!hasUserReplyAfter;

  return (
    <div className={classNames("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <Avatar role={message.role} />
      <div className={classNames("max-w-[80%] space-y-2", isUser && "items-end text-right")}>
        <div
          className={classNames(
            "rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur-sm",
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white ring-1 ring-emerald-400"
              : "border border-blue-200 bg-white/90 text-blue-900 ring-1 ring-blue-100"
          )}
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          <ReactMarkdown
            components={{
              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
              em: ({children}) => <em className="italic">{children}</em>,
              li: ({children}) => <li className="list-disc ml-5">{children}</li>,
              a: (props) => <a {...props} target="_blank" rel="noreferrer" className="text-blue-600 underline" />,
            }}
          >
            {clean}
          </ReactMarkdown>
          {(!isUser && list?.items?.length) ? (
            <PaginatedList
              items={list.items}
              onSelect={isReservableList ? handleSelectItem : undefined}
            />
          ) : null}

          {!isUser && confirm ? (
            <div className="mt-3 flex items-center gap-2 justify-center">
              <button
                onClick={() => handleChoice("si")}
                disabled={disabled}
                aria-disabled={disabled}
                className={classNames(
                  "rounded-xl px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:-translate-y-0.5",
                  disabled && "opacity-50 pointer-events-none hover:bg-blue-600 hover:translate-y-0"
                )}
              >
                Si
              </button>
              <button
                onClick={() => handleChoice("si")}
                disabled={disabled}
                aria-disabled={disabled}
                className={classNames(
                  "rounded-xl px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-white hover:bg-blue-50 shadow-md transition-all hover:-translate-y-0.5",
                  disabled && "opacity-50 pointer-events-none hover:bg-white hover:translate-y-0"
                )}
              >
                No
              </button>
            </div>
          ) : null}
          {!isUser && source && (source.title || source.page) && (
            <div className="mt-2 pt-2 border-t border-blue-100 text-[11px] text-blue-500">
              Fuente: {source.title || "Documento institucional"}
              {source.page ? `, página ${source.page}` : null}
            </div>
          )}
        </div>
        <div className={classNames("px-1 text-xs", isUser ? "text-emerald-600" : "text-blue-500")}>{time}</div>
      </div>
    </div>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return <span className={classNames("inline-block h-2 w-2 animate-bounce rounded-full bg-blue-500 shadow-sm", className)} />;
}










