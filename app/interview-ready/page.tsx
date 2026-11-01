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
        if (d >= 1 && d <= ROADMAP_DAYS.length) setSelectedDayNumber(d);
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
  const overallPercentage = Math.round((totalDaysCompleted / ROADMAP_DAYS.length) * 100);

  const totalQuestionsCount = ROADMAP_DAYS.reduce((acc, d) => acc + d.questions.length, 0);
  const totalQuestionsCompleted = Object.values(completedQuestions).filter(Boolean).length;

  const currentDayChecklistDoneCount = DAILY_CHECKLIST_ITEMS.filter((_, idx) =>
    dailyChecklists[`day${currentDay.dayNumber}_chk${idx}`]
  ).length;

  // Filtered Days List
  const filteredDays = selectedPhaseFilter === "all"
    ? ROADMAP_DAYS
    : ROADMAP_DAYS.filter(d => d.phaseId === selectedPhaseFilter);

  // Action: Launch Speech Drill with exact question
  const handleLaunchSpeechDrill = (q: RoadmapQuestion) => {
    try {
      const drillItem = {
        id: q.id,
        catId: currentDay.phaseId,
        category: currentDay.phaseName,
        num: q.qNum,
        question: q.question,
        modelAnswer: q.answer,
        keyPoints: [
          q.question,
          ...(q.answer.split(/\.\s+/).filter(s => s.trim().length > 15).slice(0, 3)),
        ],
        difficulty: "Core",
        sampleSpokenStart: `To answer directly: ${q.question.replace(/\?$/, "")}...`,
        source: `Day ${currentDay.dayNumber} • ${currentDay.phaseName}`,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("interviewforge_active_drill_question", JSON.stringify(drillItem));
      }
    } catch (e) {
      console.warn("Storage error caching speech drill question:", e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-28 transition-colors">
      {/* Top Sticky Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md sticky top-14 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Interview Ready: Master Roadmap ({ROADMAP_DAYS.length} Days)
                </h1>
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Target: 45 LPA SDE & AI/ML
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Day-by-day complete curriculum • Theory, Question Logic, Visual Diagrams & Daily Task Ticking
              </p>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Day {selectedDayNumber}/{ROADMAP_DAYS.length}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                ({totalDaysCompleted} done)
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <Target className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {totalQuestionsCompleted}/{totalQuestionsCount} Qs
              </span>
            </div>

            <Link
              href="/speech-drill"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voice Speech Drill</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-8">
        
        {/* Progress & Milestone Master Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" /> {ROADMAP_DAYS.length}-Day SDE & AI/ML Master Curriculum
                </span>
                <span className="text-xs text-zinc-500">
                  November 1 – December 4
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {currentPhase.name} • Phase {currentPhase.phaseId} of {ROADMAP_PHASES.length}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {currentPhase.summary} Follow the daily 6-point checklist, master the under-the-hood logic of every question, and inspect visual architecture diagrams.
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-700 dark:text-zinc-300">Curriculum Completion</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">{overallPercentage}% Completed</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(3, overallPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right KPI Badges */}
            <div className="md:col-span-4 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-1">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {totalDaysCompleted}/{ROADMAP_DAYS.length}
                </span>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Days Mastered
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-1">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {totalQuestionsCompleted}
                </span>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Questions Ticked
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                  <Award className="h-4 w-4 text-amber-500" />
                  Priority Tier
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  {currentPhase.priorityLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Filter by {ROADMAP_PHASES.length} Learning Phases</span>
            <span>{filteredDays.length} Days in view</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedPhaseFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 border transition-all ${
                selectedPhaseFilter === "all"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
              }`}
            >
              All {ROADMAP_DAYS.length} Days
            </button>
            {ROADMAP_PHASES.map(phase => (
              <button
                key={phase.phaseId}
                onClick={() => setSelectedPhaseFilter(phase.phaseId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 border transition-all flex items-center gap-1.5 ${
                  selectedPhaseFilter === phase.phaseId
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                }`}
              >
                <span>Phase {phase.phaseId}: {phase.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  phase.priority === "S" ? "bg-rose-500/20 text-rose-600 dark:text-rose-300" : "bg-blue-500/20 text-blue-600 dark:text-blue-300"
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
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md scale-105 z-10 font-bold"
                    : isDone
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="text-[10px] font-mono opacity-70">Nov {d.dayNumber}</span>
                <span className="text-xs font-bold">D{d.dayNumber}</span>
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
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
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Day {currentDay.dayNumber} • {currentDay.date}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {currentDay.phaseName}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {currentDay.title}
                  </h3>
                </div>

                {/* Mark Day Complete Button */}
                <button
                  onClick={() => toggleDayCompletion(currentDay.dayNumber)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 border ${
                    completedDays[currentDay.dayNumber]
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {completedDays[currentDay.dayNumber] ? "Day Marked Complete ✓" : "Mark Day as Done"}
                  </span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                {currentDay.description}
              </p>

              {/* Study Topics Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Today's Core Study Topics ({currentDay.studyTopics.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentDay.studyTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs border border-zinc-200 dark:border-zinc-700 font-medium"
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
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Interview Questions, Answers & Core Logic ({currentDay.questions.length} Questions)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAllQuestionsForDay(currentDay, true)}
                    className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => handleToggleAllQuestionsForDay(currentDay, false)}
                    className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
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
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                          : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {/* Question Header Bar */}
                      <div className="p-3.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleQuestionCompletion(q.id)}
                            className="mt-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0"
                            title={isDone ? "Mark Incomplete" : "Mark Mastered"}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                            )}
                          </button>

                          <div
                            onClick={() => toggleQuestionAccordion(q.id)}
                            className="cursor-pointer flex-1"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                              {q.qNum}. {q.question}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Voice practice quick shortcut with exact question */}
                          <Link
                            href={`/speech-drill?qId=${encodeURIComponent(q.id)}`}
                            onClick={() => handleLaunchSpeechDrill(q)}
                            title={`Practice speaking this answer: "${q.question}"`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent group"
                          >
                            <Mic className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          </Link>

                          {/* Accordion toggle */}
                          <button
                            onClick={() => toggleQuestionAccordion(q.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Answer & Logic Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-3 font-sans text-xs sm:text-sm">
                          {/* Model Answer */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                              <Check className="h-3 w-3" /> Interview-Ready Answer
                            </span>
                            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                              {q.answer}
                            </p>
                          </div>

                          {/* Under-the-Hood Logic */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Underlying Logic & Interviewer Rationale
                            </span>
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
                              {q.logic}
                            </p>
                          </div>

                          {/* Code Snippet if present */}
                          {q.codeSnippet && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <Code2 className="h-3 w-3" /> Code / Query Implementation
                              </span>
                              <pre className="p-3 rounded-lg bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
                                {q.codeSnippet}
                              </pre>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
                            <span>Mastered this concept? Tick the checkbox on the left.</span>
                            <Link
                              href={`/speech-drill?qId=${encodeURIComponent(q.id)}`}
                              onClick={() => handleLaunchSpeechDrill(q)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Mic className="h-3.5 w-3.5" />
                              <span>Practice Speaking this Answer</span>
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
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Code2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Today's Practical Task: {currentDay.practicalTask.title}
                </h4>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{currentDay.practicalTask.instructions}</p>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>Engineering Hint:</strong> {currentDay.practicalTask.solutionHint}
                </div>
              </div>

              {currentDay.practicalTask.codeExample && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                    Reference Implementation / Starter
                  </span>
                  <pre className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                    {currentDay.practicalTask.codeExample}
                  </pre>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Daily 6-Point Checklist & Roadmap Navigation (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* DAILY 6-POINT COMPLETION CHECKLIST */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Daily Completion Checklist
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Day {currentDay.dayNumber} verification
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 text-zinc-400">
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-zinc-400" />
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
                className="w-full text-center py-1.5 text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Reset Day {currentDay.dayNumber} Checklist
              </button>
            </div>

            {/* SUBJECT PRIORITY MATRIX CARD */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-sm space-y-3 transition-colors">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Subject Priority Ranking Matrix
                </h4>
                <p className="text-[11px] text-zinc-500">Focus your time by importance tier.</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex justify-between items-center">
                  <span className="font-bold text-rose-700 dark:text-rose-300">Tier S (Must be Strong)</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">OOP, SQL, OS, CN, AI/ML & Projects</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex justify-between items-center">
                  <span className="font-bold text-amber-700 dark:text-amber-300">Tier A (Practical Level)</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">LLD, REST APIs, Security, HLD</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex justify-between items-center">
                  <span className="font-bold text-blue-700 dark:text-blue-300">Tier B (Working Basics)</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Git, Linux, Software Testing</span>
                </div>
              </div>
            </div>

            {/* DECEMBER 1 COMPLETION TARGETS CHECKLIST */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    December Completion Targets
                  </h4>
                  <p className="text-[11px] text-zinc-500">{DECEMBER_GOALS.length} Master Milestones</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {Object.values(completedDecGoals).filter(Boolean).length}/{DECEMBER_GOALS.length}
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
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button className="text-zinc-400">
                          {isChecked ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-zinc-400" />
                          )}
                        </button>
                        <span>{goal.title}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {goal.phase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Day Navigation Button */}
            {selectedDayNumber < ROADMAP_DAYS.length && (
              <button
                onClick={() => handleSelectDay(selectedDayNumber + 1)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
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
