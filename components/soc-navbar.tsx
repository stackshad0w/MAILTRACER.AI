"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  Zap, 
  LayoutDashboard, 
  FolderArchive,
  Activity
} from "lucide-react";

export function SocNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "1-Click Scanner", icon: Zap },
    { href: "/dashboard", label: "SOC Dashboard", icon: LayoutDashboard },
    { href: "/cases", label: "Case Archive", icon: FolderArchive },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <NextLink href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <ShieldAlert className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wider text-slate-100">
                MailTracer<span className="text-cyan-400">.ai</span>
              </span>
              <span className="rounded border border-cyan-500/30 bg-cyan-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
                SOC v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider">AI EMAIL THREAT DETECTION • GEOLOCATION • CYBER FORENSICS</p>
          </div>
        </NextLink>

        {/* Streamlined Nav links */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NextLink>
            );
          })}
        </nav>

        {/* Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] text-emerald-400 shadow-sm font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE ENGINE: ARMED</span>
        </div>
      </div>
    </header>
  );
}
