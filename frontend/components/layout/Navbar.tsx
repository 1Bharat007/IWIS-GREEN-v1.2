"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken, getToken } from "@/lib/session";
import {
  MenuIcon, XIcon, ScanIcon, LayoutIcon, HistoryIcon,
  MapPinIcon, ShoppingIcon, TrophyIcon, BotIcon, SettingsIcon, LogOutIcon, UserIcon,
} from "@/components/ui/Icons";

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
  const userRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    clearToken();
    setUserOpen(false);
    router.push("/login");
  };

  useEffect(() => { setAuthed(!!getToken()); }, [pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

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
          </div>

          {/* Right: user + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">

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
