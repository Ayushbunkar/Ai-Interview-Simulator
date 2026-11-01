"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  Upload,
  Trash2,
  CheckCircle,
  Zap,
  Award,
  Target,
  AlertTriangle,
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  FolderGit2,
} from "lucide-react";
import { CompanyProfile, InterviewMode, InterviewModeVariant, ExtractedProject } from "@/lib/types";

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
  const [interviewModeVariant, setInterviewModeVariant] = useState<InterviewModeVariant>("full_mock");
  const [primaryLanguage, setPrimaryLanguage] = useState<"java" | "python" | "cpp">("java");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeProfileId, setResumeProfileId] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<{ skills: string[]; projects: ExtractedProject[]; technologies: string[] } | null>(null);
  const [extractedProfile, setExtractedProfile] = useState<any | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState<any | null>(null);
  const [showFullDetails, setShowFullDetails] = useState<boolean>(true);
  const [savedResume, setSavedResume] = useState<{ id: string; candidateName?: string; extractedSkills: string[]; rawResumeText: string } | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const atsCardRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccessMessage, setResumeSuccessMessage] = useState<string | null>(null);

  // Check for existing saved resume on mount
  useEffect(() => {
    fetch("/api/resume/recent")
      .then(res => res.json())
      .then(data => {
        if (data?.profile) {
          setSavedResume(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  const handleUseSavedResume = () => {
    if (savedResume) {
      setResumeProfileId(savedResume.id);
      setResumeText(savedResume.rawResumeText);
      handleAnalyzeResumeText(savedResume.rawResumeText);
    }
  };
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Java Fundamentals & OOP",
    "SQL & DBMS",
    "Data Structures & Complexity",
    "REST APIs & Web",
  ]);

  const modeVariants: { id: InterviewModeVariant; label: string; desc: string }[] = [
    { id: "full_mock", label: "Full Mock Interview", desc: "Standard 4-round hiring simulation (Fundamentals, Advanced, Coding, HR)." },
    { id: "technical_fundamentals", label: "Technical Fundamentals", desc: "Focuses exclusively on Round 1: Core OOP, Java, syntax & data structures." },
    { id: "advanced_technical", label: "Advanced CS & Projects", desc: "Round 2 deep dive: system design, databases, networks, and verified projects." },
    { id: "coding_interview", label: "Coding Room Drill", desc: "Immediate LeetCode-style problem solving with Monaco editor & compiler." },
    { id: "behavioral_hr", label: "Behavioral & HR Round", desc: "STAR framework behavioral evaluation, situational questions & culture fit." },
    { id: "pressure_interview", label: "Pressure Interview", desc: "Fast-paced express evaluation with stricter timing (25m) and fewer hints." },
    { id: "voice_practice", label: "Voice Practice Drill", desc: "Spoken verbal practice with microphone turn-taking and articulation checks." },
    { id: "communication_practice", label: "Communication Coaching", desc: "Immediate grammar, filler word, and interview phrasing feedback." },
    { id: "revision_interview", label: "Spaced Revision Interview", desc: "Practices questions and topics from your personal spaced-repetition queue." },
  ];

  const companies: { id: CompanyProfile; label: string; desc: string }[] = [
    { id: "TCS", label: "TCS", desc: "Digital & Ninja placement style. Focus on OOP, Java, SQL, and fundamentals." },
    { id: "Capgemini", label: "Capgemini", desc: "Service delivery focus. Pseudo-code, core CS concepts, agile & communication." },
    { id: "Service-Based General", label: "Service Companies", desc: "Wipro, Infosys, Cognizant, Accenture placement syllabus." },
    { id: "Product-Based Engineering", label: "Product Companies", desc: "Rigorous DSA, system design trade-offs, internal mechanics & scale." },
    { id: "Startup Fast-Paced", label: "High-Growth Startup", desc: "Ownership, rapid execution, pragmatic architecture trade-offs, and speed." },
    { id: "General Software Engineering", label: "General SWE Mock", desc: "Balanced computer science fundamentals, clean code, and algorithms." },
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

  const processUploadedFile = async (file: File) => {
    setParsingResume(true);
    setResumeError(null);
    setResumeSuccessMessage(null);
    setError(null);

    try {
      // If plain text file, populate resumeText immediately
      if (file.name.endsWith(".txt")) {
        try {
          const text = await file.text();
          if (text) setResumeText(text);
        } catch {
          // ignore
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetRole", targetRole);
      formData.append("experienceLevel", difficulty);
      formData.append("rawJobDescription", jobDescription);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.rawResumeText) {
        setResumeText(data.rawResumeText);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume document");
      }

      setResumeProfileId(data.profileId);
      setExtractedInfo({
        skills: data.detectedStack || [],
        projects: data.profile?.projects || [],
        technologies: data.detectedStack || [],
      });
      setExtractedProfile(data.profile);
      setAtsAnalysis(data.atsAnalysis);
      setResumeSuccessMessage(`Extracted from "${file.name}" — ATS Score: ${data.atsAnalysis?.overallScore ?? "Ready"}/100`);

      setTimeout(() => {
        atsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    } catch (err: any) {
      setResumeError(err.message || "Failed to upload and parse resume.");
    } finally {
      setParsingResume(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await processUploadedFile(file);
  };

  const handleAnalyzeResumeText = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || resumeText).trim();
    if (!text || parsingResume) return;

    setParsingResume(true);
    setResumeError(null);
    setResumeSuccessMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawResumeText: text,
          rawJobDescription: jobDescription.trim(),
          targetRole,
          experienceLevel: difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze resume text");

      setResumeProfileId(data.profileId);
      setExtractedInfo({
        skills: data.detectedStack || [],
        projects: data.profile?.projects || [],
        technologies: data.detectedStack || [],
      });
      setExtractedProfile(data.profile);
      setAtsAnalysis(data.atsAnalysis);
      if (data.rawResumeText) {
        setResumeText(data.rawResumeText);
      }
      setResumeSuccessMessage(`Analyzed text — ATS Score: ${data.atsAnalysis?.overallScore ?? "Ready"}/100`);

      setTimeout(() => {
        atsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    } catch (err: any) {
      setResumeError(err.message || "Failed to analyze resume text.");
    } finally {
      setParsingResume(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (parsingResume) return;
    if (resumeText.trim()) {
      await handleAnalyzeResumeText(resumeText);
    } else if (selectedFile) {
      await processUploadedFile(selectedFile);
    }
  };

  const handleClearResume = async () => {
    if (resumeProfileId) {
      try {
        await fetch(`/api/resume/profile/${resumeProfileId}`, { method: "DELETE" });
      } catch {
        // continue
      }
    }
    setResumeProfileId(null);
    setExtractedInfo(null);
    setExtractedProfile(null);
    setAtsAnalysis(null);
    setResumeText("");
    setSelectedFile(null);
    setResumeError(null);
    setResumeSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          title: `${companyProfile} ${targetRole} (${interviewModeVariant})`,
          targetRole,
          companyProfile,
          difficulty,
          mode,
          interviewModeVariant,
          resumeProfileId: resumeProfileId || undefined,
          primaryLanguage,
          durationMinutes: Number(durationMinutes),
          topicsEmphasized: selectedTopics,
          resumeText: resumeText.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Fallback for non-JSON
      }

      if (!res.ok) {
        const errorMsg =
          (typeof data.error === "string" && data.error) ||
          (Array.isArray(data.error) && data.error.map((e: any) => e.message || JSON.stringify(e)).join("; ")) ||
          data.message ||
          (data.error && JSON.stringify(data.error)) ||
          `Failed to create interview session (Server error ${res.status})`;
        throw new Error(errorMsg);
      }

      if (!data.session?.sessionId) {
        throw new Error("Interview was created but server did not return a session ID.");
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span>Interactive Interview Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Configure Your Hiring Simulation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Tailor the interview parameters, target company hiring bar, and difficulty level.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3.5 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-8">
          {/* 1. Target Company Profile */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Building2 className="h-4 w-4 text-blue-500" />
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
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                      <span>{c.label}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Role & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                <span>Target Role</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Java Backend Developer"
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                AI customizes questions to match competencies for this title.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                <span>Candidate Experience Level</span>
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="fresher">Fresher / College Graduate (Placement Drive)</option>
                <option value="entry_level">Entry Level (0-1 Year Experience)</option>
                <option value="intermediate">Junior-Mid Level (1-3 Years Experience)</option>
                <option value="experienced">Experienced (3+ Years)</option>
              </select>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Calibrates algorithmic expectations and system depth.
              </p>
            </div>
          </div>

          {/* 3. Interview Mode (Strict vs Practice) */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Simulation Feedback Mode</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setMode("practice")}
                className={`text-left rounded-lg border p-3.5 transition-all ${
                  mode === "practice"
                    ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  <span>Practice & Coaching</span>
                  {mode === "practice" && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  Live scores, formative communication tips, and progressive hints after each answer.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("realistic")}
                className={`text-left rounded-lg border p-3.5 transition-all ${
                  mode === "realistic"
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  <span>Realistic Corporate</span>
                  {mode === "realistic" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  Professional corporate interview. No interim scores; full evidence-based debrief in final report.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("strict")}
                className={`text-left rounded-lg border p-3.5 transition-all ${
                  mode === "strict"
                    ? "border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  <span>Strict Hiring Bar</span>
                  {mode === "strict" && <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  Concise interviewer behavior, rigorous rubric benchmarks, and challenging edge-case probes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("pressure")}
                className={`text-left rounded-lg border p-3.5 transition-all ${
                  mode === "pressure"
                    ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/40 ring-1 ring-red-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  <span>Pressure Simulation</span>
                  {mode === "pressure" && <CheckCircle2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  Tight time limits and rapid pacing without humiliation. Tests clarity under pressure.
                </p>
              </button>
            </div>
          </div>

          {/* 3B. Interview Mode Variant (Phase 2 Specialized Modes) */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Specialized Interview Variant</span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">Select the specific format to rehearse</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {modeVariants.map(mv => {
                const isSelected = interviewModeVariant === mv.id;
                return (
                  <button
                    key={mv.id}
                    type="button"
                    onClick={() => {
                      setInterviewModeVariant(mv.id);
                      if (mv.id === "pressure_interview") setDurationMinutes(25);
                    }}
                    className={`text-left rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      <span>{mv.label}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">{mv.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Language & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Primary Coding Language</span>
              </label>
              <select
                value={primaryLanguage}
                onChange={e => setPrimaryLanguage(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="java">Java (OpenJDK)</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
              </select>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Configures starter templates in the Coding Round.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                <span>Interview Duration</span>
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value={30}>30 Minutes (Express Assessment)</option>
                <option value={45}>45 Minutes (Standard Campus Round)</option>
                <option value={60}>60 Minutes (Comprehensive 4 Rounds)</option>
                <option value={90}>90 Minutes (Deep Technical Evaluation)</option>
              </select>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Pacing timer in room with pause/resume support.
              </p>
            </div>
          </div>

          {/* 5. Emphasized Subjects */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3 shadow-sm">
            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
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
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Resume & Job Description Intelligence */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-500" />
                <span>Resume & Job Description Intelligence (Optional)</span>
              </label>
              {extractedInfo && (
                <button
                  type="button"
                  onClick={handleClearResume}
                  className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 hover:underline transition"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear & Delete Document</span>
                </button>
              )}
            </div>

            {savedResume && !resumeProfileId && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span>Saved Resume Available: {savedResume.candidateName || "Candidate"}</span>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    Detected Stack: {savedResume.extractedSkills.slice(0, 5).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseSavedResume}
                  className="rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                >
                  Use Saved Resume
                </button>
              </div>
            )}

            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-zinc-200">The Resume Determines the Interview:</strong> Your skills, frameworks, and projects are automatically extracted. You do not need to manually select technologies that exist in your resume.
            </div>

            {resumeError && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Resume Extraction Notice</p>
                  <p className="text-[11px] leading-relaxed">{resumeError}</p>
                  <p className="text-[10px] text-zinc-500">
                    Tip: If your PDF is an image scan, you can paste your resume bullet points or project summaries in the text box below.
                  </p>
                </div>
              </div>
            )}

            {resumeSuccessMessage && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">{resumeSuccessMessage}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PDF, Images (JPG, PNG, WEBP), DOCX, or TXT file upload */}
              <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 p-4 text-center flex flex-col justify-between">
                <div>
                  <Upload className="mx-auto h-5 w-5 text-zinc-400 mb-1.5" />
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mb-1">Upload Resume (PDF, JPG, PNG, DOCX, TXT)</p>
                  <p className="text-[10px] text-zinc-500 mb-3">Auto-extracts text (OCR enabled for scans & images), fills editor & analyzes ATS.</p>
                  
                  {selectedFile && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 text-[11px] text-purple-700 dark:text-purple-300">
                      <FileText className="h-3.5 w-3.5 text-purple-500" />
                      <span className="max-w-[180px] truncate font-medium">{selectedFile.name}</span>
                      <span className="text-[10px] text-zinc-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,image/*"
                    onChange={handleFileUpload}
                    disabled={parsingResume}
                    className="text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-800 dark:file:text-zinc-200 hover:file:bg-zinc-300 dark:hover:file:bg-zinc-700 cursor-pointer block mx-auto"
                  />
                </div>

                {parsingResume && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-purple-600 dark:text-purple-300 animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                    <span>Extracting text & calculating ATS score...</span>
                  </div>
                )}
              </div>

              {/* Extracted or Pasted resume text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Resume Content (Extracted from file or pasted)
                  </span>
                  {resumeText && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Text Loaded
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Extracted text from your uploaded resume will appear here automatically. You can also paste your resume summary or project bullets..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTriggerAnalysis}
                    disabled={parsingResume || (!resumeText.trim() && !selectedFile)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {parsingResume ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Analyzing & Scoring...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Analyze & Calculate ATS Score</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-zinc-500">
                    {parsingResume
                      ? "Processing..."
                      : resumeText.trim()
                      ? `${resumeText.trim().split(/\s+/).length} words extracted`
                      : selectedFile
                      ? "File attached"
                      : "No text pasted"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pasted Job Description */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">
                Target Job Description (Optional — for Keyword Match & ATS Alignment)
              </label>
              <textarea
                rows={2}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the target job description to match skills, emphasize required competencies, and tune the ATS score..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {/* ATS Score & Compatibility Card */}
            {atsAnalysis && (
              <div ref={atsCardRef} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ATS Compatibility Score</h4>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            atsAnalysis.overallScore >= 80
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : atsAnalysis.overallScore >= 65
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : atsAnalysis.overallScore >= 50
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                          }`}
                        >
                          {atsAnalysis.rating}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Evaluated against {targetRole || "Software Engineer"} hiring benchmarks & parsing standards.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 self-start sm:self-auto">
                    <span
                      className={`text-3xl font-black ${
                        atsAnalysis.overallScore >= 80
                          ? "text-emerald-400"
                          : atsAnalysis.overallScore >= 65
                          ? "text-blue-400"
                          : atsAnalysis.overallScore >= 50
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {atsAnalysis.overallScore}%
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">/ 100</span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      atsAnalysis.overallScore >= 80
                        ? "bg-emerald-500"
                        : atsAnalysis.overallScore >= 65
                        ? "bg-blue-500"
                        : atsAnalysis.overallScore >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${atsAnalysis.overallScore}%` }}
                  />
                </div>

                {/* 4-Category Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1">
                    <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Skills & Keywords</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {atsAnalysis.breakdown.skillsKeywordScore} <span className="text-[10px] text-zinc-500 font-normal">/ 30</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1">
                    <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Action & Impact</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {atsAnalysis.breakdown.actionImpactScore} <span className="text-[10px] text-zinc-500 font-normal">/ 25</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1">
                    <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Project Depth</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {atsAnalysis.breakdown.experienceDepthScore} <span className="text-[10px] text-zinc-500 font-normal">/ 25</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1">
                    <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Structure & Format</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {atsAnalysis.breakdown.formattingStructureScore} <span className="text-[10px] text-zinc-500 font-normal">/ 20</span>
                    </div>
                  </div>
                </div>

                {/* Key Strengths & Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {atsAnalysis.strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>ATS Pass Factors</span>
                      </div>
                      <ul className="space-y-1">
                        {atsAnalysis.strengths.map((str: string, i: number) => (
                          <li key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 leading-snug">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {atsAnalysis.improvements.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Recommendations to Boost ATS Score</span>
                      </div>
                      <ul className="space-y-1">
                        {atsAnalysis.improvements.map((imp: string, i: number) => (
                          <li key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 leading-snug">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Missing Keywords Warning */}
                {atsAnalysis.criticalMissingKeywords?.length > 0 && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-2.5 space-y-1.5">
                    <div className="text-[10px] font-semibold text-red-700 dark:text-red-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span>Missing Industry Standard Keywords for {targetRole}:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {atsAnalysis.criticalMissingKeywords.map((kw: string) => (
                        <span key={kw} className="rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-1.5 py-0.5 text-[9px] font-mono text-red-800 dark:text-red-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fetched Candidate Details Card */}
            {extractedProfile && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Fetched Resume Details (Verified Entities)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullDetails(prev => !prev)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium transition"
                  >
                    <span>{showFullDetails ? "Collapse Details" : "Expand Full Details"}</span>
                    {showFullDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {showFullDetails && (
                  <div className="space-y-3 text-xs">
                    {/* Candidate Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Identified Candidate:</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{extractedProfile.name || "Candidate"}</span>
                      </div>
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Detected Target Focus:</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{targetRole}</span>
                      </div>
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Total Word Count:</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{atsAnalysis?.wordCount || 0} words</span>
                      </div>
                    </div>

                    {/* Categorized Skills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Extracted Technical Stack:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        {extractedProfile.skills.programmingLanguages?.length > 0 && (
                          <div className="rounded bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 block mb-1 font-semibold">Languages:</span>
                            <div className="flex flex-wrap gap-1">
                              {extractedProfile.skills.programmingLanguages.map((s: string) => (
                                <span key={s} className="rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 text-blue-700 dark:text-blue-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {extractedProfile.skills.backend?.length > 0 && (
                          <div className="rounded bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 block mb-1 font-semibold">Backend & Frameworks:</span>
                            <div className="flex flex-wrap gap-1">
                              {extractedProfile.skills.backend.map((s: string) => (
                                <span key={s} className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {extractedProfile.skills.databases?.length > 0 && (
                          <div className="rounded bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 block mb-1 font-semibold">Databases & Storage:</span>
                            <div className="flex flex-wrap gap-1">
                              {extractedProfile.skills.databases.map((s: string) => (
                                <span key={s} className="rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.5 text-cyan-700 dark:text-cyan-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {extractedProfile.skills.frontend?.length > 0 && (
                          <div className="rounded bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 block mb-1 font-semibold">Frontend:</span>
                            <div className="flex flex-wrap gap-1">
                              {extractedProfile.skills.frontend.map((s: string) => (
                                <span key={s} className="rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 text-purple-700 dark:text-purple-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {extractedProfile.skills.devops?.length > 0 && (
                          <div className="rounded bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 block mb-1 font-semibold">DevOps & Cloud:</span>
                            <div className="flex flex-wrap gap-1">
                              {extractedProfile.skills.devops.map((s: string) => (
                                <span key={s} className="rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Extracted Projects */}
                    {extractedProfile.projects?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Verified Projects (Round 2 Architecture Focus):</span>
                        <div className="space-y-2">
                          {extractedProfile.projects.map((p: any, idx: number) => (
                            <div key={idx} className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1 text-[11px]">
                              <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                                <span className="flex items-center gap-1.5">
                                  <FolderGit2 className="h-3.5 w-3.5 text-blue-500" />
                                  <span>{p.name}</span>
                                </span>
                                {p.technologies?.length > 0 && (
                                  <span className="text-[10px] text-zinc-500 font-mono font-normal">
                                    {p.technologies.join(" • ")}
                                  </span>
                                )}
                              </div>
                              {p.description && <p className="text-zinc-600 dark:text-zinc-400 text-[10px] leading-relaxed">{p.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Claims flagged for validation */}
                    {extractedProfile.resumeClaims?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-semibold text-zinc-500">Claims Flagged for Technical Validation in Round 2:</span>
                        <ul className="space-y-0.5">
                          {extractedProfile.resumeClaims.slice(0, 3).map((c: any, i: number) => (
                            <li key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                              <span className="text-blue-500">•</span>
                              <span className="font-mono">"{c.claim}"</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition shadow-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 transition"
            >
              <Play className="h-4 w-4 fill-current" />
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

