"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Flame,
  LayoutDashboard,
  PlayCircle,
  Code2,
  BookOpen,
  FileText,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Cpu,
  Terminal,
  Mic,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState<{
    compiler?: { configured: boolean };
    ai?: { configured: boolean; provider: string };
  } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Start Interview", href: "/interview/new", icon: PlayCircle },
    { label: "Coding Arena", href: "/coding", icon: Code2 },
    { label: "Question Bank", href: "/questions", icon: BookOpen },
    { label: "Speech Drill (700)", href: "/speech-drill", icon: Mic },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-sm sm:text-base">
              <span>InterviewForge</span>
              <span className="rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Software Engineering Hiring Simulator
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/[0.05]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Status Indicators & Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Compiler Status */}
          <div
            title={
              health?.compiler?.configured
                ? "OnlineCompiler.io: Active & Ready"
                : "Compiler: Key missing (configure in Settings)"
            }
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 shadow-sm"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                health?.compiler?.configured
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : "bg-amber-400"
              }`}
            />
            <Terminal className="h-3 w-3 text-slate-400 hidden sm:inline" />
            <span className="hidden sm:inline font-medium">
              {health?.compiler?.configured ? "Compiler Ready" : "Compiler Offline"}
            </span>
          </div>

          {/* AI Status */}
          <div
            title={health?.ai?.provider || "AI Engine Status"}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 shadow-sm"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                health?.ai?.configured
                  ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                  : "bg-cyan-400"
              }`}
            />
            <Cpu className="h-3 w-3 text-slate-400 hidden sm:inline" />
            <span className="hidden sm:inline font-medium">
              {health?.ai?.configured ? "Groq AI" : "Local AI"}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-gray-800/60 px-3 py-1.5 gap-1 scrollbar-none">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
                isActive ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
