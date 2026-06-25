"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken, getToken } from "@/lib/session";
import { getUser } from "@/lib/authStore";
import {
  MenuIcon, XIcon, ScanIcon, LayoutIcon, HistoryIcon,
  MapPinIcon, ShoppingIcon, TrophyIcon, BotIcon, SettingsIcon, LogOutIcon, UserIcon, SunIcon, MoonIcon, ArrowRightIcon, BarChartIcon
} from "@/components/ui/Icons";

function getRoleFromToken(): string | null {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("iwis_token") : null;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role || "citizen";
  } catch {
    return null;
  }
}

const PRIMARY_NAV = [
  { name: "Scan",      path: "/scan",        Icon: ScanIcon },
  { name: "Dashboard", path: "/dashboard",   Icon: LayoutIcon },
  { name: "History",   path: "/history",     Icon: HistoryIcon },
];

const SECONDARY_NAV = [
  { name: "Hotspots",  path: "/map",         Icon: MapPinIcon },
  { name: "Market",    path: "/marketplace", Icon: ShoppingIcon },
  { name: "Rankings",  path: "/leaderboard", Icon: TrophyIcon },
  { name: "EcoBot",    path: "/chat",        Icon: BotIcon },
];

export default function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const [authed,     setAuthed]     = useState(false);
  const [isDark,     setIsDark]     = useState(false);
  const [userRole,   setUserRole]   = useState<string | null>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    // SECURITY FIX: clear user-scoped chat threads so next user on this
    // device cannot see the previous user's conversation history.
    try {
      const token = getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const userId = payload.id || payload.sub || "unknown";
        localStorage.removeItem(`ecobot_threads_${userId}`);
      }
    } catch { /* best-effort */ }
    clearToken();
    localStorage.removeItem("iwis-user");
    localStorage.removeItem("iwis-impact");
    setUserOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const hasToken = !!getToken();
    setAuthed(hasToken);
    setUserRole(hasToken ? getRoleFromToken() : null);
  }, [pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  
  useEffect(() => {
    // Initial theme check
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "Light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "Dark");
      setIsDark(true);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)] h-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">IW</span>
            </span>
            IWIS
          </Link>

          {/* Primary nav — desktop */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map(({ name, path, Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--surface-raised)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  <Icon size={13} />
                  {name}
                </Link>
              );
            })}
            {/* Role-aware transaction links */}
            {authed && userRole === "citizen" && (
              <Link
                href="/sell"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/sell")
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                    : "text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]"
                }`}
              >
                <ShoppingIcon size={13} />
                Sell Waste
              </Link>
            )}
            {authed && userRole === "recycler" && (
              <Link
                href="/recycler/feed"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/recycler")
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                    : "text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]"
                }`}
              >
                <ArrowRightIcon size={13} />
                Pickup Feed
              </Link>
            )}
            {authed && (
              <Link
                href="/earnings"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/earnings")
                    ? "bg-[var(--surface-raised)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                <BarChartIcon size={13} />
                Earnings
              </Link>
            )}
          </div>

          {/* Right: user + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </button>

            {/* User menu — desktop */}
            <div className="hidden md:block relative" ref={userRef}>
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
                  <UserIcon size={12} />
                </span>
              </button>

              {userOpen && (
                <div className="animate-slideDown absolute right-0 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-md py-1 text-sm">
                  {authed ? (
                    <>
                      <Link
                        href="/settings"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                      >
                        <SettingsIcon size={13} />
                        Settings
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                      >
                        <UserIcon size={13} />
                        Profile
                      </Link>
                      <div className="my-1 border-t border-[var(--border)]" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-[var(--destructive)] hover:bg-[var(--surface-raised)] transition-colors"
                      >
                        <LogOutIcon size={13} />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <XIcon size={15} /> : <MenuIcon size={15} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 top-12 bg-[var(--surface)] border-r border-[var(--border)] animate-fadeIn overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 pb-2">
              Navigation
            </p>
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map(({ name, path, Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--surface-raised)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon size={14} />
                  {name}
                </Link>
              );
            })}

            {/* Role-aware mobile links */}
            {authed && userRole === "citizen" && (
              <Link href="/sell" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/sell") ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]" : "text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]"}`}>
                <ShoppingIcon size={14} />
                Sell Waste
              </Link>
            )}
            {authed && userRole === "recycler" && (
              <Link href="/recycler/feed" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/recycler") ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]" : "text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]"}`}>
                <ArrowRightIcon size={14} />
                Pickup Feed
              </Link>
            )}
            {authed && (
              <Link href="/earnings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/earnings") ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"}`}>
                <BarChartIcon size={14} />
                Earnings
              </Link>
            )}

            <div className="pt-4 mt-4 border-t border-[var(--border)] space-y-1">
              <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 pb-2">
                Account
              </p>
              {authed ? (
                <>
                  <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    <SettingsIcon size={14} /> Settings
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    <UserIcon size={14} /> Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[var(--destructive)] hover:bg-[var(--surface-raised)] transition-colors">
                    <LogOutIcon size={14} /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    Sign in
                  </Link>
                  <Link href="/signup" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
