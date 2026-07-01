"use client";

import { useState, useEffect } from "react";

const messages = [
  "Validating account...",
  "Preparing workspace...",
  "Loading dashboard...",
  "Almost ready..."
];

export function AuthLoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--surface)]/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-12 h-12 mb-8 relative">
        <svg className="animate-spin w-full h-full text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div className="h-6 relative w-full max-w-sm flex justify-center overflow-hidden">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`absolute text-sm font-medium text-[var(--text-primary)] transition-all duration-700 ease-out flex items-center gap-2 ${
              i === index ? "opacity-100 translate-y-0" : 
              i < index ? "opacity-0 -translate-y-8" : "opacity-0 translate-y-8"
            }`}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}
