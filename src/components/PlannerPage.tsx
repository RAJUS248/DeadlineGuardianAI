import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { fetchAIGeneratePlanner, GeneratedPlannerResult } from "../lib/store";
import { Task } from "../types";
import {
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  Brain,
  RotateCcw,
  CheckCircle2,
  ListTodo,
  Mic,
  MicOff,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Compass,
  Trophy,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const PlannerPage: React.FC = () => {
  const { 
    tasks, 
    goals, 
    habits, 
    addActivity, 
    addEvent, 
    addTask, 
    addGoal, 
    addNotification, 
    earnXP,
    plannerData,
    setPlannerData,
    isPlannerSynced,
    setIsPlannerSynced,
    syncPlannerToWorkspace,
    toggleTask,
    addCustomTask,
    showToast
  } = useApp();

  // View modes
  const [activeTab, setActiveTab] = useState<"daily" | "study" | "interview" | "rescue">("daily");

  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<{ [key: string]: boolean }>({});
  const [isSynced, setIsSynced] = useState(false);

  // Sync completedBlocks with tasks completed state
  useEffect(() => {
    if (plannerData.timeBlocks) {
      const updated: { [key: string]: boolean } = {};
      plannerData.timeBlocks.forEach((block, idx) => {
        const blockId = (block as any).id || `block-${idx}`;
        const matchingTask = tasks.find(t => t.id === (block as any).taskId);
        if (matchingTask) {
          updated[blockId] = matchingTask.completed;
        } else {
          // Fallback to title matching for legacy compatibility
          const legacyTask = tasks.find(t => t.title.trim().toLowerCase() === block.focus.trim().toLowerCase());
          if (legacyTask) {
            updated[blockId] = legacyTask.completed;
          } else {
            updated[blockId] = false;
          }
        }
      });
      setCompletedBlocks(updated);
    }
  }, [tasks, plannerData.timeBlocks]);

  // Toggle completion of blocks
  const toggleBlockCompleted = (index: number) => {
    const block = plannerData.timeBlocks[index];
    const blockId = (block as any).id || `block-${index}`;
    const isNowCompleted = !completedBlocks[blockId];
    
    setCompletedBlocks(prev => ({ ...prev, [blockId]: isNowCompleted }));

    const matchingTask = tasks.find(t => t.id === (block as any).taskId);
    
    if (matchingTask) {
      toggleTask(matchingTask.id);
    } else {
      // Create task on the fly as completed!
      const today = new Date();
      const dateStr = today.toISOString().substring(0, 10);
      const startISO = `${dateStr}T09:00:00`;
      const taskId = (block as any).taskId || "task-planner-" + index + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      
      const newTask: Task = {
        id: taskId,
        title: block.focus,
        completed: isNowCompleted,
        priority: "high",
        category: "Study",
        difficulty: "medium",
        estimatedHours: 1.5,
        deadline: startISO,
        startTime: startISO,
        endTime: `${dateStr}T10:30:00`
      };
      
      // Keep block updated with this ID
      (block as any).taskId = taskId;
      if (!(block as any).id) (block as any).id = blockId;
      
      addCustomTask(newTask);
    }

    if (isNowCompleted) {
      earnXP(50, `Completed daily focus block: "${block.focus}"`);
      addNotification(
        "Focus block completed", 
        `Congratulations! You finished "${block.focus}" and earned 50 XP.`, 
        "streak", 
        "medium"
      );
    }
  };

  // Convert time blocks to events & tasks (deprecated but kept for backward compatibility if needed)
  const mapBlockToEventAndTask = (block: { timeRange: string; focus: string; category: string }, dateStr: string) => {
    // Left empty since we now do atomic synchronization
  };

  // Explicit sync button
  const handleSyncToWorkspace = () => {
    syncPlannerToWorkspace(plannerData);
    setIsSynced(true);
    showToast("Workspace Updated", "Time blocks, tasks, and goals have been fully synchronized.", "success");
    setTimeout(() => setIsSynced(false), 3000);
  };

  // Handle generative prompt execution
  const handleGeneratePlanner = async (type: string, queryText: string) => {
    setGenerating(true);
    addActivity(`Strategic AI Planner optimizing for: "${type}" parameters`, "info");

    try {
      const data = await fetchAIGeneratePlanner(type, queryText, { tasks, goals });
      setPlannerData(data);
      setCompletedBlocks({});
      
      // Auto-sync schedule items directly to context on successful prompt generation
      syncPlannerToWorkspace(data);
      showToast("✅ Schedule Created", "Dashboard updated, Calendar updated, Tasks added, and Analytics updated.", "success");
    } catch (e) {
      console.error(e);
      addActivity("Failed to generate schedule. Utilizing fallback baseline parameters.", "alert");
      showToast("Generation Failed", "Could not reach the AI planner engine.", "alert");
    } finally {
      setGenerating(false);
    }
  };

  const handleStudyPlanPreset = (preset: string) => {
    let query = "7-day DSA preparation plan with daily schedules";
    if (preset === "infosys") query = "Targeted Infosys Interview prep daily study timeline";
    if (preset === "react") query = "10-day interactive React learning and portfolio execution roadmap";

    handleGeneratePlanner("study", query);
  };

  // Web Speech API Integration
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addNotification("Voice Input Error", "Speech recognition is not supported in this browser.", "rescue", "medium");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCustomPrompt(transcript);
      addNotification("Voice Received", `Successfully parsed: "${transcript}"`, "streak", "low");
      handleGeneratePlanner("custom", transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("coding") || cat.includes("dsa")) {
      return "border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400";
    }
    if (cat.includes("project") || cat.includes("app")) {
      return "border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400";
    }
    return "border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400";
  };

  return (
    <div className="space-y-8 select-none w-full max-w-full overflow-x-hidden animate-fade-in">
      
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-6 border-b border-brand-border">
        <div className="space-y-1 md:space-y-2.5">
          <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-brand-primary">
            Autonomous Optimizer
          </p>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-brand-heading leading-none">
            AI Planner
          </h1>
          <p className="text-sm md:text-base text-brand-secondary font-semibold">
            Instantly map high-focus daily blocks, study roadmaps, and emergency schedules to your active dashboard.
          </p>
        </div>

        {/* View Segment Switcher */}
        <div className="flex bg-brand-bg p-1 rounded-xl shrink-0 self-start lg:self-center border border-brand-border overflow-x-auto max-w-full">
          {["daily", "study", "interview", "rescue"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 md:px-5 h-9 text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
                activeTab === tab
                  ? "bg-brand-card text-brand-heading shadow-xs border border-brand-border/40"
                  : "text-brand-secondary hover:text-brand-heading"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ================= SLEEK TOP COMMAND BAR (REPLACES AI PROMPTING CARD) ================= */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#101828] border border-brand-border p-2 rounded-2xl shadow-sm w-full">
        <div className="flex-1 flex items-center gap-2.5 px-3">
          <Sparkles className="w-5 h-5 text-brand-primary shrink-0 animate-pulse" />
          <input
            type="text"
            placeholder="Type or speak study objectives (e.g. 'Schedule DSA from 9 AM to 11 AM tomorrow')...."
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              setIsPlannerSynced(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customPrompt.trim()) {
                handleGeneratePlanner("custom", customPrompt);
                setCustomPrompt("");
              }
            }}
            className="w-full bg-transparent border-none text-[#111827] dark:text-[#FFFFFF] placeholder-[rgba(17,24,39,0.45)] dark:placeholder-[rgba(255,255,255,0.45)] caret-[#5B4DFF] dark:caret-[#7C5CFF] selection:bg-indigo-500 selection:text-white dark:selection:bg-indigo-600 dark:selection:text-white focus:outline-none text-xs md:text-sm font-semibold"
          />
          <button
            type="button"
            onClick={startListening}
            className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "text-brand-secondary hover:text-brand-heading hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={isListening ? "Listening..." : "Voice Input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={() => {
            if (customPrompt.trim()) {
              handleGeneratePlanner("custom", customPrompt);
              setCustomPrompt("");
            }
          }}
          disabled={generating || !customPrompt.trim()}
          className="h-11 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-xs disabled:opacity-40 transition-all shrink-0 flex items-center justify-center gap-2"
        >
          {generating ? "Synthesizing..." : "Optimize Schedule"}
        </button>
      </div>

      {/* ================= TIMELINE WORKSPACE VIEW (IMMEDIATELY DISPLAYED) ================= */}
      <div className="space-y-6">
        
        {/* Advisor Focus Tip Banner with Actionable Sync Button */}
        <div className="p-4 bg-indigo-50/40 dark:bg-slate-900/40 border border-indigo-100/30 dark:border-brand-border/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-brand-primary text-white rounded-xl shrink-0 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Advisor Focus Tip</h3>
              <p className="text-xs md:text-sm text-brand-body mt-1 leading-relaxed font-semibold italic">
                "{plannerData.focusRecommendation}"
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncToWorkspace}
            className="px-4.5 h-11 bg-brand-success hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            {isSynced ? "✅ Workspace Updated Successfully" : isPlannerSynced ? "✔ Synced" : "Update Workspace"}
          </button>
        </div>

        {/* Timeline Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          
          {/* Main Visualized Timeline Blocks */}
          <div className="lg:col-span-3 space-y-6">
            
            {activeTab === "daily" && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-placeholder flex items-center gap-2 px-1">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  Time Block Allocations (Motion AI Visuals)
                </h3>
                <div className="space-y-4">
                  {plannerData.timeBlocks.map((block, idx) => {
                    const blockId = (block as any).id || `block-${idx}`;
                    const isCompleted = completedBlocks[blockId];
                    return (
                      <div 
                        key={blockId} 
                        className={`relative border-l-4 p-4.5 rounded-2xl border border-brand-border/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md hover:translate-x-0.5 cursor-default ${getCategoryColor(block.category)}`}
                      >
                        {/* Resizable handles simulation */}
                        <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="w-1.5 h-1.5 bg-brand-placeholder rounded-full" />
                          <span className="w-1.5 h-1.5 bg-brand-placeholder rounded-full" />
                        </div>

                        <div className="flex items-start gap-4">
                          {/* Interactive round check to mark as completed */}
                          <button
                            onClick={() => toggleBlockCompleted(idx)}
                            className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center mt-0.5 cursor-pointer transition-all shrink-0 ${
                              isCompleted
                                ? "bg-brand-success border-brand-success text-white"
                                : "border-brand-placeholder hover:border-brand-primary bg-brand-card"
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs font-black font-mono text-brand-primary tracking-wider uppercase bg-brand-card dark:bg-slate-950 px-2 py-0.5 rounded-md border border-brand-border/40 shadow-2xs">
                                {block.timeRange}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">
                                {block.category}
                              </span>
                            </div>
                            <h4 className={`text-sm md:text-base font-extrabold text-brand-heading leading-snug ${isCompleted ? "line-through text-brand-placeholder" : ""}`}>
                              {block.focus}
                            </h4>
                          </div>
                        </div>

                        <span className={`text-[10px] px-3 py-1 rounded-lg font-extrabold uppercase border self-start md:self-center shrink-0 ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-brand-success border-brand-success/20"
                            : "bg-brand-card text-brand-secondary border-brand-border/60"
                        }`}>
                          {isCompleted ? "Completed" : "Assigned"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Study & Interview Roadmap Milestones */}
            {(activeTab === "study" || activeTab === "interview") && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-placeholder flex items-center gap-1.5 px-1">
                  <ListTodo className="w-4 h-4 text-brand-primary" />
                  Milestone Breakdown
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plannerData.milestones.map((m, idx) => (
                    <div key={idx} className="p-4 bg-brand-card border border-brand-border/60 rounded-2xl shadow-xs hover:shadow-sm transition-all flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-brand-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-indigo-100/30">
                        {idx + 1}
                      </div>
                      <p className="text-xs md:text-sm font-bold text-brand-heading leading-relaxed">
                        {m}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Rescue Mode view */}
            {activeTab === "rescue" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-brand-placeholder flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-brand-danger" />
                    Emergency Recovery Loop
                  </h3>
                  <span className="text-[10px] bg-rose-50 dark:bg-red-950/40 text-brand-danger px-2.5 py-1 rounded-lg font-black uppercase tracking-widest shrink-0 border border-rose-100/30">Emergency Mode</span>
                </div>

                <div className="space-y-3.5">
                  {plannerData.deadlinesRescue?.map((r, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-950/20 flex items-start gap-3.5">
                      <div className="px-3 py-1 bg-rose-100 text-brand-danger dark:bg-rose-950/60 dark:text-rose-400 font-bold font-mono text-[10px] rounded-lg shrink-0 mt-0.5">
                        {r.hour}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-bold text-brand-heading leading-relaxed">{r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advice Footer */}
            <div className="p-4.5 rounded-2xl bg-brand-card border border-brand-border text-xs md:text-sm text-brand-secondary leading-relaxed flex flex-col sm:flex-row sm:items-center gap-2.5 font-bold">
              <span className="text-brand-primary shrink-0 uppercase tracking-wider text-[10px] font-black block">Optimization Tip:</span>
              <span>{plannerData.workloadOptimizationAdvice}</span>
            </div>

          </div>

          {/* Sidebar Quick Presets & Guides */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Study Presets Column */}
            <div className="p-5 bg-brand-card border border-brand-border rounded-2xl shadow-sm space-y-3.5">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-placeholder">Recommended Presets</h4>
              <p className="text-xs text-brand-secondary font-semibold leading-relaxed">
                Unlock optimized paths calibrated directly for active interviews & frameworks.
              </p>
              
              <div className="space-y-2.5">
                <button
                  onClick={() => handleStudyPlanPreset("dsa-7day")}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-xs font-bold text-brand-heading cursor-pointer border border-brand-border/60 transition-colors flex items-center justify-between group"
                >
                  <span>7-Day DSA Prep</span>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-placeholder group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => handleStudyPlanPreset("react")}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-xs font-bold text-brand-heading cursor-pointer border border-brand-border/60 transition-colors flex items-center justify-between group"
                >
                  <span>React Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-placeholder group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => handleStudyPlanPreset("infosys")}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-xs font-bold text-brand-heading cursor-pointer border border-brand-border/60 transition-colors flex items-center justify-between group"
                >
                  <span>Infosys Career Track</span>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-placeholder group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="p-5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 rounded-2xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary block">Active Calibration</span>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-brand-placeholder uppercase text-[9px] font-black">Tasks Tracked</span>
                  <p className="text-sm font-extrabold text-brand-heading mt-0.5">{tasks.length}</p>
                </div>
                <div>
                  <span className="text-brand-placeholder uppercase text-[9px] font-black">Goals set</span>
                  <p className="text-sm font-extrabold text-brand-heading mt-0.5">{goals.length}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
