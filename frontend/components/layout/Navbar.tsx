"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import {
  MenuIcon, XIcon, ScanIcon, LayoutIcon, HistoryIcon, ShoppingIcon, ShoppingBagIcon, DownloadIcon,
  BotIcon, SettingsIcon, UserIcon, SunIcon, MoonIcon, BarChartIcon, InfoIcon, BellIcon
} from "@/components/ui/Icons";
import { apiFetch } from "@/lib/api";

const CITIZEN_NAV = [
  { name: "Home",        path: "/dashboard",    Icon: LayoutIcon },
  { name: "Scan",        path: "/scan",         Icon: ScanIcon },
  { name: "Sell Waste",  path: "/sell",         Icon: ShoppingIcon },
  { name: "Buy Waste",   path: "/marketplace",  Icon: ShoppingBagIcon },
  { name: "My Listings", path: "/sell/history", Icon: HistoryIcon },
  { name: "App",         path: "/download",     Icon: DownloadIcon },
];

const RECYCLER_NAV = [
  { name: "Pickup Feed", path: "/recycler/feed", Icon: LayoutIcon },
  { name: "Buy Waste",   path: "/marketplace",  Icon: ShoppingBagIcon },
  { name: "Earnings",    path: "/earnings",      Icon: BarChartIcon },
  { name: "App",         path: "/download",     Icon: DownloadIcon },
];

const PUBLIC_NAV = [
  { name: "Home",        path: "/",             Icon: LayoutIcon },
  { name: "Scan",        path: "/scan",         Icon: ScanIcon },
  { name: "Sell Waste",  path: "/sell",         Icon: ShoppingIcon },
  { name: "Buy Waste",   path: "/marketplace",  Icon: ShoppingBagIcon },
  { name: "App",         path: "/download",     Icon: DownloadIcon },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      apiFetch("/auth/me")
        .then(res => {
          const data = res?.data || res;
          if (data?.role) {
            setUserRole(data.role);
          }
        })
        .catch(() => {});

      apiFetch("/notifications")
        .then(res => {
          const list = res?.data || res;
          setNotifications(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  }, [isLoaded, isSignedIn, pathname]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => n.isRead === 0).length;

  const currentNav = isSignedIn 
    ? (userRole === "recycler" ? RECYCLER_NAV : CITIZEN_NAV)
    : PUBLIC_NAV;

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
            {currentNav.map(({ name, path, Icon }) => {
              const active = isActive(path) && path !== "/";
              const isExactRoot = pathname === "/" && path === "/";
              const match = active || isExactRoot;
              
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    match
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

          {/* Right: theme + notifications + user */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-11 h-11 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {mounted ? (resolvedTheme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />) : <SunIcon size={15} />}
            </button>

            {/* Notification Bell */}
            {isSignedIn && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative flex items-center justify-center w-11 h-11 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                  <BellIcon size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--destructive)] border border-[var(--surface)]" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden animate-slideDown z-50 flex flex-col max-h-[400px]">
                    <div className="p-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-raised)]">
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-[var(--accent)] hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => { if (n.isRead === 0) markAsRead(n.id); }}
                            className={`p-3 border-b border-[var(--border)] last:border-b-0 cursor-pointer transition-colors ${n.isRead === 0 ? 'bg-[var(--accent-subtle)] hover:bg-[var(--surface-raised)]' : 'bg-transparent hover:bg-[var(--surface-raised)]'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm ${n.isRead === 0 ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                                {n.title}
                              </h4>
                              {n.isRead === 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-1" />}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{n.message}</p>
                            <span className="text-[10px] text-[var(--text-tertiary)] block mt-1">
                              {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Avatar / Button — desktop */}
            {isLoaded && (
              <div className="hidden md:flex items-center gap-2">
                {isSignedIn ? (
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Profile"
                        labelIcon={<UserIcon size={13} />}
                        href="/profile"
                      />
                      <UserButton.Link
                        label="Settings"
                        labelIcon={<SettingsIcon size={13} />}
                        href="/settings"
                      />
                      <UserButton.Link
                        label="EcoBot"
                        labelIcon={<BotIcon size={13} />}
                        href="/chat"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3 py-1.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
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
            {currentNav.map(({ name, path, Icon }) => {
              const active = isActive(path) && path !== "/";
              const isExactRoot = pathname === "/" && path === "/";
              const match = active || isExactRoot;
              
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    match
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
              {isSignedIn ? (
                <>
                  <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    <UserIcon size={14} /> Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    <SettingsIcon size={14} /> Settings
                  </Link>
                  <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] transition-colors">
                    <BotIcon size={14} /> EcoBot
                  </Link>
                  <div className="py-2 px-3">
                    <UserButton />
                  </div>
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
