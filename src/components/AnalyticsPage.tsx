import React, { useState } from "react";
import { useApp } from "./AppContext";
import {
  Activity,
  Zap,
  TrendingUp,
  Brain,
  AlertTriangle,
  Clock,
  Target,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckCircle2
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const {
    analyticsData,
    tasks,
    goals,
    habits,
    regenerateAnalytics,
    loadingAnalytics
  } = useApp();

  const [activeTab, setActiveTab] = useState<"diagnostics" | "risk_engine" | "ai_reports">("diagnostics");

  const mathTotal = tasks.length;
  const mathCompleted = tasks.filter(t => t.completed).length;
  const mathRate = mathTotal > 0 ? Math.round((mathCompleted / mathTotal) * 100) : 80;
  const mathScore = Math.round(mathRate * 0.8 + 15);

  const data = analyticsData || {
    healthScore: mathScore,
    components: {
      taskCompletion: mathRate,
      deadlineManagement: 85,
      goalProgress: 70,
      habitConsistency: 80,
    },
    metrics: {
      totalTasks: mathTotal,
      completedTasks: mathCompleted,
      pendingTasks: mathTotal - mathCompleted,
      completionRate: mathRate,
      weeklyRating: "Good",
      deepWorkHours: 6.5,
      productivityPeaks: "09:00 AM - 11:30 AM"
    },
    bestPeriods: {
      mostProductiveHour: "10:00 AM",
      mostProductiveDay: "Wednesday",
    },
    predictions: {
      tasksAtRisk: tasks.filter(t => !t.completed && t.priority === "high").slice(0, 2).map(t => ({
        title: t.title,
        risk: "high" as const,
        reason: "Tight deadline with substantial work estimated."
      })),
      burnoutRiskScore: "Low" as const,
      recommendations: ["Maintain restorative breaks between coding sprints."]
    }
  };

  return (
    <div className="space-y-12 animate-fade-in select-none">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-brand-border">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
            Insights Hub
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-heading leading-tight">
            Productivity Analytics
          </h1>
          <p className="text-base text-brand-secondary font-medium">
            Deeper metrics on task completion, scheduling performance, and workload risks.
          </p>
        </div>

        {/* View Tabs & Actions */}
        <div className="flex bg-brand-bg p-1 rounded-xl shrink-0 self-start lg:self-center border border-brand-border">
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-5 h-10 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "diagnostics" ? "bg-brand-card text-brand-heading shadow-sm" : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            Diagnostics
          </button>
          
          <button
            onClick={() => setActiveTab("risk_engine")}
            className={`px-5 h-10 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "risk_engine" ? "bg-brand-card text-brand-heading shadow-sm" : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            Risk Engine
          </button>

          <button
            onClick={() => setActiveTab("ai_reports")}
            className={`px-5 h-10 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "ai_reports" ? "bg-brand-card text-brand-heading shadow-sm" : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            AI Reports
          </button>
        </div>
      </div>

      {/* ================= DIAGNOSTICS TAB ================= */}
      {activeTab === "diagnostics" && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Bento Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Health Score Progress */}
            <div className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[180px]">
              <div>
                <span className="text-sm font-bold text-brand-secondary">Productivity Index</span>
                <div className="text-4xl font-black text-brand-heading mt-2">
                  {data.healthScore}%
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="w-full bg-brand-bg rounded-full h-2">
                  <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${data.healthScore}%` }}></div>
                </div>
                <p className="text-sm text-brand-secondary font-semibold">Graded against daily habit commitments</p>
              </div>
            </div>

            {/* Total Completed */}
            <div className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[180px]">
              <div>
                <span className="text-sm font-bold text-brand-secondary">Deliverables Resolved</span>
                <div className="text-4xl font-black text-brand-heading mt-2">
                  {data.metrics.completedTasks} / {data.metrics.totalTasks}
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="w-full bg-brand-bg rounded-full h-2">
                  <div className="bg-brand-success h-2 rounded-full" style={{ width: `${data.metrics.completionRate}%` }}></div>
                </div>
                <p className="text-sm text-brand-secondary font-semibold">{data.metrics.completionRate}% completion rate today</p>
              </div>
            </div>

            {/* Peak productivity times */}
            <div className="p-6 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[180px]">
              <div>
                <span className="text-sm font-bold text-brand-secondary">Peak Performance Window</span>
                <div className="text-2xl font-black text-brand-heading mt-3 truncate leading-snug">
                  {data.metrics.productivityPeaks}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-brand-secondary flex items-center gap-2 font-semibold">
                  <Clock className="w-5 h-5 text-brand-primary" />
                  Calculated from focus intervals
                </p>
              </div>
            </div>
          </div>

          {/* Productivity Factors Breakdown */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-brand-heading">Workflow Metrics Diagnostics</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-brand-secondary">Task Resolution</span>
                  <span className="text-brand-heading">{data.components.taskCompletion}%</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full">
                  <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${data.components.taskCompletion}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-brand-secondary">Deadline Accuracy</span>
                  <span className="text-brand-heading">{data.components.deadlineManagement}%</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full">
                  <div className="bg-brand-success h-2.5 rounded-full" style={{ width: `${data.components.deadlineManagement}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-brand-secondary">Goal Milestone Progress</span>
                  <span className="text-brand-heading">{data.components.goalProgress}%</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full">
                  <div className="bg-brand-danger h-2.5 rounded-full" style={{ width: `${data.components.goalProgress}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-brand-secondary">Habit Streaks Rhythm</span>
                  <span className="text-brand-heading">{data.components.habitConsistency}%</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full">
                  <div className="bg-brand-warning h-2.5 rounded-full" style={{ width: `${data.components.habitConsistency}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RISK ENGINE TAB ================= */}
      {activeTab === "risk_engine" && (
        <div className="space-y-8 animate-fade-in">
          <div className="p-6 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-950/40 flex items-start gap-4">
            <div className="p-3 bg-brand-danger text-white rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-brand-danger text-lg">Proactive Burnout Predictor</h3>
              <p className="text-base text-brand-body mt-1 leading-relaxed font-semibold">
                Risk Rating is currently marked as <span className="font-bold text-brand-success uppercase">{data.predictions.burnoutRiskScore}</span>. Continue matching workload weights.
              </p>
            </div>
          </div>

          <div className="bg-brand-card rounded-2xl border border-brand-border p-8 space-y-5 shadow-sm">
            <h3 className="text-lg font-bold text-brand-heading">Active Objectives At Risk</h3>
            
            <div className="space-y-4">
              {data.predictions.tasksAtRisk.length === 0 ? (
                <p className="text-base text-brand-secondary italic font-semibold">No schedules or active objectives are at risk.</p>
              ) : (
                data.predictions.tasksAtRisk.map((tr, idx) => (
                  <div key={idx} className="p-5 bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-brand-border flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-brand-heading">{tr.title}</p>
                      <p className="text-sm text-brand-secondary mt-1 font-semibold">{tr.reason}</p>
                    </div>
                    <span className="text-xs bg-rose-100 text-brand-danger px-3 py-1 rounded-lg font-extrabold uppercase tracking-wider shrink-0">
                      {tr.risk} risk
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= AI REPORTS TAB ================= */}
      {activeTab === "ai_reports" && (
        <div className="bg-brand-card rounded-2xl border border-brand-border p-8 space-y-6 animate-fade-in shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-brand-heading flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-primary animate-pulse" />
              Strategic Workload Analytics
            </h3>
            <p className="text-sm text-brand-secondary mt-1 font-semibold">AI-suggested improvements for your study and career targets.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-brand-border">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-1">Optimizing Daily Habit Loops</h4>
              <p className="text-base text-brand-body leading-relaxed font-medium">
                Maintain steady outputs on your study habits. Ensure focus schedules align with your peak hours of productivity (around {data.bestPeriods.mostProductiveHour}).
              </p>
            </div>

            <div className="p-5 bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-brand-border">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-1 font-bold">AI Diagnostics recommendations</h4>
              <p className="text-base text-brand-body leading-relaxed font-medium">
                "{data.predictions.recommendations[0] || "Maintain standard study breaks."}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
