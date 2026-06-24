"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useTasks } from "@/components/providers/TaskProvider";
import { BotIcon, ArrowRightIcon, LeafIcon, SendIcon, AlertIcon } from "@/components/ui/Icons";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
};

type ChatThread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};

type ServerStatus = "checking" | "ready" | "waking" | "offline";

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm EcoBot, your sustainability assistant. Ask me anything about waste segregation, recycling rules in India, or how to use the IWIS platform.",
  timestamp: new Date().toISOString(),
};

const CHAT_STAGES = [
  { label: "Understanding your question…", minDelay: 0 },
  { label: "Searching sustainability knowledge base…", minDelay: 2000 },
  { label: "Analyzing environmental context…", minDelay: 6000 },
  { label: "Generating response…", minDelay: 12000 },
];

function getChatStorageKey(): string {
  try {
    const token = getToken();
    if (!token) return "ecobot_threads_anonymous";
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const userId = payload.id || payload.sub || "unknown";
    return `ecobot_threads_${userId}`;
  } catch {
    return "ecobot_threads_anonymous";
  }
}

export default function ChatPage() {
  const { startTask, updateTaskProgress, completeTask, failTask, getTask, dismissTask } = useTasks();
  const chatTask = getTask("global_chat");

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const endRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = useRef<string>("");

  const loading = chatTask?.status === "running";

  useEffect(() => {
    if (chatTask?.status === "success" && chatTask.payload) {
      const currentThread = threads.find((t) => t.id === chatTask.payload.threadId);
      if (currentThread) {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: chatTask.payload.reply,
          timestamp: new Date().toISOString(),
        };
        const updated = threads.map((t) =>
          t.id === currentThread.id ? { ...t, messages: [...t.messages, botMsg] } : t
        );
        setThreads(updated);
        localStorage.setItem(storageKey.current, JSON.stringify(updated));
      }
      dismissTask("global_chat");
    }
  }, [chatTask?.status, chatTask?.payload, threads, dismissTask]);

  useEffect(() => {
    const wakeServer = async () => {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
        setServerStatus(r.ok ? "ready" : "waking");
      } catch {
        setServerStatus("waking");
      }
    };
    wakeServer();
  }, []);

  useEffect(() => {
    const key = getChatStorageKey();
    storageKey.current = key;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThreads(parsed);
        if (parsed.length > 0) setActiveThreadId(parsed[0].id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!storageKey.current) return;
    if (threads.length > 0) {
      localStorage.setItem(storageKey.current, JSON.stringify(threads));
    }
  }, [threads]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadId, threads, loading]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const handleNewThread = () => {
    const t: ChatThread = {
      id: crypto.randomUUID(),
      title: "New Chat",
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(t.id);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      setActiveThreadId(threads[0]?.id || null);
    }
  };

  const handleSend = useCallback(async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    let currentThread = threads.find((t) => t.id === activeThreadId);
    let finalThreads = [...threads];

    if (!currentThread) {
      currentThread = {
        id: crypto.randomUUID(),
        title: "New Chat",
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      finalThreads = [currentThread, ...finalThreads];
    }

    const history = currentThread.messages.map((m) => ({
      role: m.role,
      text: m.content,
    }));

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: messageText.trim(), timestamp: new Date().toISOString() };

    let title = currentThread.title;
    if (currentThread.messages.length === 0) {
      const words = messageText.trim().split(" ");
      title = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
    }

    const newMessages = [...currentThread.messages, userMsg];
    const threadId = currentThread.id;

    const updatedThreads = finalThreads.map((t) =>
      t.id === threadId ? { ...t, title, messages: newMessages } : t
    );
    setThreads(updatedThreads);
    localStorage.setItem(storageKey.current, JSON.stringify(updatedThreads));

    setInput("");
    setStageIdx(0);
    startTask("global_chat", "chat", "EcoBot Replying");

    let currentStage = 0;
    stageRef.current = setInterval(() => {
      const elapsed = (currentStage + 1) * 2000;
      const nextStage = CHAT_STAGES.findIndex((st, i) => i > currentStage && elapsed >= st.minDelay);
      if (nextStage !== -1) {
        currentStage = nextStage;
        setStageIdx(nextStage);
        updateTaskProgress("global_chat", CHAT_STAGES[nextStage].label);
      }
    }, 2000);

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message: messageText.trim(), history }),
      });
      if (stageRef.current) clearInterval(stageRef.current);
      completeTask("global_chat", { reply: response.reply, threadId });
    } catch (error: any) {
      if (stageRef.current) clearInterval(stageRef.current);
      const isNetworkError = error?.statusCode === 0 || error?.message?.includes("Failed to fetch");
      const errorText = isNetworkError ? "⚡ Server is waking up — please try again." : error instanceof ApiError ? `⚠️ ${error.backendMessage}` : `😔 EcoBot error: ${error?.message || "Unknown error"}`;
      failTask("global_chat", errorText);
      const errMsg: Message = { id: crypto.randomUUID(), role: "assistant", isError: true, timestamp: new Date().toISOString(), content: errorText };
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, messages: [...t.messages, errMsg] } : t));
    }
  }, [threads, activeThreadId, loading, startTask, completeTask, failTask, updateTaskProgress]);

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto flex h-[calc(100vh-100px)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] animate-fadeIn shadow-sm">
        
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface-raised)]">
          <div className="p-4 border-b border-[var(--border)]">
            <button
              onClick={handleNewThread}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threads.length === 0 ? (
              <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">No recent chats</p>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
                    activeThreadId === t.id
                      ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <BotIcon size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                    <span className="truncate">{t.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteThread(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--destructive)] transition-all"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Mobile Header */}
          <div className="md:hidden p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-raised)]">
            <span className="font-semibold text-[var(--text-primary)]">EcoBot</span>
            <button onClick={handleNewThread} className="text-xs text-[var(--text-secondary)]">New Chat</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide bg-[var(--surface)]">
            
            {/* Empty State */}
            {!activeThread || activeThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center mb-6 shadow-inner">
                  <LeafIcon size={28} className="text-[var(--accent-text)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Meet EcoBot
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
                  Your intelligent sustainability assistant. Ask questions about recycling, environmental impact, and how to use IWIS.
                </p>
                
                <div className="grid gap-2 w-full">
                  {[
                    "How do I recycle electronic waste?",
                    "What counts as organic waste?",
                    "How does the CO₂ calculation work?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-border)] hover:bg-[var(--surface)] transition-all text-left flex items-center justify-between group"
                    >
                      <span className="truncate pr-4">{q}</span>
                      <ArrowRightIcon size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Message List
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <BotIcon size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text-primary)] leading-relaxed">
                      {INITIAL_MESSAGE.content}
                    </div>
                  </div>
                </div>

                {activeThread.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${
                      msg.role === "user" ? "bg-[var(--text-primary)]" : "bg-[var(--accent)]"
                    }`}>
                      {msg.role === "user" ? (
                        <span className="text-xs font-semibold text-[var(--bg)]">You</span>
                      ) : (
                        <BotIcon size={16} className="text-white" />
                      )}
                    </div>
                    <div className={`flex-1 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                        msg.role === "user" 
                          ? "rounded-tr-sm bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)]" 
                          : msg.isError 
                            ? "rounded-tl-sm bg-[var(--destructive-bg)] border border-[var(--destructive-border)] text-[var(--destructive)]" 
                            : "rounded-tl-sm bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)]"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Staged Loading Bubble */}
                {loading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <BotIcon size={16} className="text-white" />
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text-secondary)] shadow-sm">
                      <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="animate-fadeIn" key={stageIdx}>
                        {CHAT_STAGES[stageIdx]?.label || "Thinking…"}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)]">
            <div className="max-w-3xl mx-auto relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                disabled={loading}
                placeholder="Ask EcoBot a question..."
                className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <SendIcon size={14} />
              </button>
            </div>
            
            <div className="flex items-center justify-between max-w-3xl mx-auto mt-2 px-1">
              <p className="text-2xs text-[var(--text-tertiary)] hidden sm:block">
                EcoBot can make mistakes. Verify important information.
              </p>
              {serverStatus === "waking" && !loading && (
                <div className="flex items-center gap-1.5 text-2xs text-[var(--warning)] font-medium ml-auto">
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  Server waking up...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
