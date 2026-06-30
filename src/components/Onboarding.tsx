import React, { useState } from "react";
import { useApp } from "./AppContext";
import { 
  Sparkles, 
  Brain, 
  Target, 
  Shield, 
  CheckCircle, 
  Layers, 
  ArrowRight,
  GraduationCap, 
  Briefcase, 
  Building, 
  TrendingUp, 
  Check, 
  Bot, 
  Compass, 
  Activity,
  Award
} from "lucide-react";
import { Task, Habit, Goal, AIBriefing } from "../types";

export const Onboarding: React.FC = () => {
  const { 
    userProfile, 
    setUserProfile, 
    setTasks, 
    setHabits, 
    setGoals, 
    setEvents,
    setBriefing,
    setNotifications,
    addActivity 
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMode, setSelectedMode] = useState<"Student" | "Job Seeker" | "Professional" | "Entrepreneur">("Student");
  
  // Questionnaire answers
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [preparingFor, setPreparingFor] = useState("");
  const [productiveHours, setProductiveHours] = useState("8");
  const [importantSkills, setImportantSkills] = useState("");
  const [deadlinesOrGoals, setDeadlinesOrGoals] = useState("");
  
  // Transition simulation
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupStatus, setSetupStatus] = useState("Analyzing objectives...");

  const modes = [
    {
      id: "Student" as const,
      title: "Student Mode",
      desc: "Track exams, manage assignments, schedule revisions, and optimize academic study blocks.",
      icon: GraduationCap,
      color: "from-sky-500 to-indigo-650",
      accent: "text-sky-500 bg-sky-500/10 border-sky-500/20",
      stats: "Study Consistency & Exam Readiness Metrics"
    },
    {
      id: "Job Seeker" as const,
      title: "Job Seeker Mode",
      desc: "Accelerate hiring pipelines, practice DSA, structure portfolio projects, and monitor interviews.",
      icon: Briefcase,
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      stats: "Interview Readiness & Application Velocity Metrics"
    },
    {
      id: "Professional" as const,
      title: "Professional Mode",
      desc: "Manage multi-client deliverables, synchronize team meetings, assess workload balance, and prevent burnout.",
      icon: Building,
      color: "from-indigo-500 to-purple-650",
      accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      stats: "Work Efficiency & Deadline Compliance Metrics"
    },
    {
      id: "Entrepreneur" as const,
      title: "Entrepreneur Mode",
      desc: "Formulate growth strategies, track launch schedules, structure business boards, and forecast MRR metrics.",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-650",
      accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      stats: "Business Execution & Strategic Traction Metrics"
    }
  ];

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleCompleteOnboarding = () => {
    setIsSettingUp(true);
    setSetupProgress(15);
    
    // Step-by-step progress simulation
    setTimeout(() => {
      setSetupProgress(45);
      setSetupStatus("Synthesizing tailored habits database...");
    }, 600);

    setTimeout(() => {
      setSetupProgress(75);
      setSetupStatus("Calibrating Gemini predictive engine...");
    }, 1200);

    setTimeout(() => {
      setSetupProgress(100);
      setSetupStatus("Workspace calibrated! Welcome onboard.");
    }, 1800);

    setTimeout(() => {
      // Seed Mode Specific Items dynamically based on SaaS 5-questions questionnaire
      let seededTasks: Task[] = [];
      let seededHabits: Habit[] = [];
      let seededGoals: Goal[] = [];

      const skillsText = importantSkills || "Core Skills & Focus Areas";
      const goalText = primaryGoal || "Major Milestone Objective";
      const prepText = preparingFor || "Upcoming Placement/Exam/Launch";
      const deadlineText = deadlinesOrGoals || "Upcoming Target Date";
      const hoursNum = parseInt(productiveHours) || 8;

      if (selectedMode === "Student") {
        seededTasks = [
          {
            id: "st-task-1",
            title: `Study & Practice: ${skillsText}`,
            completed: false,
            deadline: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Study",
            difficulty: "hard",
            estimatedHours: hoursNum > 5 ? 4 : 2,
          },
          {
            id: "st-task-2",
            title: `Work on Semester Target: ${goalText}`,
            completed: false,
            deadline: new Date(Date.now() + 1 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Study",
            difficulty: "medium",
            estimatedHours: Math.max(1, Math.round(hoursNum * 0.4)),
          },
          {
            id: "st-task-3",
            title: `Review notes for: ${prepText}`,
            completed: false,
            deadline: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
            priority: "medium",
            category: "Study",
            difficulty: "easy",
            estimatedHours: 2,
          }
        ];
        seededHabits = [
          {
            id: "st-hab-1",
            title: `Practice ${skillsText} for 30 Mins`,
            frequency: "Daily",
            streak: 3,
            lastCompleted: null,
            totalCompletions: 3,
            timeOfDay: "Morning",
          },
          {
            id: "st-hab-2",
            title: `Revise study cards for ${prepText}`,
            frequency: "Daily",
            streak: 1,
            lastCompleted: null,
            totalCompletions: 1,
            timeOfDay: "Evening",
          }
        ];
        seededGoals = [
          {
            id: "st-goal-1",
            title: goalText,
            category: "Education",
            targetDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
            priority: "high",
            progress: 30,
            completed: false,
            milestones: []
          },
          {
            id: "st-goal-2",
            title: `Earn credential for ${prepText}`,
            category: "Education",
            targetDate: new Date(Date.now() + 15 * 24 * 3600000).toISOString().split('T')[0],
            priority: "medium",
            progress: 15,
            completed: false,
            milestones: []
          }
        ];
      } else if (selectedMode === "Job Seeker") {
        seededTasks = [
          {
            id: "js-task-1",
            title: `Code & Practice: ${skillsText}`,
            completed: false,
            deadline: new Date(Date.now() + 1 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Coding Practice",
            difficulty: "hard",
            estimatedHours: Math.max(2, Math.round(hoursNum * 0.4)),
          },
          {
            id: "js-task-2",
            title: `Submit applications & Prepare for: ${prepText}`,
            completed: false,
            deadline: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Interview Preparation",
            difficulty: "medium",
            estimatedHours: 2,
          },
          {
            id: "js-task-3",
            title: `Work on Portfolio piece: ${goalText}`,
            completed: false,
            deadline: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
            priority: "medium",
            category: "Interview Preparation",
            difficulty: "medium",
            estimatedHours: 2,
          }
        ];
        seededHabits = [
          {
            id: "js-hab-1",
            title: `Solve 2 DSA questions on ${skillsText}`,
            frequency: "Daily",
            streak: 5,
            lastCompleted: null,
            totalCompletions: 15,
            timeOfDay: "Morning",
          },
          {
            id: "js-hab-2",
            title: `Apply to jobs matching ${prepText}`,
            frequency: "Daily",
            streak: 2,
            lastCompleted: null,
            totalCompletions: 8,
            timeOfDay: "Afternoon",
          }
        ];
        seededGoals = [
          {
            id: "js-goal-1",
            title: `Secure an offer for ${goalText}`,
            category: "Career",
            targetDate: new Date(Date.now() + 45 * 24 * 3600000).toISOString().split('T')[0],
            priority: "high",
            progress: 40,
            completed: false,
            milestones: []
          },
          {
            id: "js-goal-2",
            title: `Complete portfolio centered around ${skillsText}`,
            category: "Career",
            targetDate: new Date(Date.now() + 20 * 24 * 3600000).toISOString().split('T')[0],
            priority: "medium",
            progress: 75,
            completed: false,
            milestones: []
          }
        ];
      } else if (selectedMode === "Professional") {
        seededTasks = [
          {
            id: "pro-task-1",
            title: `Execute Sprint deliverable: ${goalText}`,
            completed: false,
            deadline: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Work",
            difficulty: "hard",
            estimatedHours: Math.max(3, Math.round(hoursNum * 0.5)),
          },
          {
            id: "pro-task-2",
            title: `Prepare technical plans for: ${prepText}`,
            completed: false,
            deadline: new Date(Date.now() + 1 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Work",
            difficulty: "medium",
            estimatedHours: 2,
          },
          {
            id: "pro-task-3",
            title: `Optimize performance focus on: ${skillsText}`,
            completed: false,
            deadline: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
            priority: "medium",
            category: "Work",
            difficulty: "easy",
            estimatedHours: 1,
          }
        ];
        seededHabits = [
          {
            id: "pro-hab-1",
            title: `Align priority tasks for ${skillsText} in morning`,
            frequency: "Daily",
            streak: 10,
            lastCompleted: null,
            totalCompletions: 22,
            timeOfDay: "Morning",
          },
          {
            id: "pro-hab-2",
            title: `Review milestone status for ${prepText}`,
            frequency: "Daily",
            streak: 4,
            lastCompleted: null,
            totalCompletions: 12,
            timeOfDay: "Evening",
          }
        ];
        seededGoals = [
          {
            id: "pro-goal-1",
            title: `Successfully deliver ${goalText}`,
            category: "Work",
            targetDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
            priority: "high",
            progress: 60,
            completed: false,
            milestones: []
          },
          {
            id: "pro-goal-2",
            title: `Master & apply skill: ${skillsText}`,
            category: "Career",
            targetDate: new Date(Date.now() + 60 * 24 * 3600000).toISOString().split('T')[0],
            priority: "medium",
            progress: 20,
            completed: false,
            milestones: []
          }
        ];
      } else {
        // Entrepreneur Mode
        seededTasks = [
          {
            id: "ent-task-1",
            title: `Draft Strategy & Timeline: ${goalText}`,
            completed: false,
            deadline: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Projects",
            difficulty: "hard",
            estimatedHours: Math.max(3, Math.round(hoursNum * 0.5)),
          },
          {
            id: "ent-task-2",
            title: `Prepare Pitch/Marketing deck for: ${prepText}`,
            completed: false,
            deadline: new Date(Date.now() + 1 * 24 * 3600000).toISOString(),
            priority: "high",
            category: "Projects",
            difficulty: "hard",
            estimatedHours: 3,
          },
          {
            id: "ent-task-3",
            title: `Leverage & validate focus skills: ${skillsText}`,
            completed: false,
            deadline: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
            priority: "medium",
            category: "Projects",
            difficulty: "medium",
            estimatedHours: 2,
          }
        ];
        seededHabits = [
          {
            id: "ent-hab-1",
            title: `Daily standup review for ${skillsText}`,
            frequency: "Daily",
            streak: 15,
            lastCompleted: null,
            totalCompletions: 35,
            timeOfDay: "Morning",
          },
          {
            id: "ent-hab-2",
            title: `Marketing/growth post for ${prepText}`,
            frequency: "Daily",
            streak: 8,
            lastCompleted: null,
            totalCompletions: 18,
            timeOfDay: "Morning",
          }
        ];
        seededGoals = [
          {
            id: "ent-goal-1",
            title: `Launch version of ${goalText}`,
            category: "Projects",
            targetDate: new Date(Date.now() + 14 * 24 * 3600000).toISOString().split('T')[0],
            priority: "high",
            progress: 80,
            completed: false,
            milestones: []
          },
          {
            id: "ent-goal-2",
            title: `Formulate plan to monetize ${skillsText}`,
            category: "Finance",
            targetDate: new Date(Date.now() + 90 * 24 * 3600000).toISOString().split('T')[0],
            priority: "high",
            progress: 25,
            completed: false,
            milestones: []
          }
        ];
      }

      setTasks(seededTasks);
      setHabits(seededHabits);
      setGoals(seededGoals);

      // Seed custom calendar events matching the new configuration
      const seededEvents = [
        {
          id: "ev-onboarding-1",
          title: `Daily Highlight: ${skillsText}`,
          start: new Date(Date.now() + 1 * 3600000).toISOString().replace(/\.\d+Z$/, 'Z'),
          end: new Date(Date.now() + (1 + Math.round(hoursNum * 0.4)) * 3600000).toISOString().replace(/\.\d+Z$/, 'Z'),
          type: "study_session" as const,
          priority: "high" as const,
          description: `Focused time blocked for mastering ${skillsText}`
        },
        {
          id: "ev-onboarding-2",
          title: `Sprint Goal Review: ${goalText}`,
          start: new Date(Date.now() + 24 * 3600000).toISOString().replace(/\.\d+Z$/, 'Z'),
          end: new Date(Date.now() + 25 * 3600000).toISOString().replace(/\.\d+Z$/, 'Z'),
          type: "project_milestone" as const,
          priority: "high" as const,
          description: `Reviewing upcoming milestone: ${goalText}`
        }
      ];
      setEvents(seededEvents);

      // Create a beautiful, custom tailored AI Briefing
      const customBriefing: AIBriefing = {
        greeting: `Welcome to your new ${selectedMode} Workspace, ${userProfile?.name || "Raju"}.`,
        analysis: `We have calibrated your AI engine for your primary objective: **${goalText}**. You are actively preparing for **${prepText}**. A daily budget of **${hoursNum} productive hours** has been mapped focusing on **${skillsText}**. Your pressing timeline (**${deadlineText}**) has been compiled into the predictive risk matrix.`,
        urgencyLevel: "high",
        criticalRisks: [
          `Mastery track for ${skillsText} requires active study blocks.`,
          `Succeed in your milestone: ${deadlineText} within deadlines.`
        ],
        recommendedFocus: `Allocate morning focus on: ${skillsText}`,
        hourlyActionPlan: [
          { time: "09:00 AM", task: `Warmup & Strategic planning for ${prepText}`, active: true },
          { time: "10:30 AM", task: `Deep Work Sprint: ${skillsText}`, active: false },
          { time: "02:00 PM", task: `Goal Execution: ${goalText}`, active: false },
          { time: "04:30 PM", task: `Vulnerability audit & Deadline safeguards`, active: false },
        ],
        motivationalQuote: "A deadline is the ultimate inspiration. Safeguard your day with precision focus!"
      };
      setBriefing(customBriefing);

      // Create customized smart notifications
      const customNotifications = [
        {
          id: "notif-new-1",
          title: "Adaptive Workspace Activated",
          message: `Workspace successfully configured for ${selectedMode} Mode focusing on ${skillsText}.`,
          timestamp: "Just now",
          type: "system" as const,
          priority: "high" as const,
          read: false,
          contextMessage: `Daily Budget: ${hoursNum} Focus Hours`
        },
        {
          id: "notif-new-2",
          title: "Goal Track Synced",
          message: `Primary target: "${goalText}" ingested and mapped to timeline buffers.`,
          timestamp: "Just now",
          type: "goal" as const,
          priority: "medium" as const,
          read: false,
          contextMessage: `Deadline: ${deadlineText}`
        }
      ];
      setNotifications(customNotifications);

      // Clear the local AI Coach thread and seed a custom tailored recommendation message
      const coachWelcomeMessage = {
        id: "bot-" + Date.now(),
        role: "assistant" as const,
        content: `### 🛡️ ${selectedMode} Workspace Calibrated!\n\nHello **${userProfile?.name || "Raju"}**,\n\nI have thoroughly analyzed your newly updated parameters for **${selectedMode} Mode**:\n\n- **Primary Goal**: ${goalText}\n- **Preparing For**: ${prepText}\n- **Productive Focus**: ${skillsText} (${hoursNum} hours daily)\n- **Upcoming Deadlines**: ${deadlineText}\n\nI have dynamically re-seeded your Task List, Daily Habits, Calendar Events, Goals page, and Analytics telemetry.\n\nHow would you like to start organizing your first study or implementation block today?`,
        suggestions: [
          "Explain my procrastination risks",
          "Walk me through today's time blocks",
          "Recommend a sprint break routine",
          "Help me prioritize upcoming deadlines"
        ]
      };
      localStorage.setItem("coaching_messages_history", JSON.stringify([coachWelcomeMessage]));

      // Save userProfile
      setUserProfile({
        ...userProfile,
        productivityMode: selectedMode,
        role: selectedMode,
        hasCompletedOnboarding: true,
        targetHours: hoursNum,
        onboardingAnswers: {
          whoAreYou: prepText,
          goals: goalText,
          priorities: skillsText,
          deadlines: deadlineText,
          primaryGoal: goalText,
          preparingFor: prepText,
          productiveHours: productiveHours,
          importantSkills: skillsText,
          deadlinesOrGoals: deadlineText
        }
      });

      addActivity(`Configured ${selectedMode} Workspace successfully`, "system");
    }, 2400);
  };

  if (isSettingUp) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="relative flex justify-center items-center">
            <span className="absolute animate-ping h-20 w-20 rounded-full bg-indigo-500/20"></span>
            <div className="w-16 h-16 rounded-2xl bg-[#4F46E5] flex items-center justify-center shadow-lg text-white">
              <Brain className="w-8 h-8 animate-spin" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Initializing Workspace</h2>
            <p className="text-sm text-slate-400 font-mono tracking-wider uppercase">{setupStatus}</p>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#4F46E5] h-full transition-all duration-300"
              style={{ width: `${setupProgress}%` }}
            ></div>
          </div>
          <span className="text-sm font-semibold text-slate-400">{setupProgress}% completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-150 flex flex-col justify-center items-center p-6 sm:p-8 md:p-12 relative overflow-hidden">
      {/* Visual background decor */}
      <div className="absolute top-0 left-0 -mt-24 -ml-24 bg-indigo-600/10 w-96 h-96 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 -mb-24 -mr-24 bg-purple-600/10 w-96 h-96 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full bg-[#1E293B] border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-2xl relative z-10 space-y-10">
        
        {/* LOGO */}
        <div className="flex items-center gap-4 justify-center sm:justify-start">
          <div className="p-3 rounded-xl bg-[#4F46E5] text-white shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase text-[#F8FAFC]">DEADLINE GUARDIAN</h1>
            <p className="text-xs font-mono tracking-widest text-indigo-400 font-bold uppercase">Adaptive Productivity Engine</p>
          </div>
        </div>

        {/* STEP 1: SELECT COGNITIVE PERSONA */}
        {step === 1 ? (
          <div className="space-y-8">
            <div className="text-center sm:text-left space-y-2">
              <div className="text-sm font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Step 1 of 2: Select Mode
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Who are you & what is your primary objective?</h2>
              <p className="text-sm sm:text-base text-slate-350 leading-relaxed max-w-3xl">
                Choose a specialized productivity mode. This customizes dashboards, AI recommendations, analytics, and calendars automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modes.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative group text-left ${
                      isSelected
                        ? "bg-[#0F172A] border-indigo-500 shadow-xl ring-2 ring-indigo-550/30"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30"
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${m.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? "bg-[#4F46E5] border-[#4F46E5] text-white" 
                          : "border-slate-700 group-hover:border-slate-500"
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-white">{m.title}</h3>
                      <p className="text-sm text-slate-350 leading-relaxed font-medium">{m.desc}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-xs text-indigo-400 font-mono font-semibold">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      {m.stats}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                className="h-12 px-6 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm tracking-wide shadow-md flex items-center gap-2 cursor-pointer transition-transform duration-200"
              >
                Configure Questionnaire
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: METADATA QUESTIONNAIRE */
          <div className="space-y-8">
            <div className="text-center sm:text-left space-y-2">
              <div 
                className="text-sm font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start cursor-pointer hover:underline"
                onClick={() => setStep(1)}
              >
                &larr; Back to mode selection
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Personalize Your AI Objectives</h2>
              <p className="text-sm sm:text-base text-slate-350 leading-relaxed max-w-3xl">
                These objective parameters are sent to Gemini to curate personalized coaching suggestions, recovery plans, and scheduling optimizations.
              </p>
            </div>

            <div className="space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  1. What is your primary goal?
                </label>
                <textarea
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  rows={2}
                  placeholder="e.g., Master trees and graph algorithms, build a personal full-stack portfolio..."
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-base text-slate-200 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  2. What are you preparing for?
                </label>
                <input
                  type="text"
                  value={preparingFor}
                  onChange={(e) => setPreparingFor(e.target.value)}
                  placeholder="e.g., Upcoming semester exams, job interviews, or a product launch..."
                  className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-base text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  3. How many productive hours do you have each day?
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={productiveHours}
                  onChange={(e) => setProductiveHours(e.target.value)}
                  placeholder="e.g., 8"
                  className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-base text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  4. Which skills or focus areas are most important?
                </label>
                <textarea
                  value={importantSkills}
                  onChange={(e) => setImportantSkills(e.target.value)}
                  rows={2}
                  placeholder="e.g., React, TypeScript, DSA, System Design..."
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-base text-slate-200 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  5. What deadlines or goals do you currently have?
                </label>
                <input
                  type="text"
                  value={deadlinesOrGoals}
                  onChange={(e) => setDeadlinesOrGoals(e.target.value)}
                  placeholder="e.g., Semester database systems exam on June 28th, Infosys interview preparation..."
                  className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-base text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                &larr; Switch Mode Card
              </button>
              
              <button
                onClick={handleCompleteOnboarding}
                className="h-12 px-6 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm tracking-wide shadow-md flex items-center gap-2 cursor-pointer transition-transform duration-200 animate-pulse"
              >
                Initialize Custom Workspace
                <Sparkles className="w-5 h-5 text-indigo-300 animate-spin" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
