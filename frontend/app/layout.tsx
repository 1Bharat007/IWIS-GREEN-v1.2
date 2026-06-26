import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { TaskProvider } from "@/components/providers/TaskProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TaskOverlay } from "@/components/layout/TaskOverlay";
import EcoBotFAB from "@/components/layout/EcoBotFAB";

export const metadata: Metadata = {
  title: "IWIS — Intelligent Waste Information System",
  description: "AI-powered waste management platform for India's Net Zero 2070 mission. Computer vision, carbon accounting, and circular economy in one platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--text-primary)] min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TaskProvider>
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
              {children}
            </main>
            <EcoBotFAB />
            <TaskOverlay />
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
