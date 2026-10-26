"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Building2,
  Briefcase,
  GraduationCap,
  Code2,
  Clock,
  FileText,
  ShieldAlert,
  HelpCircle,
  Play,
  CheckCircle2,
} from "lucide-react";
import { CompanyProfile, InterviewMode } from "@/lib/types";

function InterviewSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRound = searchParams.get("round");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State with sensible defaults
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>("TCS");
  const [targetRole, setTargetRole] = useState("Junior Java / Backend Developer");
  const [difficulty, setDifficulty] = useState<"fresher" | "entry_level" | "intermediate" | "experienced">("fresher");
  const [mode, setMode] = useState<InterviewMode>("strict");
  const [primaryLanguage, setPrimaryLanguage] = useState<"java" | "python" | "cpp">("java");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [resumeText, setResumeText] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Java Fundamentals & OOP",
    "SQL & DBMS",
    "Data Structures & Complexity",
    "REST APIs & Web",
  ]);

  const companies: { id: CompanyProfile; label: string; desc: string }[] = [
    { id: "TCS", label: "TCS", desc: "Digital & Ninja placement style. Focus on OOP, Java, SQL, and fundamentals." },
    { id: "Capgemini", label: "Capgemini", desc: "Service delivery focus. Pseudo-code, core CS concepts, agile & communication." },
    { id: "Service-Based General", label: "Service Companies", desc: "Wipro, Infosys, Cognizant, Accenture placement syllabus." },
    { id: "Product-Based Engineering", label: "Product Companies", desc: "Rigorous DSA, system design trade-offs, internal mechanics & scale." },
    { id: "Java / Backend Specialist", label: "Java / Backend", desc: "Spring Boot, JVM memory, concurrency, transactions, and REST APIs." },
    { id: "AI / ML & GenAI", label: "AI/ML Engineer", desc: "Python, LLM concepts, RAG architectures, vectors, model evaluation." },
    { id: "Custom / General", label: "Custom Mock", desc: "Balanced full-stack software engineering assessment." },
  ];

  const availableTopics = [
    "Java Fundamentals & OOP",
    "Data Structures & Complexity",
    "SQL & DBMS",
    "Operating Systems & Memory",
    "Computer Networks & HTTP",
    "REST APIs & Web",
    "System Design & Scale",
    "STAR Behavioral Scenarios",
  ];

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${companyProfile} ${targetRole} Mock Session`,
          targetRole,
          companyProfile,
          difficulty,
          mode,
          primaryLanguage,
          durationMinutes: Number(durationMinutes),
          topicsEmphasized: selectedTopics,
          resumeText: resumeText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ? JSON.stringify(data.error) : "Failed to create interview session");
      }

      router.push(`/interview/${data.session.sessionId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while launching interview.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Interactive Interview Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Configure Your Hiring Simulation
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Tailor the interview parameters, target company hiring bar, and difficulty level.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-8">
          {/* 1. Target Company Profile */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span>Target Company / Interview Style</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {companies.map(c => {
                const isSelected = companyProfile === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setCompanyProfile(c.id);
                      if (c.id === "TCS" || c.id === "Capgemini") {
                        setTargetRole("Associate Software Engineer");
                      } else if (c.id === "Product-Based Engineering") {
                        setTargetRole("Software Development Engineer I (SDE 1)");
                      }
                    }}
                    className={`text-left rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-600/15 ring-1 ring-blue-500/40"
                        : "border-gray-800 bg-gray-950/60 hover:border-gray-700"
                    }`}
                  >
                    <div className="font-semibold text-xs text-white flex items-center justify-between">
                      <span>{c.label}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400 leading-normal">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Role & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                <span>Target Role</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Java Backend Developer"
                required
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-400">
                AI customizes questions to match competencies for this title.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                <span>Candidate Experience Level</span>
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="fresher">Fresher / College Graduate (Placement Drive)</option>
                <option value="entry_level">Entry Level (0-1 Year Experience)</option>
                <option value="intermediate">Junior-Mid Level (1-3 Years Experience)</option>
                <option value="experienced">Experienced (3+ Years)</option>
              </select>
              <p className="text-[11px] text-gray-400">
                Calibrates algorithmic expectations and system depth.
              </p>
            </div>
          </div>

          {/* 3. Interview Mode (Strict vs Practice) */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Simulation Mode</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("strict")}
                className={`text-left rounded-lg border p-4 transition-all ${
                  mode === "strict"
                    ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                    : "border-gray-800 bg-gray-950/60 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-white">
                  <span>Strict Interview (Recommended)</span>
                  {mode === "strict" && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Real hiring pressure: No immediate answers revealed, no unsolicited hints. Evaluates performance at the end with a full report.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("practice")}
                className={`text-left rounded-lg border p-4 transition-all ${
                  mode === "practice"
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                    : "border-gray-800 bg-gray-950/60 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-white">
                  <span>Practice & Coaching Mode</span>
                  {mode === "practice" && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Formative coaching: Instant score and feedback after every answer, progressive hints, and reference explanation benchmarks.
                </p>
              </button>
            </div>
          </div>

          {/* 4. Language & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Primary Coding Language</span>
              </label>
              <select
                value={primaryLanguage}
                onChange={e => setPrimaryLanguage(e.target.value as any)}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="java">Java (OpenJDK)</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
              </select>
              <p className="text-[11px] text-gray-400">
                Configures starter templates in the Coding Round.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>Interview Duration</span>
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={30}>30 Minutes (Express Assessment)</option>
                <option value={45}>45 Minutes (Standard Campus Round)</option>
                <option value={60}>60 Minutes (Comprehensive 4 Rounds)</option>
                <option value={90}>90 Minutes (Deep Technical Evaluation)</option>
              </select>
              <p className="text-[11px] text-gray-400">
                Pacing timer in room with pause/resume support.
              </p>
            </div>
          </div>

          {/* 5. Emphasized Subjects */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Emphasize Core Subjects</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map(topic => {
                const active = selectedTopics.includes(topic);
                return (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                      active
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "bg-gray-950 text-gray-400 border-gray-800 hover:text-white"
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Optional Resume / Project Description */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Resume Summary / Key Projects (Optional)</span>
            </label>
            <textarea
              rows={3}
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your key project summaries or tech stack (e.g. 'Built an e-commerce backend using Spring Boot, PostgreSQL, and Redis caching. Handled 1000 orders/min with optimistic locking.')."
              className="w-full rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400">
              When provided, Round 2 dynamically interrogates your real project architecture and technical trade-offs.
            </p>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50 transition"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{loading ? "Initializing Session..." : "Enter Live Interview Room"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InterviewSetupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading interview setup...</div>}>
      <InterviewSetupContent />
    </Suspense>
  );
}

