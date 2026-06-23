"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

type Message = {
  role: "user" | "model";
  text: string;
  timestamp?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ecobot_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved chat history");
      }
    } else {
      // Initial greeting if no history
      setMessages([
        {
          role: "model",
          text: "Hello! I am EcoBot 🌿. Ask me anything about climate change, recycling, or environmental sustainability!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, []);

  // Save history on changes & auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ecobot_history", JSON.stringify(messages));
    }
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = { 
      role: "user", 
      text: input.trim(),
      timestamp: currentTime 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.text,
          history: messages.filter((m) => m.role !== "model" || !m.text.includes("EcoBot")), // Avoid sending instructions/greeting if possible
        }),
      });

      setMessages((prev) => [
        ...prev,
        { 
          role: "model", 
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { 
          role: "model", 
          text: "I'm sorry, I'm having trouble connecting to my database right now. Please try again later.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6 flex flex-col h-[80vh]">
        <h1 className="text-3xl font-semibold">EcoBot Chat</h1>
        
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === "user" ? "items-end text-right" : "items-start text-left"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-black text-white dark:bg-white dark:text-black rounded-br-sm"
                      : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.timestamp && (
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 px-1 select-none">
                    {msg.timestamp}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl px-5 py-3 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-bl-sm animate-pulse">
                  EcoBot is typing...
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? handleSend() : null)}
              placeholder="Ask about climate change, recycling, etc..."
              className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-xl text-sm font-medium hover:opacity-80 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
