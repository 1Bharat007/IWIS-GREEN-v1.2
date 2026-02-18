"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold">
          IWIS
        </Link>

        <div className="hidden md:flex gap-8 text-sm font-medium">
          {[
            { name: "Scan", path: "/scan" },
            { name: "Dashboard", path: "/dashboard" },
            { name: "History", path: "/history" },
            { name: "Profile", path: "/profile" },
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`transition ${
                isActive(item.path)
                  ? "text-black dark:text-white border-b-2 border-black dark:border-white pb-1"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="text-xl focus:outline-none"
          >
            ☰
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3 text-sm">
              <Link href="/settings" className="block hover:opacity-70">
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block text-red-500 hover:opacity-70"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
