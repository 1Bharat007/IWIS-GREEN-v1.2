"use client";

import { usePathname } from "next/navigation";
// import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
