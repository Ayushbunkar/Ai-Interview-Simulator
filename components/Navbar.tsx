"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  Laptop,
  Mic,
  CalendarCheck2,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Start Interview", href: "/interview/new", icon: PlayCircle },
    { label: "Interview Ready", href: "/interview-ready", icon: CalendarCheck2 },
    { label: "Speech Drill", href: "/speech-drill", icon: Mic },
    { label: "Coding Arena", href: "/coding", icon: Code2 },
    { label: "Question Bank", href: "/questions", icon: BookOpen },
    { label: "Reports", href: "/reports", icon: FileText },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Admin Console", href: "/admin", icon: ShieldCheck });
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
            <Flame className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground text-sm sm:text-base">
            <span>InterviewForge</span>
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
              AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-2xs border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${item.href === "/admin" ? "text-purple-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Theme + Auth */}
        <div className="flex items-center gap-2">
          {/* Theme Selector Button (Cycles Dark -> Light -> System) */}
          <button
            onClick={cycleTheme}
            title={`Current theme: ${theme} (Click to cycle)`}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition cursor-pointer shadow-2xs"
            aria-label="Toggle theme"
          >
            {theme === "system" ? (
              <Laptop className="h-4 w-4 text-primary" />
            ) : resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>

          {/* User Account / Auth Section */}
          {!authLoading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted/50 transition text-xs font-semibold text-foreground cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {user.name ? user.name[0] : user.email[0]}
                    </div>
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {user.name || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border bg-card shadow-lg p-1.5 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <div className="font-semibold text-foreground truncate">{user.name || "User"}</div>
                        <div className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</div>
                        {user.role === "admin" && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                            Administrator
                          </span>
                        )}
                      </div>

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted/60 transition"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted/60 transition"
                      >
                        <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Settings</span>
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition mt-1 cursor-pointer font-medium"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition shadow-2xs"
                  >
                    Register
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border px-4 py-3 bg-card space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </header>
  );
}
