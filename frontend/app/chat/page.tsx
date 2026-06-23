"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
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

  // Load threads from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ecobot_threads");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatThread[];
        setThreads(parsed);
        if (parsed.length > 0) setActiveThreadId(parsed[0].id);
      } catch { /* ignore */ }
    }
  }, []);

  // Persist threads
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem("ecobot_threads", JSON.stringify(threads));
    } else {
      localStorage.removeItem("ecobot_threads");
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
          history: updatedMessages.slice(0, -1), // history without the current msg
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

      const isConnectionError =
        error?.message?.includes("Failed to connect") ||
        error?.message?.includes("Failed to fetch");

      const errMsg: Message = {
        role: "model",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: isConnectionError
          ? "⚡ Server is waking up — retrying in 8 seconds…"
          : "😔 EcoBot couldn't respond. Please try sending your message again.",
        retryPayload: isConnectionError
          ? { message: messageText, history: updatedMessages.slice(0, -1) }
          : undefined,
      };

      appendMessage(threadId, errMsg);

      // Auto-retry once for connection errors
      if (isConnectionError) {
        let countdown = 8;
        setRetryCountdown(countdown);
        const tick = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(tick);
            setRetryCountdown(null);
            // Retry the message
            setLoading(false);
            handleRetry(messageText, updatedMessages.slice(0, -1), threadId);
            return;
          }
          setRetryCountdown(countdown);
        }, 1000);
        retryTimerRef.current = tick;
        // Return early so setLoading(false) below doesn't prematurely clear
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

      // Replace the error message with the real reply
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const msgs = [...t.messages];
          // Remove the last error message
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
    } catch {
      updateLastMessage(threadId, {
        text: "😔 Still unable to reach EcoBot. The server may be down. Please try again manually.",
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
      <div className="flex h-[82vh] max-w-6xl mx-auto rounded-3xl overflow-hidden border border-neutral-800 bg-[#131314] text-neutral-100 shadow-2xl">
        {/* SIDEBAR */}
        <div className="w-64 bg-[#1e1f20] border-r border-neutral-800 flex flex-col p-4">
          <button
            onClick={handleCreateNewThread}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#2c2d30] hover:bg-[#37393b] text-sm font-semibold transition border border-neutral-700/50 mb-4"
          >
            <span className="text-lg">＋</span> New Chat
          </button>

          {/* Server status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-4 ${
            serverStatus === "ready" ? "text-emerald-400 bg-emerald-500/10" :
            serverStatus === "waking" ? "text-amber-400 bg-amber-500/10 animate-pulse" :
            serverStatus === "offline" ? "text-red-400 bg-red-500/10" :
            "text-neutral-500 bg-neutral-800/50"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              serverStatus === "ready" ? "bg-emerald-400" :
              serverStatus === "waking" ? "bg-amber-400" :
              serverStatus === "offline" ? "bg-red-400" :
              "bg-neutral-600"
            }`} />
            {serverStatus === "ready" ? "EcoBot Online" :
             serverStatus === "waking" ? "Server Starting…" :
             serverStatus === "offline" ? "Server Offline" :
             "Connecting…"}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-3 mb-2">
              Chat History
            </div>
            {threads.length === 0 ? (
              <div className="text-xs text-neutral-500 px-3 py-2 italic">No recent chats</div>
            ) : (
              threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition cursor-pointer select-none ${
                      isActive ? "bg-[#37393b] text-white" : "text-neutral-400 hover:bg-[#2c2d30] hover:text-neutral-200"
                    }`}
                  >
                    <span className="truncate pr-2 font-medium flex-1">💬 {thread.title}</span>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#484a4d] rounded-lg transition text-neutral-400 hover:text-red-400"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 text-center">
            <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">EcoBot AI v2.0</span>
          </div>
        </div>

        {/* CHAT PANEL */}
        <div className="flex-1 flex flex-col relative bg-[#131314]">
          {messages.length === 0 ? (
            /* Welcome / Suggestions */
            <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-8 text-center py-12">
              <div className="max-w-xl space-y-8 animate-fadeIn">
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 animate-pulse text-2xl">
                    ✨
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent leading-normal">
                    Build your eco-ideas with Gemini
                  </h1>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto">
                    Ask EcoBot about climate action, circular economy, waste reduction, or how to earn Green Points.
                  </p>
                </div>

                {serverStatus === "waking" && (
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400">
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Server is starting up — first message may take ~15 sec
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-left">
                  {SUGGESTIONS.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(s.prompt)}
                      className="p-4 rounded-2xl border border-neutral-800 bg-[#1e1f20]/50 hover:bg-[#1e1f20] hover:border-neutral-700 transition cursor-pointer flex flex-col justify-between group h-28"
                    >
                      <h3 className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">{s.title}</h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 pr-2">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? "items-end text-right" : "items-start text-left"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-[#2f3f35] text-emerald-100 border border-emerald-950/20 rounded-br-sm"
                          : msg.isError
                          ? "bg-amber-900/20 text-amber-300 border border-amber-800/40 rounded-bl-sm"
                          : "bg-[#1e1f20] text-neutral-200 border border-neutral-800/80 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                      {msg.isError && retryCountdown !== null && index === messages.length - 1 && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-amber-400/70">Retrying in {retryCountdown}s…</span>
                          <button
                            onClick={cancelRetry}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.timestamp && (
                      <span className="text-[10px] text-neutral-500 mt-1.5 px-1 select-none font-medium uppercase tracking-wider">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl px-5 py-3.5 text-sm bg-[#1e1f20] border border-neutral-800/80 text-neutral-400 rounded-bl-sm flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {retryCountdown !== null ? `Retrying in ${retryCountdown}s…` : "EcoBot is thinking…"}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {/* Input */}
          <div className="p-6 bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent border-t border-neutral-900/50">
            <div className="max-w-3xl mx-auto flex items-center gap-3 bg-[#282a2c] rounded-full border border-neutral-800 px-5 py-2.5 shadow-lg focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition">
              <span className="text-neutral-500 select-none text-lg">💡</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(input); }}
                placeholder="Ask EcoBot anything about the environment…"
                className="flex-1 bg-transparent text-sm focus:outline-none text-neutral-100 placeholder-neutral-500"
                disabled={loading}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#1a1b1e] text-[#0f0f10] disabled:text-neutral-600 w-10 h-10 rounded-full font-bold transition-all disabled:opacity-50"
                title="Send message"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                ) : "➔"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
