"use client";

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Cpu,
  Terminal,
  Sun,
  Moon,
  Laptop,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  ShieldCheck,
  User,
  Mic,
  Volume2,
  Lock,
} from "lucide-react";
import { useTheme, ThemeMode } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { APIUsageSummary } from "@/lib/types";

interface SettingsState {
  ai: {
    provider: string;
    model: string;
    configured: boolean;
    maskedKey: string | null;
  };
  compiler: {
    provider: string;
    url: string;
    configured: boolean;
    maskedKey: string | null;
  };
  preferences: {
    theme: string;
    defaultLanguage: string;
    defaultDuration: number;
    defaultDifficulty: string;
  };
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [usageSummary, setUsageSummary] = useState<APIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Test Connection states
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingCompiler, setTestingCompiler] = useState(false);
  const [compilerTestResult, setCompilerTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Preference forms
  const [defaultLanguage, setDefaultLanguage] = useState("java");
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [defaultDifficulty, setDefaultDifficulty] = useState("fresher");

  const fetchSettings = async () => {
    try {
      const [res, uRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/usage"),
      ]);
      const data = await res.json();
      const uData = await uRes.json();
      setSettings(data);
      setUsageSummary(uData?.summary || null);
      if (data.preferences) {
        setDefaultLanguage(data.preferences.defaultLanguage);
        setDefaultDuration(data.preferences.defaultDuration);
        setDefaultDifficulty(data.preferences.defaultDifficulty);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch("/api/settings/test-ai", { method: "POST" });
      const data = await res.json();
      setAiTestResult(data);
    } catch (err: any) {
      setAiTestResult({ success: false, message: err.message });
    } finally {
      setTestingAi(false);
    }
  };

  const handleTestCompiler = async () => {
    setTestingCompiler(true);
    setCompilerTestResult(null);
    try {
      const res = await fetch("/api/settings/test-compiler", { method: "POST" });
      const data = await res.json();
      setCompilerTestResult(data);
    } catch (err: any) {
      setCompilerTestResult({ success: false, message: err.message });
    } finally {
      setTestingCompiler(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultLanguage,
          defaultDuration,
          defaultDifficulty,
        }),
      });
      if (res.ok) {
        setMessage({ text: "Preferences saved successfully.", type: "success" });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {
      setMessage({ text: "Failed to save preferences.", type: "error" });
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to permanently clear all local interview sessions and reports?")) {
      return;
    }
    try {
      const res = await fetch("/api/settings?action=clear-all", { method: "DELETE" });
      if (res.ok) {
        setMessage({ text: "All local interview history cleared.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to clear history.", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          <SettingsIcon className="h-3 w-3" />
          <span>System & Account Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Manage your account profile, theme appearance, AI reasoning providers, compiler execution, and speech engines.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Account Profile Card */}
      {user && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">User Account</h2>
            </div>
            <span className="rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 text-xs font-semibold capitalize">
              {user.role} Account
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Full Name</span>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name || "Candidate"}</div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Email Address</span>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.email}</div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Verification & Provider</span>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" /> Unverified
                  </span>
                )}
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-600 dark:text-zinc-400 uppercase font-mono text-[10px]">
                  {user.authProvider || "Local / OAuth"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Theme & Display Selector */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Display Theme</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Choose your preferred color theme. Light mode provides high contrast readability, dark mode is tuned for low-light focus.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-xs font-semibold transition ${
              theme === "light"
                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-xs font-semibold transition ${
              theme === "dark"
                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-xs font-semibold transition ${
              theme === "system"
                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 3. AI Provider Configuration */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Reasoning Provider (Groq Cloud)</h2>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
              settings?.ai.configured
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {settings?.ai.configured ? "Live Groq AI Configured" : "Offline Rule Engine Active"}
          </span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          InterviewForge uses high-speed LLM reasoning for dynamic question generation and strict rubric scoring.
          When an API key is present, requests route to Groq (<strong className="text-zinc-800 dark:text-zinc-200">{settings?.ai.model}</strong>).
        </p>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Configured Model:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{settings?.ai.model}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">API Key Status:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              {settings?.ai.configured ? `Active (${settings.ai.maskedKey})` : "Missing (Fallback rule engine)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestAi}
            disabled={testingAi}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testingAi ? "animate-spin" : ""}`} />
            <span>{testingAi ? "Testing..." : "Test AI Connection"}</span>
          </button>
        </div>

        {aiTestResult && (
          <div
            className={`rounded-lg p-3 text-xs flex items-start gap-2 border ${
              aiTestResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}
          >
            {aiTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />}
            <span>{aiTestResult.message}</span>
          </div>
        )}
      </div>

      {/* 4. Speech Transcription Fallback Cascade Status */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Voice Transcription Engine Cascade
            </h2>
          </div>
          <span className="rounded bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 text-[10px] font-semibold">
            Auto-Failover Active
          </span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The speech engine implements an automated fallback cascade. If tokens deplete or rate limits occur on the primary engine, it switches seamlessly to the next configured provider:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-2.5">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">1. AssemblyAI</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Primary STT Engine</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-2.5">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">2. Speechmatics</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Fallback 1 (Configured)</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-2.5">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">3. Sarvam AI</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Fallback 2 (Configured)</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-2.5">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">4. Gladia</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Fallback 3 (Configured)</div>
          </div>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300">5. Groq Whisper</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Final Safeguard</div>
          </div>
        </div>
      </div>

      {/* 5. Online Compiler Configuration */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Online Compiler (OnlineCompiler.io / Judge0)</h2>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
              settings?.compiler.configured
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
            }`}
          >
            {settings?.compiler.configured ? "Compiler Connected" : "Compiler Key Missing"}
          </span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Executes Java, Python, and C++ code against real test cases via the Judge0-compatible endpoint.
        </p>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Execution Endpoint:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{settings?.compiler.url}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">API Key Status:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              {settings?.compiler.configured ? `Active (${settings.compiler.maskedKey})` : "Missing (Execution Disabled)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestCompiler}
            disabled={testingCompiler}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testingCompiler ? "animate-spin" : ""}`} />
            <span>{testingCompiler ? "Testing..." : "Test Compiler API"}</span>
          </button>
        </div>

        {compilerTestResult && (
          <div
            className={`rounded-lg p-3 text-xs flex items-start gap-2 border ${
              compilerTestResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
            }`}
          >
            {compilerTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />}
            <span>{compilerTestResult.message}</span>
          </div>
        )}
      </div>

      {/* 6. General Simulation Preferences */}
      <form onSubmit={handleSavePreferences} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Default Simulation Preferences</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure initial defaults for newly launched interview simulations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Default Language</label>
            <select
              value={defaultLanguage}
              onChange={e => setDefaultLanguage(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="java">Java (OpenJDK)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Default Duration (mins)</label>
            <input
              type="number"
              min={15}
              max={180}
              value={defaultDuration}
              onChange={e => setDefaultDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Default Difficulty</label>
            <select
              value={defaultDifficulty}
              onChange={e => setDefaultDifficulty(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="fresher">Fresher (Campus)</option>
              <option value="entry_level">Entry Level</option>
              <option value="intermediate">Mid Level</option>
              <option value="experienced">Experienced</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* 7. API Usage & Diagnostics */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>API Usage & Telemetry</span>
          </h2>
          <span className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
            Local Application Auditing
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Tracks application-side request counts, latency, and error states.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 text-center">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{usageSummary?.totalAiRequests ?? 0}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Groq AI Requests</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 text-center">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{usageSummary?.totalCompilerRequests ?? 0}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Compiler Executions</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 text-center">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">~{usageSummary?.estimatedTokens ?? 0}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Estimated Tokens</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 text-center">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{usageSummary?.totalErrors ?? 0}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Exceptions</div>
          </div>
        </div>

        {usageSummary?.recentLogs && usageSummary.recentLogs.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <h4 className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Recent API Audit Log</h4>
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 font-mono text-[10px]">
              {usageSummary.recentLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span className="text-zinc-800 dark:text-zinc-300">[{log.service.toUpperCase()}] {log.endpoint}</span>
                  <div className="flex items-center gap-2">
                    <span className={log.status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                      {log.status}
                    </span>
                    <span className="text-zinc-400">{log.responseTimeMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 8. Danger Zone / Data Management */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span>Local Storage & Session Management</span>
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Clear local session history and evaluations. Note that your user profile in Supabase remains safe.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
          >
            Clear Local Interview History
          </button>
        </div>
      </div>
    </div>
  );
}