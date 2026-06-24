import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { TaskProvider } from "@/components/providers/TaskProvider";
import { TaskOverlay } from "@/components/layout/TaskOverlay";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme');if(t==='Dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else if(t==='Light'){document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--text-primary)] min-h-screen">
        <TaskProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            {children}
          </main>
          <TaskOverlay />
        </TaskProvider>
      </body>
    </html>
  );
}
