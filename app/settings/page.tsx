"use client";

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Cpu,
  Terminal,
  Sun,
  Moon,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState<SettingsState | null>(null);
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
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-xs text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 mb-2">
          <SettingsIcon className="h-3 w-3" />
          <span>Application Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Settings & Provider Status
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Manage AI models, online compiler configuration, local database storage, and default interview parameters.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-xs ${
            message.type === "success"
              ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 1. AI Provider Configuration */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">AI Provider (Groq API)</h2>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              settings?.ai.configured
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
            }`}
          >
            {settings?.ai.configured ? "Live Groq AI Configured" : "Local Dev Engine (Active)"}
          </span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          InterviewForge uses a provider-independent AI interface. When{" "}
          <code className="text-gray-300 font-mono">GROQ_API_KEY</code> is configured, interviews use live LLM reasoning (model: <strong className="text-white">{settings?.ai.model}</strong>). Without an API key, the deterministic offline engine evaluates candidate answers using calibrated rubrics.
        </p>

        <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Configured Model:</span>
            <span className="font-mono text-gray-200">{settings?.ai.model}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">API Key Status:</span>
            <span className="font-mono text-gray-200">
              {settings?.ai.configured ? `Active (${settings.ai.maskedKey})` : "Not Set (Offline Dev Mode)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestAi}
            disabled={testingAi}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testingAi ? "animate-spin" : ""}`} />
            <span>{testingAi ? "Testing..." : "Test AI Connection"}</span>
          </button>
        </div>

        {aiTestResult && (
          <div
            className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
              aiTestResult.success
                ? "bg-emerald-950/30 border border-emerald-500/30 text-emerald-300"
                : "bg-amber-950/30 border border-amber-500/30 text-amber-300"
            }`}
          >
            {aiTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />}
            <span>{aiTestResult.message}</span>
          </div>
        )}
      </div>

      {/* 2. Compiler Provider Configuration */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Online Compiler (OnlineCompiler.io / Judge0)</h2>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              settings?.compiler.configured
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {settings?.compiler.configured ? "Compiler Connected" : "Compiler Key Missing"}
          </span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Executes Java, Python, and C++ code against real test cases via the Judge0-compatible endpoint.
        </p>

        <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Execution Endpoint:</span>
            <span className="font-mono text-gray-200">{settings?.compiler.url}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">API Key Status:</span>
            <span className="font-mono text-gray-200">
              {settings?.compiler.configured ? `Active (${settings.compiler.maskedKey})` : "Missing (Execution Disabled)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestCompiler}
            disabled={testingCompiler}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testingCompiler ? "animate-spin" : ""}`} />
            <span>{testingCompiler ? "Testing..." : "Test Compiler API"}</span>
          </button>
        </div>

        {compilerTestResult && (
          <div
            className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
              compilerTestResult.success
                ? "bg-emerald-950/30 border border-emerald-500/30 text-emerald-300"
                : "bg-red-950/30 border border-red-500/30 text-red-300"
            }`}
          >
            {compilerTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />}
            <span>{compilerTestResult.message}</span>
          </div>
        )}
      </div>

      {/* 3. General Preferences Form */}
      <form onSubmit={handleSavePreferences} className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Default Preferences</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Default Language</label>
            <select
              value={defaultLanguage}
              onChange={e => setDefaultLanguage(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="java">Java (OpenJDK)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Default Duration (mins)</label>
            <input
              type="number"
              min={15}
              max={180}
              value={defaultDuration}
              onChange={e => setDefaultDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:outline-none"
            >
            </input>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Default Difficulty</label>
            <select
              value={defaultDifficulty}
              onChange={e => setDefaultDifficulty(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:outline-none"
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* 4. Local Data Management */}
      <div className="rounded-xl border border-red-500/20 bg-gray-900/60 p-5 space-y-4">
        <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span>Local Storage & History Management</span>
        </h2>
        <p className="text-xs text-gray-400">
          All interview transcripts, answers, and evaluations are persisted locally in SQLite (<code className="text-gray-300">interviewforge.db</code>). You can clear stored records at any time.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
          >
            Clear All Saved Interviews
          </button>
        </div>
      </div>
    </div>
  );
}
