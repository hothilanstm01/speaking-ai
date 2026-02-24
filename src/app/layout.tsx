import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Speaking AI — English Practice Partner",
  description:
    "Practice your English speaking skills with an AI partner that provides natural replies, grammar corrections, and fluency scores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
          <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur flex items-center justify-between px-4 sm:px-8 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/40">
                SA
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Speaking AI
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Chat & Logistics Docs
                </span>
              </div>
            </div>
            <nav className="flex items-center gap-3 text-xs sm:text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full border border-transparent text-[var(--text-secondary)] hover:text-indigo-300 hover:border-indigo-500/60 transition-colors"
              >
                Chat
              </Link>
              <Link
                href="/document"
                className="px-3 py-1.5 rounded-full border border-transparent text-[var(--text-secondary)] hover:text-emerald-300 hover:border-emerald-500/60 transition-colors"
              >
                Docs → Sheet
              </Link>
            </nav>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
