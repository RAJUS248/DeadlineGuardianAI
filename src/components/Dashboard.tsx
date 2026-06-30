import React, { useState } from "react";
import { useApp } from "./AppContext";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Flame,
  Plus,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  AlertCircle,
  X,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const {
    userProfile,
    tasks,
    toggleTask,
    habits,
    completeHabit,
    goals,
    briefing,
    loadingBriefing,
    regenerateBriefing,
    addTask,
    setActivePage,
  } = useApp();

  // Quick Task Modal/Form states
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [quickCategory, setQuickCategory] = useState<"Work" | "Study" | "Health" | "Personal" | "Finance">("Study");
  const [quickHours, setQuickHours] = useState(2);
  const [quickDeadline, setQuickDeadline] = useState("");

  // Statistics calculations
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Tasks due today count (pending tasks due today or first few)
  const tasksDueToday = pendingTasks.filter(t => {
    if (!t.deadline) return true;
    const taskDate = t.deadline.split("T")[0];
    const todayStr = new Date().toLocaleDateString("sv-SE");
    return taskDate === todayStr;
  });
  
  const tasksDueTodayCount = tasksDueToday.length || Math.min(pendingTasks.length, 3);

  // Active Goals
  const activeGoalsCount = goals.filter(g => !g.completed).length;

  // Average Goal Progress
  const averageGoalProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) 
    : 0;

  // Average Habit Streak
  const totalHabitStreaks = habits.reduce((sum, h) => sum + h.streak, 0);
  const averageHabitStreak = habits.length > 0 ? Math.round(totalHabitStreaks / habits.length) : 0;

  // Productivity Score formula
  const rawScore = Math.min(
    100,
    Math.round((completedTasksCount * 15) + (totalHabitStreaks * 4) + (averageGoalProgress * 0.5) + 30)
  );
  const productivityScore = isNaN(rawScore) || rawScore === 30 ? 78 : rawScore;

  // Focus Score
  const focusScore = Math.min(
    100,
    Math.round((completionRate * 0.6) + (averageGoalProgress * 0.3) + 20)
  );

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    let deadlineVal = "";
    if (quickDeadline) {
      try {
        const [hrs, mins] = quickDeadline.split(":").map(Number);
        const today = new Date();
        today.setHours(hrs ?? 12, mins ?? 0, 0, 0);
        deadlineVal = today.toISOString();
      } catch (err) {
        deadlineVal = new Date(Date.now() + 8 * 3600000).toISOString();
      }
    } else {
      deadlineVal = new Date(Date.now() + 8 * 3600000).toISOString();
    }

    addTask(quickTitle, quickPriority, quickCategory, "medium", quickHours, deadlineVal);
    setQuickTitle("");
    setQuickDeadline("");
    setShowQuickTask(false);
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in select-none w-full max-w-full overflow-x-hidden">
      {/* ================= COMPACT HERO HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 md:pb-8 border-b border-brand-border">
        <div className="space-y-1 md:space-y-2.5">
          <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-brand-primary">
            Overview Dashboard
          </p>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-brand-heading leading-tight">
            Welcome back, {userProfile?.name || "Raju"}
          </h1>
          <p className="text-sm md:text-base text-brand-secondary font-medium">
            Here's how your objectives are shaping up for <span className="font-semibold text-brand-heading underline decoration-brand-primary/40">{todayDateString}</span>
          </p>
        </div>

        {/* Action Triggers - 48px height, rounded-xl */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowQuickTask(true)}
            id="quick-add-task-btn"
            className="flex-1 md:flex-none h-12 min-h-[48px] px-5 bg-brand-primary hover:bg-brand-primary-hover active:scale-98 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
          
          <button
            onClick={regenerateBriefing}
            id="sync-ai-advisor-btn"
            disabled={loadingBriefing}
            className="flex-1 md:flex-none h-12 min-h-[48px] px-5 bg-brand-card hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-body border border-brand-border font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-4.5 h-4.5 text-brand-primary ${loadingBriefing ? "animate-spin" : ""}`} />
            <span>{loadingBriefing ? "Syncing..." : "Sync AI"}</span>
          </button>
        </div>
      </div>

      {/* ================= METRICS RENDER: MOBILE NATIVE LIST SECTIONS VS DESKTOP GRID ================= */}
      <div>
        {/* Mobile Header indicator for metrics */}
        <div className="block md:hidden mb-3 px-1">
          <h3 className="text-xs font-bold text-brand-placeholder tracking-wider uppercase">Productivity Diagnostics</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Tile 1: Productivity Health Score */}
          <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border md:shadow-sm flex md:flex-col items-center md:items-start justify-between md:justify-between min-h-0 md:min-h-[160px] hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center md:items-start md:justify-between gap-4 md:w-full">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary shrink-0">
                <Zap className="w-5.5 h-5.5" />
              </div>
              <div className="md:hidden">
                <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Productivity Health</p>
                <p className="text-xs text-brand-placeholder font-medium mt-0.5">
                  {productivityScore >= 85 ? "Sustaining peak momentum" : "Keep steady outputs"}
                </p>
              </div>
            </div>
            
            <div className="text-right md:text-left md:mt-4 shrink-0">
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-heading">
                {productivityScore}%
              </div>
              <p className="hidden md:block text-xs font-bold text-brand-secondary mt-1.5 uppercase tracking-wider">
                Productivity Health
              </p>
            </div>
          </div>

          {/* Tile 2: Tasks Due Today */}
          <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border md:shadow-sm flex md:flex-col items-center md:items-start justify-between md:justify-between min-h-0 md:min-h-[160px] hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center md:items-start md:justify-between gap-4 md:w-full">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-brand-success shrink-0">
                <CheckCircle2 className="w-5.5 h-5.5" />
              </div>
              <div className="md:hidden">
                <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Tasks Due Today</p>
                <p className="text-xs text-brand-placeholder font-medium mt-0.5">
                  {pendingTasks.length} pending total
                </p>
              </div>
            </div>
            
            <div className="text-right md:text-left md:mt-4 shrink-0">
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-heading">
                {tasksDueTodayCount}
              </div>
              <p className="hidden md:block text-xs font-bold text-brand-secondary mt-1.5 uppercase tracking-wider">
                Tasks Due Today
              </p>
            </div>
          </div>

          {/* Tile 3: Active Goals */}
          <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border md:shadow-sm flex md:flex-col items-center md:items-start justify-between md:justify-between min-h-0 md:min-h-[160px] hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center md:items-start md:justify-between gap-4 md:w-full">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-brand-danger shrink-0">
                <Target className="w-5.5 h-5.5" />
              </div>
              <div className="md:hidden">
                <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Active Goals</p>
                <p className="text-xs text-brand-placeholder font-medium mt-0.5">
                  Average progress: {averageGoalProgress}%
                </p>
              </div>
            </div>
            
            <div className="text-right md:text-left md:mt-4 shrink-0">
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-heading">
                {activeGoalsCount}
              </div>
              <p className="hidden md:block text-xs font-bold text-brand-secondary mt-1.5 uppercase tracking-wider">
                Active Goals
              </p>
            </div>
          </div>

          {/* Tile 4: Focus Score */}
          <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border md:shadow-sm flex md:flex-col items-center md:items-start justify-between md:justify-between min-h-0 md:min-h-[160px] hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center md:items-start md:justify-between gap-4 md:w-full">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-brand-warning shrink-0">
                <Flame className="w-5.5 h-5.5" />
              </div>
              <div className="md:hidden">
                <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Focus Score</p>
                <p className="text-xs text-brand-placeholder font-medium mt-0.5">
                  Based on daily habits
                </p>
              </div>
            </div>
            
            <div className="text-right md:text-left md:mt-4 shrink-0">
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-heading">
                {focusScore}/100
              </div>
              <p className="hidden md:block text-xs font-bold text-brand-secondary mt-1.5 uppercase tracking-wider">
                Focus Score
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECOND ROW: TODAY'S AGENDA / AI RECOMMENDATIONS / DEADLINES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Today's Plan Section */}
        <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h3 className="text-lg md:text-xl font-extrabold text-brand-heading">Today's Plan</h3>
              <button 
                onClick={() => setActivePage("tasks")}
                className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-0.5 cursor-pointer h-9 min-h-[36px] px-2"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 min-h-[180px] md:min-h-[220px]">
              {pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                  <CheckCircle2 className="w-8 h-8 text-brand-placeholder mb-2" />
                  <p className="text-sm font-semibold text-brand-secondary">All tasks completed today!</p>
                </div>
              ) : (
                pendingTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-slate-50/50 dark:bg-slate-900/10 hover:border-brand-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleTask(task.id)}
                        id={`complete-task-${task.id}`}
                        className="w-6 h-6 rounded-lg border border-brand-input-border flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary/5 cursor-pointer shrink-0 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-md bg-transparent hover:bg-brand-primary transition-all"></span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-brand-heading truncate">{task.title}</p>
                        <p className="text-[10px] text-brand-placeholder font-bold uppercase tracking-wide mt-1">{task.category} • {task.priority}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border">
            <p className="text-xs text-brand-secondary font-bold uppercase tracking-wider">
              Select checkbox to archive work.
            </p>
          </div>
        </div>

        {/* AI Advisor Recommendations */}
        <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h3 className="text-lg md:text-xl font-extrabold text-brand-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                AI Assistant
              </h3>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider">
                Live Coach
              </span>
            </div>
            <div className="mt-4 space-y-4 min-h-[180px] md:min-h-[220px] text-brand-body">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-brand-primary uppercase tracking-widest font-mono">
                  Today's Strategy
                </p>
                <div className="text-sm font-bold text-brand-heading italic leading-relaxed">
                  <MarkdownRenderer content={briefing.greeting || "Focus on your critical timelines."} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-brand-secondary tracking-widest">Recommended Actions</p>
                <div className="text-xs text-brand-body leading-relaxed font-medium">
                  <MarkdownRenderer content={briefing.analysis || "Tackle high priority tasks to sustain streak scores."} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between">
            <span className="text-[11px] text-brand-secondary font-bold uppercase">
              Mode: {userProfile.productivityMode || "Professional"}
            </span>
            <button
              onClick={() => setActivePage("coach")}
              className="text-xs font-bold text-brand-primary hover:underline cursor-pointer h-9 px-2 flex items-center"
            >
              Consult Coach
            </button>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h3 className="text-lg md:text-xl font-extrabold text-brand-heading">Upcoming</h3>
              <button 
                onClick={() => setActivePage("calendar")}
                className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-0.5 cursor-pointer h-9 min-h-[36px] px-2"
              >
                Agenda <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 min-h-[180px] md:min-h-[220px]">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                  <Calendar className="w-8 h-8 text-brand-placeholder mb-2" />
                  <p className="text-sm font-semibold text-brand-secondary">No scheduled deadlines.</p>
                </div>
              ) : (
                tasks.slice(0, 3).map((task) => {
                  const daysLeft = task.deadline 
                    ? Math.round((new Date(task.deadline).getTime() - Date.now()) / (1000 * 3600 * 24))
                    : 1;
                  return (
                    <div key={task.id} className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-brand-border flex items-center justify-between">
                      <div className="min-w-0 pr-2 flex-1">
                        <p className="text-sm font-bold text-brand-heading truncate">{task.title}</p>
                        <p className="text-[10px] text-brand-placeholder mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" }) : "Soon"}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shrink-0 ${
                        daysLeft <= 0 ? "bg-red-50 text-brand-danger dark:bg-red-950/30" :
                        daysLeft === 1 ? "bg-amber-50 text-brand-warning dark:bg-amber-950/30" :
                        "bg-indigo-50 text-brand-primary dark:bg-indigo-950/30"
                      }`}>
                        {daysLeft <= 0 ? "Today" : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border">
            <p className="text-xs text-brand-secondary font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-brand-primary" />
              Optimal buffers applied.
            </p>
          </div>
        </div>
      </div>

      {/* ================= THIRD ROW: WORK PROGRESS / HABITS / GOALS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Weekly Progression */}
        <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="pb-4 border-b border-brand-border">
            <h3 className="text-lg md:text-xl font-extrabold text-brand-heading">Progression Output</h3>
          </div>
          <div className="mt-4 space-y-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Completion Rate</span>
              <span className="text-2xl font-extrabold text-brand-heading">{completionRate}%</span>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-3 overflow-hidden border border-brand-border/40">
                <div 
                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-brand-secondary uppercase tracking-wider">
                <span>{completedTasksCount} Closed</span>
                <span>{pendingTasks.length} Open</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-border text-center">
              <div>
                <p className="text-[10px] font-extrabold text-brand-secondary uppercase tracking-wider">Streak</p>
                <p className="text-lg font-extrabold text-brand-heading mt-1">{averageHabitStreak} Days</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-brand-secondary uppercase tracking-wider">Standing</p>
                <p className="text-lg font-extrabold text-brand-primary mt-1">
                  {completionRate >= 80 ? "Peak" : completionRate >= 50 ? "Stable" : "Critical"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Progressions */}
        <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-brand-border">
            <h3 className="text-lg md:text-xl font-extrabold text-brand-heading">Goal Milestones</h3>
            <button 
              onClick={() => setActivePage("goals")}
              className="text-xs font-bold text-brand-primary hover:underline cursor-pointer h-9 px-2 flex items-center"
            >
              Goals Hub
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="w-8 h-8 text-brand-placeholder mb-2" />
                <p className="text-sm font-semibold text-brand-secondary">No active goals found.</p>
              </div>
            ) : (
              goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-brand-heading truncate max-w-[70%]">{goal.title}</span>
                    <span className="text-brand-primary">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-brand-success h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Habit Streaks */}
        <div className="p-5 md:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-brand-border">
            <h3 className="text-lg md:text-xl font-extrabold text-brand-heading">Habits</h3>
            <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Streaks</span>
          </div>
          <div className="mt-4 space-y-3">
            {habits.slice(0, 3).map((habit) => {
              const todayStr = new Date().toISOString().substring(0, 10);
              const doneToday = habit.lastCompleted?.substring(0, 10) === todayStr;
              return (
                <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-brand-border">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-brand-heading truncate leading-tight">{habit.title}</p>
                    <span className="text-[10px] text-brand-secondary font-bold uppercase block mt-1">
                      {habit.timeOfDay} • {habit.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-0.5 text-brand-warning font-extrabold text-sm shrink-0">
                      <Flame className="w-4 h-4 fill-amber-500/10" />
                      <span>{habit.streak}d</span>
                    </div>
                    <button
                      onClick={() => completeHabit(habit.id)}
                      id={`dashboard-complete-habit-${habit.id}`}
                      className={`h-9 px-3.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        doneToday
                          ? "bg-emerald-50 text-brand-success dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-850"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-750 dark:text-slate-200"
                      }`}
                    >
                      {doneToday ? "Saved" : "Log"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= QUICK NEW SHIELD TASK MODAL ================= */}
      {showQuickTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-brand-card p-6 md:p-8 rounded-2xl border border-brand-border shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-3">
              <h4 className="text-lg md:text-xl font-extrabold text-brand-heading tracking-tight">
                Add New Priority Task
              </h4>
              <button 
                onClick={() => setShowQuickTask(false)}
                className="p-1.5 rounded-xl text-brand-secondary hover:text-brand-heading"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateQuickTask} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-placeholder uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code database schema and routes"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-placeholder uppercase tracking-wider mb-1.5">
                    Priority Node
                  </label>
                  <select
                    value={quickPriority}
                    onChange={(e: any) => setQuickPriority(e.target.value)}
                    className="w-full h-11 px-3 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-placeholder uppercase tracking-wider mb-1.5">
                    Category Scope
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e: any) => setQuickCategory(e.target.value)}
                    className="w-full h-11 px-3 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="Study">Study</option>
                    <option value="Work">Work</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-placeholder uppercase tracking-wider mb-1.5">
                    Focus Target (Hrs)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max="12"
                    value={quickHours}
                    onChange={(e) => setQuickHours(parseFloat(e.target.value) || 1)}
                    className="w-full h-11 px-3 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-placeholder uppercase tracking-wider mb-1.5">
                    Target Clock
                  </label>
                  <input
                    type="time"
                    value={quickDeadline}
                    onChange={(e) => setQuickDeadline(e.target.value)}
                    className="w-full h-11 px-3 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowQuickTask(false)}
                  className="h-11 px-4 border border-brand-border bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-secondary text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
