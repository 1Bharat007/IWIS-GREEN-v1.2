import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
