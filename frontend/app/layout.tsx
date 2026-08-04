import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/layout/Navbar";
import { TaskProvider } from "@/components/providers/TaskProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TaskOverlay } from "@/components/layout/TaskOverlay";
import EcoBotFAB from "@/components/layout/EcoBotFAB";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import ServiceWorkerRegistration from "@/components/providers/ServiceWorkerRegistration";
import PWAInstallPrompt from "@/components/providers/PWAInstallPrompt";

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "IWIS — Intelligent Waste Information System",
  description: "AI-powered waste management platform for India's Net Zero 2070 mission. Computer vision, carbon accounting, and circular economy in one platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IWIS",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-180-apple.png",
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased bg-[var(--bg)] text-[var(--text-primary)] min-h-screen">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TaskProvider>
              <ServiceWorkerRegistration />
              <Navbar />
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <OnboardingGate>{children}</OnboardingGate>
              </main>
              <EcoBotFAB />
              <TaskOverlay />
              <PWAInstallPrompt />
            </TaskProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
