"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Mic,
  CalendarCheck2,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Start Interview", href: "/interview/new", icon: PlayCircle },
    { label: "Interview Ready", href: "/interview-ready", icon: CalendarCheck2 },
    { label: "Speech Drill (800)", href: "/speech-drill", icon: Mic },
    { label: "Coding Arena", href: "/coding", icon: Code2 },
    { label: "Question Bank", href: "/questions", icon: BookOpen },
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

        {/* Theme Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-all shadow-sm text-xs font-semibold cursor-pointer active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline font-medium">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline font-medium">Dark Mode</span>
              </>
            )}
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
