"use client";

import Link from "next/link";
import { BotIcon } from "@/components/ui/Icons";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/session";

export default function EcoBotFAB() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, [pathname]);

  if (!authed) return null;
  if (pathname === "/chat") return null; // don't show on the chat page itself

  return (
    <Link
      href="/chat"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
      aria-label="Open EcoBot"
    >
      <BotIcon size={24} className="group-hover:scale-110 transition-transform" />
    </Link>
  );
}
