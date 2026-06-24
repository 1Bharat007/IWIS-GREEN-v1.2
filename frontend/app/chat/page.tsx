"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

type Message = {
  role: "user" | "model";
  text: string;
  timestamp?: string;
  isError?: boolean;
  retryPayload?: { message: string; history: Message[] };
};

type ChatThread = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

type ServerStatus = "checking" | "ready" | "waking" | "offline";

const SUGGESTIONS = [
  {
    title: "Reduce footprint",
    desc: "How can I reduce my daily plastic footprint?",
    prompt: "How can I reduce my daily plastic footprint in a simple, practical way?",
  },
  {
    title: "Scope 3 emissions",
    desc: "Explain Scope 3 emissions simply.",
    prompt: "Can you explain what Scope 3 emissions are and why they are important for environmental sustainability?",
  },
  {
    title: "Green Rewards",
    desc: "What rewards can I earn in IWIS?",
    prompt: "Tell me about the Green Points Wallet and how I can earn and use rewards.",
  },
  {
    title: "Net Zero 2070",
    desc: "What is India's 2070 mission?",
    prompt: "What is India's Net Zero 2070 mission, and how does waste management play a part?",
  },
];

// SECURITY FIX: derive a user-scoped localStorage key from the JWT so
// chat threads are NEVER shared between different accounts on the same device.
function getChatStorageKey(): string {
  try {
    const token = getToken();
    if (!token) return "ecobot_threads_guest";
    // JWT payload is the second segment, base64url encoded
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const userId = payload.id || payload.sub || "unknown";
    return `ecobot_threads_${userId}`;
  } catch {
    return "ecobot_threads_guest";
  }
}

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = useRef<string>("");

  // Wake up backend on mount
  useEffect(() => {
    const wakeServer = async () => {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const pingHealth = async (timeout: number) => {
        const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(timeout) });
        return res.ok;
      };

      try {
        const ok = await pingHealth(6000);
        setServerStatus(ok ? "ready" : "waking");
        if (!ok) {
          setTimeout(async () => {
            try {
              const ok2 = await pingHealth(15000);
              setServerStatus(ok2 ? "ready" : "offline");
            } catch { setServerStatus("offline"); }
          }, 5000);
        }
      } catch {
        setServerStatus("waking");
        setTimeout(async () => {
          try {
            const ok2 = await pingHealth(20000);
            setServerStatus(ok2 ? "ready" : "offline");
          } catch { setServerStatus("offline"); }
        }, 8000);
      }
    };
    wakeServer();
  }, []);

  // SECURITY FIX: Load threads from user-scoped localStorage key
  useEffect(() => {
    const key = getChatStorageKey();
    storageKey.current = key;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatThread[];
        setThreads(parsed);
        if (parsed.length > 0) setActiveThreadId(parsed[0].id);
      } catch { /* ignore */ }
    }
  }, []);

  // Persist threads to user-scoped key
  useEffect(() => {
    if (!storageKey.current) return;
    if (threads.length > 0) {
      localStorage.setItem(storageKey.current, JSON.stringify(threads));
    } else {
      localStorage.removeItem(storageKey.current);
    }
  }, [threads]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadId, threads, loading]);

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const messages = activeThread?.messages ?? [];

  const handleCreateNewThread = () => {
    const t: ChatThread = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(t.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter((t) => t.id !== id);
    setThreads(filtered);
    if (activeThreadId === id) {
      setActiveThreadId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const appendMessage = (threadId: string, msg: Message) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t
      )
    );
  };

  const updateLastMessage = (threadId: string, msg: Partial<Message>) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const updated = [...t.messages];
        const last = updated[updated.length - 1];
        if (last) updated[updated.length - 1] = { ...last, ...msg };
        return { ...t, messages: updated };
      })
    );
  };

  const handleSend = useCallback(async (messageText: string, existingThreadId?: string) => {
    if (!messageText.trim() || loading) return;

    let currentThread = existingThreadId
      ? threads.find((t) => t.id === existingThreadId)
      : activeThread;

    let updatedThreads = [...threads];

    if (!currentThread) {
      currentThread = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
      };
      updatedThreads = [currentThread, ...updatedThreads];
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { role: "user", text: messageText.trim(), timestamp: now };

    // Auto-title on first message
    let title = currentThread.title;
    if (currentThread.messages.length === 0) {
      const words = messageText.trim().split(" ");
      title = words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
    }

    const updatedMessages = [...currentThread.messages, userMsg];
    currentThread = { ...currentThread, title, messages: updatedMessages };
    const finalThreads = updatedThreads.map((t) => (t.id === currentThread!.id ? currentThread! : t));

    setThreads(finalThreads);
    setActiveThreadId(currentThread.id);
    setInput("");
    setLoading(true);
    setRetryCountdown(null);

    const threadId = currentThread.id;

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg.text,
          history: updatedMessages.slice(0, -1),
        }),
      });

      const modelMsg: Message = {
        role: "model",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      appendMessage(threadId, modelMsg);
    } catch (error: any) {
      console.error("EcoBot error:", error);

      // BUGFIX: Use ApiError.backendMessage directly — no JSON parsing needed
      // because apiFetch now pre-parses the backend response.
      const isNetworkError =
        error?.statusCode === 0 ||
        error?.message?.includes("Failed to fetch");

      let errorText: string;
      if (isNetworkError) {
        errorText = "⚡ Server is waking up — retrying in 8 seconds…";
      } else if (error instanceof ApiError) {
        // backendMessage is already the clean string from the backend JSON
        errorText = `⚠️ ${error.backendMessage}`;
      } else {
        errorText = `😔 EcoBot error: ${error?.message || "Unknown error"}`;
      }

      const errMsg: Message = {
        role: "model",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: errorText,
        retryPayload: isNetworkError
          ? { message: messageText, history: updatedMessages.slice(0, -1) }
          : undefined,
      };

      appendMessage(threadId, errMsg);

      // Auto-retry once for network errors
      if (isNetworkError) {
        let countdown = 8;
        setRetryCountdown(countdown);
        const tick = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(tick);
            setRetryCountdown(null);
            setLoading(false);
            handleRetry(messageText, updatedMessages.slice(0, -1), threadId);
            return;
          }
          setRetryCountdown(countdown);
        }, 1000);
        retryTimerRef.current = tick;
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [threads, activeThread, loading]);

  const handleRetry = async (message: string, history: Message[], threadId: string) => {
    setLoading(true);
    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      });

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const msgs = [...t.messages];
          const lastIdx = msgs.map((m) => m.isError).lastIndexOf(true);
          if (lastIdx !== -1) msgs.splice(lastIdx, 1);
          msgs.push({
            role: "model",
            text: response.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          return { ...t, messages: msgs };
        })
      );
    } catch (err: any) {
      const errMsg = err instanceof ApiError ? err.backendMessage : (err?.message || "Unknown error");
      updateLastMessage(threadId, {
        text: `😔 Still unable to reach EcoBot: ${errMsg}`,
        retryPayload: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelRetry = () => {
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    setRetryCountdown(null);
    setLoading(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-[82vh] max-w-6xl mx-auto rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm">
        {/* SIDEBAR */}
        <div className="w-60 border-r border-[var(--border)] bg-[var(--surface-raised)] flex flex-col p-3">
          <button
            onClick={handleCreateNewThread}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-sm font-medium transition-colors border border-[var(--border)] mb-3"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v12M2 8h12"/></svg>
            New Chat
          </button>

          {/* Server status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-3 ${
            serverStatus === "ready"   ? "text-[var(--accent-text)] bg-[var(--accent-subtle)]" :
            serverStatus === "waking"  ? "text-[var(--warning)] bg-[var(--warning-bg)]" :
            serverStatus === "offline" ? "text-[var(--destructive)] bg-[var(--destructive-bg)]" :
            "text-[var(--text-tertiary)] bg-[var(--surface)]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              serverStatus === "ready"   ? "bg-[var(--accent)]" :
              serverStatus === "waking"  ? "bg-[var(--warning)]" :
              serverStatus === "offline" ? "bg-[var(--destructive)]" :
              "bg-[var(--text-tertiary)]"
            }`} />
            {serverStatus === "ready"   ? "EcoBot Online" :
             serverStatus === "waking"  ? "Server starting…" :
             serverStatus === "offline" ? "Server offline" :
             "Connecting…"}
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5">
            <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 pb-1.5">
              Conversations
            </p>
            {threads.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] px-3 py-2">No conversations yet</p>
            ) : (
              threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer select-none ${
                      isActive
                        ? "bg-[var(--border)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span className="truncate pr-2 text-sm flex-1">{thread.title}</span>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--surface-raised)] rounded transition-colors text-[var(--text-tertiary)] hover:text-[var(--destructive)]"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border)]">
            <span className="text-2xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">EcoBot · AI Assistant</span>
          </div>
        </div>

        {/* CHAT PANEL */}
        <div className="flex-1 flex flex-col relative bg-[#131314]">
          {messages.length === 0 ? (
            /* Welcome / Suggestions */
            <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-8 text-center py-12">
              <div className="max-w-lg space-y-6 animate-fadeIn">
                <div className="space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-tertiary)] mb-4">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3a2 2 0 014 0M3 7h10l1 6H2L3 7zM6 11v2M10 11v2"/></svg>
                  </div>
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    Ask EcoBot
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                    Get answers on climate action, waste reduction, circular economy, and how to earn Green Points on IWIS.
                  </p>
                </div>

                {serverStatus === "waking" && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[var(--warning)]">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Server starting — first message may take ~15 sec
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-left">
                  {SUGGESTIONS.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(s.prompt)}
                      className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-strong)] transition-colors cursor-pointer flex flex-col gap-1.5 group"
                    >
                      <span className="text-xs font-semibold text-[var(--accent-text)] group-hover:opacity-80">{s.title}</span>
                      <span className="text-xs text-[var(--text-secondary)] line-clamp-2">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                          : msg.isError
                          ? "bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-bg)]"
                          : "bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)]"
                      }`}
                    >
                      {msg.text}
                      {msg.isError && retryCountdown !== null && index === messages.length - 1 && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-[var(--text-tertiary)]">Retrying in {retryCountdown}s…</span>
                          <button
                            onClick={cancelRetry}
                            className="text-xs text-[var(--destructive)] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.timestamp && (
                      <span className="text-2xs text-[var(--text-tertiary)] mt-1 px-1 select-none">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    {retryCountdown !== null ? `Retrying in ${retryCountdown}s…` : "Thinking…"}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-raised)] focus-within:border-[var(--border-strong)] transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(input); }}
                placeholder="Ask EcoBot about waste, recycling, or climate…"
                className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                disabled={loading}
              />
              <button
                id="ecobot-send"
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors shrink-0"
                title="Send message"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2L1 8l6 2 2 6 5-14z"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
