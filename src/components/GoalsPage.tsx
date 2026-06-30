import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { Goal, Habit } from "../types";
import {
  Sparkles,
  Award,
  Flame,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
  Sliders,
  Compass
} from "lucide-react";

export const GoalsPage: React.FC = () => {
  const {
    habits,
    completeHabit,
    deleteHabit,
    addHabit,
    setHabits,
    goals,
    setGoals,
    deleteGoal,
    addActivity,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"goals" | "habits" | "achievements">("goals");

  // New Habit creation states
  const [habitTitle, setHabitTitle] = useState("");
  const [habitFreq, setHabitFreq] = useState<Habit["frequency"]>("Daily");
  const [habitTime, setHabitTime] = useState("Morning");

  // New Goal creation states
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalCategory, setGoalCategory] = useState("Career");
  const [goalPriority, setGoalPriority] = useState<Goal["priority"]>("medium");
  const [goalDate, setGoalDate] = useState("2026-09-01");

  // AI assistant simulation for breaking down goals
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic Badges
  const badges = [
    { id: "b1", title: "Consistency Guru", desc: "Unlock a 7-day streak on any habit loop.", unlocked: habits.some(h => h.streak >= 7), icon: "🔥" },
    { id: "b2", title: "SDE Trailblazer", desc: "Break down your first career goal with milestones.", unlocked: goals.some(g => g.category === "Career"), icon: "🚀" },
    { id: "b3", title: "Productivity Master", desc: "Complete 100% of milestones on any major goal.", unlocked: goals.some(g => g.progress >= 100), icon: "🎯" },
    { id: "b4", title: "Zen Monarch", desc: "Verify mindfulness or focus routines 5 times.", unlocked: habits.some(h => h.totalCompletions >= 5), icon: "🧘" }
  ];

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;

    addHabit(habitTitle.trim(), habitFreq, habitTime);
    addActivity(`Established habit: "${habitTitle.trim()}"`, "info");
    setHabitTitle("");
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const newG: Goal = {
      id: "goal-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title: goalTitle.trim(),
      description: goalDesc.trim(),
      category: goalCategory,
      targetDate: goalDate,
      priority: goalPriority,
      progress: 0,
      completed: false,
      milestones: [
        { id: "m1-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), title: "Draft comprehensive initial blueprint", completed: false },
        { id: "m2-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), title: "Validate primary iterations", completed: false }
      ]
    };

    setGoals([...goals, newG]);
    addActivity(`Defined target milestone goal: "${goalTitle.trim()}"`, "success");

    setGoalTitle("");
    setGoalDesc("");
  };

  const updateGoalProgress = (goalId: string, val: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextProgress = Math.min(100, Math.max(0, val));
        return {
          ...g,
          progress: nextProgress,
          completed: nextProgress === 100
        };
      }
      return g;
    }));
  };

  // Generate automated goal breakdown via simulated AI
  const handleAIBreakdown = (goalId: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: [
              ...(g.milestones || []),
              { id: "ai-m1-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), title: "[AI] Execute complete testing matrix", completed: false },
              { id: "ai-m2-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), title: "[AI] Deploy polished build environment", completed: false }
            ]
          };
        }
        return g;
      }));
      addActivity("AI parsed and appended milestones into your goal plan!", "success");
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-12 animate-fade-in select-none">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-brand-border">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
            Objectives Hub
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-heading leading-tight">
            Goals & Habits
          </h1>
          <p className="text-base text-brand-secondary font-medium">
            Define long-term aspirations, break them into milestones, and build consistent daily loops.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex bg-brand-bg p-1 rounded-xl shrink-0 self-start lg:self-center border border-brand-border">
          <button
            onClick={() => setActiveTab("goals")}
            className={`px-5 h-10 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "goals"
                ? "bg-brand-card text-brand-heading shadow-sm"
                : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            Goals
          </button>
          
          <button
            onClick={() => setActiveTab("habits")}
            className={`px-5 h-10 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "habits"
                ? "bg-brand-card text-brand-heading shadow-sm"
                : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            Daily Habits
          </button>

          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-5 h-10 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "achievements"
                ? "bg-brand-card text-brand-heading shadow-sm"
                : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            Achievements
          </button>
        </div>
      </div>

      {/* ================= SECONDARY SPLIT CONTENT AREA ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Creator Panel */}
        <div className="lg:col-span-1 space-y-6">
          {activeTab === "goals" ? (
            <form onSubmit={handleCreateGoal} className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-brand-heading">Define New Goal</h3>
              
              <div>
                <label className="block text-sm font-semibold text-brand-heading mb-2">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React 19 features"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-heading mb-2">Description</label>
                <textarea
                  placeholder="Describe key outcomes..."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  rows={2}
                  className="w-full p-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-brand-heading mb-2">Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-base cursor-pointer"
                  >
                    <option value="Career">Career</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-heading mb-2">Priority</label>
                  <select
                    value={goalPriority}
                    onChange={(e: any) => setGoalPriority(e.target.value)}
                    className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-base cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-heading mb-2">Target Date</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-base cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-base rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Create Goal
              </button>
            </form>
          ) : activeTab === "habits" ? (
            <form onSubmit={handleCreateHabit} className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-brand-heading">New Habit Loop</h3>

              <div>
                <label className="block text-sm font-semibold text-brand-heading mb-2">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 15 pages technical lit"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-brand-heading mb-2">Frequency</label>
                  <select
                    value={habitFreq}
                    onChange={(e: any) => setHabitFreq(e.target.value)}
                    className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-base cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-heading mb-2">Time of Day</label>
                  <select
                    value={habitTime}
                    onChange={(e) => setHabitTime(e.target.value)}
                    className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-base cursor-pointer"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-base rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Create Habit
              </button>
            </form>
          ) : (
            <div className="p-6 bg-indigo-50/50 dark:bg-slate-800/20 rounded-2xl border border-brand-border space-y-3">
              <h3 className="text-sm font-bold uppercase text-brand-primary tracking-wider">XP Progress</h3>
              <p className="text-sm text-brand-secondary leading-relaxed font-medium">
                Consistency unlocks specialized career and study badges to grade your focus stamina.
              </p>
            </div>
          )}
        </div>

        {/* Right Active List Column */}
        <div className="lg:col-span-3">
          {/* ================= TABS: GOALS PANEL ================= */}
          {activeTab === "goals" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.length === 0 ? (
                <div className="col-span-2 p-16 text-center text-brand-secondary bg-brand-card rounded-2xl border border-brand-border shadow-sm">
                  <Target className="w-12 h-12 mx-auto mb-4 text-brand-placeholder" />
                  <p className="font-bold text-brand-heading text-lg">No goals found</p>
                  <p className="text-sm text-brand-secondary mt-1">Add a career or study target milestone on the left.</p>
                </div>
              ) : (
                goals.map((g) => (
                  <div key={g.id} className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[250px]">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold tracking-wide text-brand-primary bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                            {g.category}
                          </span>
                          <h3 className="text-lg font-bold text-brand-heading mt-3.5 leading-snug">{g.title}</h3>
                          <p className="text-sm text-brand-secondary font-medium mt-1.5">{g.description}</p>
                        </div>

                        <button
                          onClick={() => deleteGoal(g.id)}
                          className="p-2 text-brand-placeholder hover:text-brand-danger rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Milestones list */}
                      <div className="mt-5 space-y-2">
                        <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Milestones</span>
                        {g.milestones?.slice(0, 3).map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-sm text-brand-body font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                            <span className="truncate">{m.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="mt-6 pt-5 border-t border-brand-border">
                      <div className="flex items-center justify-between text-sm mb-2 font-medium">
                        <span className="text-brand-secondary font-semibold">Progress</span>
                        <span className="font-bold text-brand-heading">{g.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={g.progress}
                        onChange={(e) => updateGoalProgress(g.id, parseInt(e.target.value))}
                        className="w-full accent-[#4F46E5] dark:accent-[#6366F1] bg-slate-100 dark:bg-slate-800 h-2 rounded-lg cursor-pointer outline-none"
                      />

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-brand-secondary flex items-center gap-1 font-semibold">
                          <Calendar className="w-4 h-4 text-brand-placeholder" />
                          Target: {g.targetDate}
                        </span>
                        <button
                          onClick={() => handleAIBreakdown(g.id)}
                          disabled={isGenerating}
                          className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          AI Breakdown
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ================= TABS: DAILY HABITS PANEL ================= */}
          {activeTab === "habits" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habits.length === 0 ? (
                <div className="col-span-2 p-16 text-center text-brand-secondary bg-brand-card rounded-2xl border border-brand-border shadow-sm">
                  <Flame className="w-12 h-12 mx-auto mb-4 text-brand-placeholder" />
                  <p className="font-bold text-brand-heading text-lg">No habit loops found</p>
                  <p className="text-sm text-brand-secondary mt-1">Create a loop schedule on the left column.</p>
                </div>
              ) : (
                habits.map((h) => {
                  const todayStr = new Date().toISOString().substring(0, 10);
                  const doneToday = h.lastCompleted?.substring(0, 10) === todayStr;
                  return (
                    <div key={h.id} className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-brand-heading truncate leading-snug">{h.title}</h3>
                          <span className="text-xs font-bold px-2.5 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-secondary flex items-center">
                            {h.timeOfDay}
                          </span>
                        </div>
                        <p className="text-sm text-brand-secondary font-semibold mt-1.5">
                          Frequency: {h.frequency} • Completed: {h.totalCompletions} times
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold font-mono text-sm">
                          <Flame className="w-5 h-5 fill-amber-500/10" />
                          <span>{h.streak}d</span>
                        </div>

                        <button
                          onClick={() => completeHabit(h.id)}
                          className={`px-4 h-10 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer flex items-center ${
                            doneToday
                              ? "bg-emerald-50 text-brand-success border border-brand-border"
                              : "bg-slate-100 hover:bg-slate-200 text-brand-heading dark:bg-slate-800 dark:hover:bg-slate-750"
                          }`}
                        >
                          {doneToday ? "Verified" : "Complete"}
                        </button>

                        <button
                          onClick={() => deleteHabit(h.id)}
                          className="p-2 text-brand-placeholder hover:text-brand-danger rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= TABS: ACHIEVEMENTS PANEL ================= */}
          {activeTab === "achievements" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {badges.map((b) => (
                <div key={b.id} className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
                  b.unlocked 
                    ? "bg-brand-card border-brand-border shadow-sm" 
                    : "bg-slate-50/50 dark:bg-slate-900/40 border-brand-border opacity-50"
                }`}>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-3xl shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-heading text-base flex items-center gap-2">
                      {b.title}
                      {b.unlocked && <span className="text-xs bg-emerald-100 text-brand-success px-2 py-0.5 rounded-lg uppercase font-bold tracking-wider shrink-0">Unlocked</span>}
                    </h3>
                    <p className="text-sm text-brand-secondary font-medium mt-1.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
