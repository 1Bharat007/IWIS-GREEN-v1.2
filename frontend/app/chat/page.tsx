"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

type Message = {
  role: "user" | "model";
  text: string;
  timestamp?: string;
};

type ChatThread = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

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
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Load threads from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ecobot_threads");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatThread[];
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved chat threads", e);
      }
    }
  }, []);

  // Save threads to localStorage on changes
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem("ecobot_threads", JSON.stringify(threads));
    } else {
      localStorage.removeItem("ecobot_threads");
    }
  }, [threads]);

  // Scroll to bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadId, threads, loading]);

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const messages = activeThread ? activeThread.messages : [];

  const handleCreateNewThread = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter((t) => t.id !== id);
    setThreads(filtered);
    if (activeThreadId === id) {
      if (filtered.length > 0) {
        setActiveThreadId(filtered[0].id);
      } else {
        setActiveThreadId(null);
      }
    }
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    let currentThread = activeThread;
    let updatedThreads = [...threads];

    // If no active thread, create one dynamically
    if (!currentThread) {
      currentThread = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
      };
      updatedThreads = [currentThread, ...updatedThreads];
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = {
      role: "user",
      text: messageText.trim(),
      timestamp: currentTime,
    };

    // Update current thread messages
    const updatedMessages = [...currentThread.messages, userMessage];
    
    // Auto-generate title if it's the first message
    let title = currentThread.title;
    if (currentThread.messages.length === 0) {
      title = messageText.trim().split(" ").slice(0, 4).join(" ") + (messageText.trim().split(" ").length > 4 ? "..." : "");
    }

    currentThread = {
      ...currentThread,
      title,
      messages: updatedMessages,
    };

    // Update state
    const finalThreads = updatedThreads.map((t) => (t.id === currentThread!.id ? currentThread! : t));
    setThreads(finalThreads);
    setActiveThreadId(currentThread.id);
    setInput("");
    setLoading(true);

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.text,
          history: updatedMessages.filter((m) => m.role !== "model" || !m.text.includes("EcoBot")),
        }),
      });

      const modelMessage: Message = {
        role: "model",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === currentThread!.id
            ? { ...t, messages: [...t.messages, modelMessage] }
            : t
        )
      );
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "model",
        text: "I'm sorry, I'm having trouble connecting to my database right now. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === currentThread!.id
            ? { ...t, messages: [...t.messages, errorMessage] }
            : t
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-[82vh] max-w-6xl mx-auto rounded-3xl overflow-hidden border border-neutral-800 bg-[#131314] text-neutral-100 shadow-2xl">
        {/* LEFT SIDEBAR */}
        <div className="w-64 bg-[#1e1f20] border-r border-neutral-800 flex flex-col p-4">
          <button
            onClick={handleCreateNewThread}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#2c2d30] hover:bg-[#37393b] text-sm font-semibold transition border border-neutral-700/50 mb-6"
          >
            <span className="text-lg">＋</span> New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-3 mb-2">
              Chat History
            </div>

            {threads.length === 0 ? (
              <div className="text-xs text-neutral-500 px-3 py-2 italic">
                No recent chats
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition cursor-pointer select-none ${
                      isActive
                        ? "bg-[#37393b] text-white"
                        : "text-neutral-400 hover:bg-[#2c2d30] hover:text-neutral-200"
                    }`}
                  >
                    <span className="truncate pr-2 font-medium flex-1">
                      💬 {thread.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#484a4d] rounded-lg transition text-neutral-400 hover:text-red-400"
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 text-center">
            <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
              EcoBot AI v2.0
            </span>
          </div>
        </div>

        {/* CHAT DISPLAY PANEL */}
        <div className="flex-1 flex flex-col relative bg-[#131314]">
          {/* Active chat OR Entrance Page */}
          {messages.length === 0 ? (
            /* ENTRANCE DASHBOARD */
            <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-8 text-center py-12">
              <div className="max-w-xl space-y-8 animate-fadeIn">
                <div className="space-y-4">
                  {/* Glowing Sparkle & Headline */}
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 animate-pulse">
                    ✨
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent leading-normal">
                    Build your eco-ideas with Gemini
                  </h1>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto">
                    Ask EcoBot anything about climate action, circular economy, waste reduction, or carbon offsets.
                  </p>
                </div>

                {/* Suggestion Prompt Cards */}
                <div className="grid grid-cols-2 gap-4 text-left">
                  {SUGGESTIONS.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(s.prompt)}
                      className="p-4 rounded-2xl border border-neutral-800 bg-[#1e1f20]/50 hover:bg-[#1e1f20] hover:border-neutral-700 transition cursor-pointer flex flex-col justify-between group h-28"
                    >
                      <h3 className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                        {s.title}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 pr-2">
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CHAT MESSAGES */
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
                          : "bg-[#1e1f20] text-neutral-200 border border-neutral-800/80 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
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
                  <div className="max-w-[75%] rounded-2xl px-5 py-3.5 text-sm bg-[#1e1f20] border border-neutral-800/80 text-neutral-400 rounded-bl-sm animate-pulse flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    EcoBot is thinking...
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          )}

          {/* INPUT PANEL - Prompt Capsule */}
          <div className="p-6 bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent border-t border-neutral-900/50">
            <div className="max-w-3xl mx-auto flex items-center gap-3 bg-[#282a2c] rounded-full border border-neutral-800 px-5 py-2.5 shadow-lg focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition">
              <span className="text-neutral-500 select-none text-lg">💡</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? handleSend(input) : null)}
                placeholder="Describe an eco-idea and let EcoBot do the rest..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-neutral-100 placeholder-neutral-500"
                disabled={loading}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#1a1b1e] text-[#0f0f10] disabled:text-neutral-600 w-10 h-10 rounded-full font-bold transition-all disabled:opacity-50"
                title="Send message"
              >
                ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
