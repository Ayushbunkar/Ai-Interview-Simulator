"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Code2,
  Cpu,
  Flame,
  Award,
  Database,
  Network,
  ShieldCheck,
  Terminal,
  Boxes,
  HelpCircle,
  RotateCcw,
  Check,
  ExternalLink,
  Target,
  Trophy,
  Filter,
  Zap,
  Mic,
  Share2,
} from "lucide-react";
import {
  ROADMAP_PHASES,
  ROADMAP_DAYS,
  DAILY_CHECKLIST_ITEMS,
  DECEMBER_GOALS,
  RoadmapPhase,
  RoadmapDay,
  RoadmapQuestion,
} from "@/lib/data/interviewReadyRoadmap";

export default function InterviewReadyPage() {
  // Navigation State
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number | "all">("all");

  // User Progress Persistence State (localStorage)
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({});
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({});
  const [dailyChecklists, setDailyChecklists] = useState<Record<string, boolean>>({});
  const [completedDecGoals, setCompletedDecGoals] = useState<Record<string, boolean>>({});

  // Question Answer & Logic Accordion Toggle State
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const savedDays = localStorage.getItem("interviewforge_ready_completed_days");
      if (savedDays) setCompletedDays(JSON.parse(savedDays));

      const savedQuestions = localStorage.getItem("interviewforge_ready_completed_questions");
      if (savedQuestions) setCompletedQuestions(JSON.parse(savedQuestions));

      const savedChecklists = localStorage.getItem("interviewforge_ready_daily_checklists");
      if (savedChecklists) setDailyChecklists(JSON.parse(savedChecklists));

      const savedDecGoals = localStorage.getItem("interviewforge_ready_dec_goals");
      if (savedDecGoals) setCompletedDecGoals(JSON.parse(savedDecGoals));

      const savedDay = localStorage.getItem("interviewforge_ready_active_day");
      if (savedDay) {
        const d = parseInt(savedDay);
        if (d >= 1 && d <= 30) setSelectedDayNumber(d);
      }
    } catch {}
  }, []);

  // Save active day
  const handleSelectDay = (dayNum: number) => {
    setSelectedDayNumber(dayNum);
    try {
      localStorage.setItem("interviewforge_ready_active_day", String(dayNum));
    } catch {}
  };

  // Toggle Day Completion
  const toggleDayCompletion = (dayNum: number) => {
    setCompletedDays(prev => {
      const updated = { ...prev, [dayNum]: !prev[dayNum] };
      try {
        localStorage.setItem("interviewforge_ready_completed_days", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle Individual Question Tick
  const toggleQuestionCompletion = (qId: string) => {
    setCompletedQuestions(prev => {
      const updated = { ...prev, [qId]: !prev[qId] };
      try {
        localStorage.setItem("interviewforge_ready_completed_questions", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle Daily 6-Point Checklist Item
  const toggleChecklistItem = (dayNum: number, itemIdx: number) => {
    const key = `day${dayNum}_chk${itemIdx}`;
    setDailyChecklists(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("interviewforge_ready_daily_checklists", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle December 1 Goal
  const toggleDecGoal = (goalId: string) => {
    setCompletedDecGoals(prev => {
      const updated = { ...prev, [goalId]: !prev[goalId] };
      try {
        localStorage.setItem("interviewforge_ready_dec_goals", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle Question Explanation Accordion
  const toggleQuestionAccordion = (qId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Expand / Collapse all questions for current day
  const handleToggleAllQuestionsForDay = (day: RoadmapDay, expand: boolean) => {
    setExpandedQuestions(prev => {
      const next = { ...prev };
      day.questions.forEach(q => {
        next[q.id] = expand;
      });
      return next;
    });
  };

  // Calculations
  const currentDay = ROADMAP_DAYS.find(d => d.dayNumber === selectedDayNumber) || ROADMAP_DAYS[0];
  const currentPhase = ROADMAP_PHASES.find(p => p.phaseId === currentDay.phaseId) || ROADMAP_PHASES[0];

  const totalDaysCompleted = Object.values(completedDays).filter(Boolean).length;
  const overallPercentage = Math.round((totalDaysCompleted / 30) * 100);

  const totalQuestionsCount = ROADMAP_DAYS.reduce((acc, d) => acc + d.questions.length, 0);
  const totalQuestionsCompleted = Object.values(completedQuestions).filter(Boolean).length;

  const currentDayChecklistDoneCount = DAILY_CHECKLIST_ITEMS.filter((_, idx) =>
    dailyChecklists[`day${currentDay.dayNumber}_chk${idx}`]
  ).length;

  // Filtered Days List
  const filteredDays = selectedPhaseFilter === "all"
    ? ROADMAP_DAYS
    : ROADMAP_DAYS.filter(d => d.phaseId === selectedPhaseFilter);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 pb-28">
      {/* Top Sticky Header */}
      <div className="border-b border-white/[0.08] bg-[#0c1220]/80 backdrop-blur-xl sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Interview Ready: 30-Day Master Roadmap
                </h1>
                <span className="rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                  Target: 45 LPA SDE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Day-by-day complete curriculum • Theory, Question Logic, Visual Diagrams & Daily Task Ticking
              </p>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-white">
                Day {selectedDayNumber}/30
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({totalDaysCompleted} done)
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-white">
                {totalQuestionsCompleted}/{totalQuestionsCount} Qs
              </span>
            </div>

            <Link
              href="/speech-drill"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all active:scale-95"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voice Speech Drill</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-8">
        
        {/* Progress & Milestone Master Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0c1222] via-[#0d162b] to-[#0a1020] p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> 30-Day Fresher to 45 LPA Placement Course
                </span>
                <span className="text-xs text-slate-400">
                  November 1 – November 30
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {currentPhase.name} • Phase {currentPhase.phaseId} of 9
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {currentPhase.summary} Follow the daily 6-point checklist, master the under-the-hood logic of every question, and inspect visual architecture diagrams.
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Course Completion Roadmap</span>
                  <span className="text-amber-400 font-mono">{overallPercentage}% Completed</span>
                </div>
                <div className="h-2.5 w-full bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(3, overallPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right KPI Badges */}
            <div className="md:col-span-4 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center space-y-1">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {totalDaysCompleted}/30
                </span>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Days Mastered
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center space-y-1">
                <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                  {totalQuestionsCompleted}
                </span>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Questions Ticked
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  Priority Tier
                </span>
                <span className="font-bold text-amber-300">
                  {currentPhase.priorityLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Filter by 9 Learning Phases</span>
            <span>{filteredDays.length} Days in view</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedPhaseFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 border transition-all ${
                selectedPhaseFilter === "all"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md"
                  : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
              }`}
            >
              All 30 Days
            </button>
            {ROADMAP_PHASES.map(phase => (
              <button
                key={phase.phaseId}
                onClick={() => setSelectedPhaseFilter(phase.phaseId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 border transition-all flex items-center gap-1.5 ${
                  selectedPhaseFilter === phase.phaseId
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md"
                    : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
                }`}
              >
                <span>Phase {phase.phaseId}: {phase.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  phase.priority === "S" ? "bg-rose-500/20 text-rose-300" : "bg-blue-500/20 text-blue-300"
                }`}>
                  {phase.priority}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Day Selector Pills Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1.5">
          {filteredDays.map(d => {
            const isSelected = d.dayNumber === selectedDayNumber;
            const isDone = completedDays[d.dayNumber];
            return (
              <button
                key={d.dayNumber}
                onClick={() => handleSelectDay(d.dayNumber)}
                className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-gradient-to-b from-blue-600 to-indigo-700 text-white border-blue-400 shadow-lg scale-105 z-10"
                    : isDone
                    ? "bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40"
                    : "bg-white/[0.03] text-slate-300 border-white/[0.06] hover:bg-white/[0.07]"
                }`}
              >
                <span className="text-[10px] font-mono opacity-70">Nov {d.dayNumber}</span>
                <span className="text-xs font-bold">D{d.dayNumber}</span>
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* ACTIVE DAY DETAILED WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Study Topics, Diagram & Interview Questions (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Day Header Showcase */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Day {currentDay.dayNumber} • {currentDay.date}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {currentDay.phaseName}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {currentDay.title}
                  </h3>
                </div>

                {/* Mark Day Complete Button */}
                <button
                  onClick={() => toggleDayCompletion(currentDay.dayNumber)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border ${
                    completedDays[currentDay.dayNumber]
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {completedDays[currentDay.dayNumber] ? "Day Marked Complete ✓" : "Mark Day as Done"}
                  </span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {currentDay.description}
              </p>

              {/* Study Topics Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Today's Core Study Topics ({currentDay.studyTopics.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentDay.studyTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 text-xs border border-white/[0.06] font-medium"
                    >
                      • {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* VISUAL DIAGRAM CARD */}
            {currentDay.diagram && (
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#09101d] to-[#0a1224] p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Architecture & Conceptual Diagram: {currentDay.diagram.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                    Visual Deep-Dive
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{currentDay.diagram.caption}"
                </p>

                {/* Visual Diagram Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {currentDay.diagram.nodes.map((node, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border transition-all ${
                          node.highlight
                            ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-sm"
                            : "bg-white/[0.03] border-white/[0.06] text-slate-300"
                        }`}
                      >
                        <div className="text-xs font-bold text-white mb-1">
                          {node.label}
                        </div>
                        {node.desc && (
                          <div className="text-[11px] text-slate-400 leading-tight">
                            {node.desc}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentDay.diagram.connections && currentDay.diagram.connections.length > 0 && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-1">
                      {currentDay.diagram.connections.map((conn, ci) => (
                        <div
                          key={ci}
                          className="text-xs font-mono text-cyan-300 bg-cyan-950/20 px-3 py-1.5 rounded border border-cyan-500/20 flex items-center gap-2"
                        >
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          <span>{conn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INTERVIEW QUESTIONS ACCORDION LIST */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Interview Questions, Answers & Core Logic ({currentDay.questions.length} Questions)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAllQuestionsForDay(currentDay, true)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/[0.04]"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => handleToggleAllQuestionsForDay(currentDay, false)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/[0.04]"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {currentDay.questions.map((q) => {
                  const isDone = completedQuestions[q.id];
                  const isExpanded = expandedQuestions[q.id];

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border transition-all ${
                        isDone
                          ? "bg-[#09151c]/60 border-emerald-500/30"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      {/* Question Header Bar */}
                      <div className="p-3.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleQuestionCompletion(q.id)}
                            className="mt-0.5 text-slate-400 hover:text-white shrink-0"
                            title={isDone ? "Mark Incomplete" : "Mark Mastered"}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-500 hover:text-slate-300" />
                            )}
                          </button>

                          <div
                            onClick={() => toggleQuestionAccordion(q.id)}
                            className="cursor-pointer flex-1"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
                              {q.qNum}. {q.question}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Voice practice quick shortcut */}
                          <Link
                            href="/speech-drill"
                            title="Practice speaking this answer"
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <Mic className="h-3.5 w-3.5" />
                          </Link>

                          {/* Accordion toggle */}
                          <button
                            onClick={() => toggleQuestionAccordion(q.id)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Answer & Logic Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3 font-sans text-xs sm:text-sm">
                          {/* Model Answer */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                              <Check className="h-3 w-3" /> Interview-Ready Answer
                            </span>
                            <p className="text-slate-200 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/[0.05]">
                              {q.answer}
                            </p>
                          </div>

                          {/* Under-the-Hood Logic */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Underlying Logic & Interviewer Rationale
                            </span>
                            <p className="text-slate-300 leading-relaxed bg-amber-950/20 p-3 rounded-lg border border-amber-500/20">
                              {q.logic}
                            </p>
                          </div>

                          {/* Code Snippet if present */}
                          {q.codeSnippet && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <Code2 className="h-3 w-3" /> Code / Query Implementation
                              </span>
                              <pre className="p-3 rounded-lg bg-black/60 border border-white/[0.08] text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                                {q.codeSnippet}
                              </pre>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                            <span>Mastered this concept? Tick the checkbox on the left.</span>
                            <Link
                              href="/speech-drill"
                              className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>Test verbal articulation in Speech Drill</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRACTICAL TASK CARD */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Today's Practical Task: {currentDay.practicalTask.title}
                </h4>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                <p className="font-medium text-white">{currentDay.practicalTask.instructions}</p>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
                  <strong>Engineering Hint:</strong> {currentDay.practicalTask.solutionHint}
                </div>
              </div>

              {currentDay.practicalTask.codeExample && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Reference Implementation / Starter
                  </span>
                  <pre className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                    {currentDay.practicalTask.codeExample}
                  </pre>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Daily 6-Point Checklist & Roadmap Navigation (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* DAILY 6-POINT COMPLETION CHECKLIST */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 shadow-xl space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Daily Completion Checklist
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Day {currentDay.dayNumber} verification
                  </p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentDayChecklistDoneCount}/6 Done
                </span>
              </div>

              {/* 6 Checklist Items */}
              <div className="space-y-2.5">
                {DAILY_CHECKLIST_ITEMS.map((item, idx) => {
                  const isChecked = Boolean(dailyChecklists[`day${currentDay.dayNumber}_chk${idx}`]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChecklistItem(currentDay.dayNumber, idx)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 text-slate-400">
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                      <span className="text-xs leading-snug">{item}</span>
                    </div>
                  );
                })}
              </div>

              {/* Reset Day Checklist button */}
              <button
                onClick={() => {
                  setDailyChecklists(prev => {
                    const next = { ...prev };
                    DAILY_CHECKLIST_ITEMS.forEach((_, idx) => {
                      delete next[`day${currentDay.dayNumber}_chk${idx}`];
                    });
                    try {
                      localStorage.setItem("interviewforge_ready_daily_checklists", JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                }}
                className="w-full text-center py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset Day {currentDay.dayNumber} Checklist
              </button>
            </div>

            {/* SUBJECT PRIORITY MATRIX CARD */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 shadow-xl space-y-3">
              <div className="border-b border-white/[0.08] pb-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  Subject Priority Ranking Matrix
                </h4>
                <p className="text-[11px] text-slate-400">Do not give every subject equal importance.</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 flex justify-between items-center">
                  <span className="font-bold text-rose-300">Tier S (Must be Strong)</span>
                  <span className="text-[11px] text-slate-300">OOP, SQL, OS, CN, Projects</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 flex justify-between items-center">
                  <span className="font-bold text-amber-300">Tier A (Practical Level)</span>
                  <span className="text-[11px] text-slate-300">LLD, REST APIs, Security, HLD</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-500/20 flex justify-between items-center">
                  <span className="font-bold text-blue-300">Tier B (Working Basics)</span>
                  <span className="text-[11px] text-slate-300">Git, Linux, Software Testing</span>
                </div>
              </div>
            </div>

            {/* DECEMBER 1 COMPLETION TARGETS CHECKLIST */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    December 1 Completion Targets
                  </h4>
                  <p className="text-[11px] text-slate-400">16 Master Milestones</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {Object.values(completedDecGoals).filter(Boolean).length}/16
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {DECEMBER_GOALS.map((goal) => {
                  const isChecked = Boolean(completedDecGoals[goal.id]);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => toggleDecGoal(goal.id)}
                      className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isChecked
                          ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                          : "bg-white/[0.02] border-white/[0.05] text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button className="text-slate-400">
                          {isChecked ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </button>
                        <span>{goal.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {goal.phase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Day Navigation Button */}
            {selectedDayNumber < 30 && (
              <button
                onClick={() => handleSelectDay(selectedDayNumber + 1)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
              >
                <span>Advance to Day {selectedDayNumber + 1}: {ROADMAP_DAYS[selectedDayNumber]?.title}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
