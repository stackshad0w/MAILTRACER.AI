import type { Metadata } from "next";
import "./globals.css";
import { SocNavbar } from "@/components/soc-navbar";

export const metadata: Metadata = {
  title: "MailTracer.ai — AI Email Verification & Cyber Forensics Platform",
  description:
    "Verify. Trace. Investigate. Protect. Enterprise AI-powered email threat detection, website verification, SPF/DKIM/DMARC forensics, Threat DNA, and Attack Graphs.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased bg-[#090d16] text-slate-100">
      <body className="min-h-screen flex flex-col soc-grid-bg">
        <SocNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>MailTracer.ai © 2026 • AI-Powered Cyber Forensics & Verification</span>
            <span className="font-mono text-[10px] text-slate-400">SOC STATUS: ARMED & ACTIVE</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
