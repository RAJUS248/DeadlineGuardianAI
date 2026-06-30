import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Task, Habit, Goal, ActivityLog, AIBriefing, CalendarEvent, ProductivityAnalytics, SmartNotification, Badge, Challenge, ProcrastinationAnalysis } from "../types";
import {
  DEFAULT_PROFILE,
  DEFAULT_TASKS,
  DEFAULT_HABITS,
  DEFAULT_GOALS,
  DEFAULT_ACTIVITIES,
  DEFAULT_BRIEFING,
  DEFAULT_EVENTS,
  fetchAIBriefing,
  fetchAIAnalytics,
  GeneratedPlannerResult,
} from "../lib/store";
import { logoutGoogle, initAuth, getAccessToken } from "../lib/firebaseAuth";
import {
  listGoogleEvents,
  createGoogleEventAPI,
  updateGoogleEventAPI,
  deleteGoogleEventAPI,
  getGoogleColorId,
  getReminderMinutes,
  isOnline,
  processOfflineQueue,
  addToOfflineQueue,
  detectTimeConflicts,
  GoogleCalendarEvent,
} from "../lib/googleCalendar";

interface AppContextType {
  analyticsData: ProductivityAnalytics | null;
  loadingAnalytics: boolean;
  regenerateAnalytics: () => Promise<void>;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addEvent: (title: string, start: string, end: string, type: CalendarEvent["type"], priority?: CalendarEvent["priority"], description?: string) => void;
  updateEvent: (updatedEvent: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  activities: ActivityLog[];
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  briefing: AIBriefing;
  setBriefing: (briefing: AIBriefing) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  loadingBriefing: boolean;
  regenerateBriefing: () => Promise<void>;
  addTask: (title: string, priority: Task["priority"], category: Task["category"], difficulty: Task["difficulty"], estimatedHours: number, deadline: string) => void;
  addCustomTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (id: string) => void;
  addHabit: (title: string, frequency: Habit["frequency"], timeOfDay: string) => void;
  completeHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  addGoal: (title: string, category: string, targetDate: string) => void;
  updateGoalProgress: (id: string, progress: number) => void;
  deleteGoal: (id: string) => void;
  addActivity: (message: string, type: ActivityLog["type"]) => void;

  // Advanced Agentic Layer
  notifications: SmartNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<SmartNotification[]>>;
  addNotification: (title: string, message: string, type: SmartNotification["type"], priority: SmartNotification["priority"], contextMessage?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Gamification & Rewards
  xp: number;
  level: number;
  badges: Badge[];
  challenges: Challenge[];
  earnXP: (amount: number, reason: string) => void;
  unlockBadge: (id: string) => void;
  completeChallengeStep: (id: string, amount: number) => void;
  celebration: { show: boolean; title: string; message: string; badge?: string } | null;
  dismissCelebration: () => void;

  // Procrastination Engine
  procrastinationAnalysis: ProcrastinationAnalysis;
  loadingProcrastination: boolean;
  triggerManualProcrastinationCheck: () => Promise<void>;

  // Deadline Rescue Mode
  rescueModeActive: boolean;
  rescuePlan: { hour: string; action: string }[] | null;
  triggerDeadlineRescue: (isManual?: boolean) => Promise<void>;
  setRescueModeActive: (active: boolean) => void;

  // Authentication Flow
  isAuthenticated: boolean;
  login: (email: string, name: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, name: string, role: string, productivityMode: "Student" | "Job Seeker" | "Professional" | "Entrepreneur") => Promise<boolean>;

  // Planner State Synchronization
  plannerData: GeneratedPlannerResult;
  setPlannerData: React.Dispatch<React.SetStateAction<GeneratedPlannerResult>>;
  isPlannerSynced: boolean;
  setIsPlannerSynced: React.Dispatch<React.SetStateAction<boolean>>;
  syncPlannerToWorkspace: (data: GeneratedPlannerResult) => void;

  // Google Calendar Integration
  googleCalConnected: boolean;
  setGoogleCalConnected: React.Dispatch<React.SetStateAction<boolean>>;
  googleAccessToken: string | null;
  lastSyncTime: string;
  defaultReminderOption: string;
  setDefaultReminderOption: (opt: string) => void;
  defaultCalendarName: string;
  setDefaultCalendarName: (name: string) => void;
  syncFrequencyMinutes: number;
  setSyncFrequencyMinutes: (freq: number) => void;
  connectGoogleCalendar: (accessToken: string) => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  syncNow: () => Promise<void>;

  // Toast notifications
  toasts: { id: string; title: string; message: string; type: "success" | "alert" | "info" }[];
  showToast: (title: string, message: string, type?: "success" | "alert" | "info") => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Safe localStorage proxy helper to prevent DOMException / security access crashes in sandboxed iFrames
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    } catch (e) {
      console.warn(`[SafeStorage] Access denied reading key: ${key}`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Access denied writing key: ${key}`, e);
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: "success" | "alert" | "info" }[]>([]);
  const inFlightSyncs = React.useRef<Set<string>>(new Set());

  // --- GOOGLE CALENDAR STATE ---
  const [googleCalConnected, setGoogleCalConnectedState] = useState<boolean>(() => {
    try {
      return safeLocalStorage.getItem("dg_google_cal_connected") === "true";
    } catch {
      return false;
    }
  });
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return safeLocalStorage.getItem("dg_google_last_sync") || "Never";
  });
  const [defaultReminderOption, setDefaultReminderOptionState] = useState<string>(() => {
    return safeLocalStorage.getItem("dg_google_default_reminder") || "30_min";
  });
  const [defaultCalendarName, setDefaultCalendarNameState] = useState<string>(() => {
    return safeLocalStorage.getItem("dg_google_default_calendar") || "primary";
  });
  const [syncFrequencyMinutes, setSyncFrequencyMinutesState] = useState<number>(() => {
    const val = safeLocalStorage.getItem("dg_google_sync_freq");
    return val ? parseInt(val, 10) : 5;
  });

  const setGoogleCalConnected = (val: boolean | ((prev: boolean) => boolean)) => {
    setGoogleCalConnectedState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      safeLocalStorage.setItem("dg_google_cal_connected", next ? "true" : "false");
      return next;
    });
  };

  const setDefaultReminderOption = (opt: string) => {
    setDefaultReminderOptionState(opt);
    safeLocalStorage.setItem("dg_google_default_reminder", opt);
  };

  const setDefaultCalendarName = (name: string) => {
    setDefaultCalendarNameState(name);
    safeLocalStorage.setItem("dg_google_default_calendar", name);
  };

  const setSyncFrequencyMinutes = (freq: number) => {
    setSyncFrequencyMinutesState(freq);
    safeLocalStorage.setItem("dg_google_sync_freq", freq.toString());
  };

  const showToast = (title: string, message: string, type: "success" | "alert" | "info" = "success") => {
    const id = "toast-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = safeLocalStorage.getItem("dg_authenticated");
      return stored === "true";
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("dg_theme") as "dark" | "light" | null : null;
      if (stored === "dark" || stored === "light") {
        return stored;
      }
      if (typeof window !== "undefined" && window.matchMedia) {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return systemPrefersDark ? "dark" : "light";
      }
    } catch (e) {
      console.warn("Failed to check theme on init:", e);
    }
    return "dark";
  });
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);

  // Productivity Analytics state
  const [analyticsData, setAnalyticsData] = useState<ProductivityAnalytics | null>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_analytics");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to parse dg_analytics", e);
      return null;
    }
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  // Core state arrays
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_profile");
      return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
    } catch (e) {
      console.error("Failed to parse dg_profile, falling back to default.", e);
      return DEFAULT_PROFILE;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_tasks");
      const parsed: Task[] = raw ? JSON.parse(raw) : DEFAULT_TASKS;
      const seenIds = new Set<string>();
      return parsed.map((t, idx) => {
        let cleanId = t.id;
        if (!cleanId || seenIds.has(cleanId)) {
          cleanId = "task-sanitized-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
        }
        seenIds.add(cleanId);
        return { ...t, id: cleanId };
      });
    } catch (e) {
      console.error("Failed to parse dg_tasks, falling back to default.", e);
      return DEFAULT_TASKS;
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_habits");
      const parsed: Habit[] = raw ? JSON.parse(raw) : DEFAULT_HABITS;
      const seenIds = new Set<string>();
      return parsed.map((h, idx) => {
        let cleanId = h.id;
        if (!cleanId || seenIds.has(cleanId)) {
          cleanId = "habit-sanitized-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
        }
        seenIds.add(cleanId);
        return { ...h, id: cleanId };
      });
    } catch (e) {
      console.error("Failed to parse dg_habits, falling back to default.", e);
      return DEFAULT_HABITS;
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_goals");
      const parsed: Goal[] = raw ? JSON.parse(raw) : DEFAULT_GOALS;
      const seenIds = new Set<string>();
      return parsed.map((g, idx) => {
        let cleanId = g.id;
        if (!cleanId || seenIds.has(cleanId)) {
          cleanId = "goal-sanitized-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
        }
        seenIds.add(cleanId);

        // Sanitize milestone IDs inside the goal as well
        const seenMilestoneIds = new Set<string>();
        const cleanMilestones = (g.milestones || []).map((m, mIdx) => {
          let cleanMId = m.id;
          if (!cleanMId || seenMilestoneIds.has(cleanMId)) {
            cleanMId = "milestone-sanitized-" + mIdx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
          }
          seenMilestoneIds.add(cleanMId);
          return { ...m, id: cleanMId };
        });

        return { ...g, id: cleanId, milestones: cleanMilestones };
      });
    } catch (e) {
      console.error("Failed to parse dg_goals, falling back to default.", e);
      return DEFAULT_GOALS;
    }
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_activities");
      return raw ? JSON.parse(raw) : DEFAULT_ACTIVITIES;
    } catch (e) {
      console.error("Failed to parse dg_activities, falling back to default.", e);
      return DEFAULT_ACTIVITIES;
    }
  });

  const [briefing, setBriefing] = useState<AIBriefing>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_briefing");
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_BRIEFING,
          ...parsed,
          criticalRisks: parsed.criticalRisks || DEFAULT_BRIEFING.criticalRisks,
          hourlyActionPlan: parsed.hourlyActionPlan || DEFAULT_BRIEFING.hourlyActionPlan,
        };
      }
      return DEFAULT_BRIEFING;
    } catch (e) {
      console.error("Failed to parse dg_briefing, falling back to default.", e);
      return DEFAULT_BRIEFING;
    }
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_events");
      const parsed: CalendarEvent[] = raw ? JSON.parse(raw) : DEFAULT_EVENTS;
      const seenIds = new Set<string>();
      return parsed.map((ev, idx) => {
        let cleanId = ev.id;
        if (!cleanId || seenIds.has(cleanId)) {
          cleanId = "event-sanitized-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
        }
        seenIds.add(cleanId);
        return { ...ev, id: cleanId };
      });
    } catch (e) {
      console.error("Failed to parse dg_events, falling back to default.", e);
      return DEFAULT_EVENTS;
    }
  });

  // --- ADVANCED AGENTIC LAYER STATE ---
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_notifications");
      let parsed: SmartNotification[] = [];
      if (raw) {
        parsed = JSON.parse(raw);
      } else {
        parsed = [
          {
            id: "notif-1",
            title: "Focus Shield Calibrated",
            message: "Completing your high-urgency study tasks before 4 PM today keeps your productivity health score above 85!",
            timestamp: "10 mins ago",
            type: "streak",
            priority: "medium",
            read: false,
            contextMessage: "Velocity Shield Level: Stable"
          },
          {
            id: "notif-2",
            title: "Overdue Risk Assessment",
            message: "Your SDE Trees DSA Revision remains uncompleted. Repeated postponements on study goals have raised your procrastination risk score.",
            timestamp: "1 hour ago",
            type: "procrastination",
            priority: "high",
            read: false,
            contextMessage: "Target Task: Trees & Graph DSA"
          }
        ];
      }
      const seenIds = new Set<string>();
      return parsed.map((n, idx) => {
        let cleanId = n.id;
        if (!cleanId || seenIds.has(cleanId)) {
          cleanId = "notif-sanitized-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
        }
        seenIds.add(cleanId);
        return { ...n, id: cleanId };
      });
    } catch (e) {
      console.error("Failed to parse notifications:", e);
      return [];
    }
  });

  const [xp, setXp] = useState<number>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_xp");
      return raw ? parseInt(raw) : 320;
    } catch {
      return 320;
    }
  });

  const [level, setLevel] = useState<number>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_level");
      return raw ? parseInt(raw) : 3;
    } catch {
      return 3;
    }
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_badges");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: "b1", title: "Deep Focus Sentinel", description: "Complete 5 high-priority tasks exactly on time.", unlockedAt: "locked", icon: "Shield", category: "tasks", xpReward: 200 },
      { id: "b2", title: "Meditation Master", description: "Sustain a 5-day meditation habit streak.", unlockedAt: new Date("2026-06-22").toISOString(), icon: "Brain", category: "habits", xpReward: 150 },
      { id: "b3", title: "Crisis Commander", description: "Successfully complete a Deadline Rescue session.", unlockedAt: "locked", icon: "Flame", category: "rescue", xpReward: 300 },
      { id: "b4", title: "Goal Crusher", description: "Achieve 100% on a major target goal.", unlockedAt: "locked", icon: "Trophy", category: "goals", xpReward: 250 },
      { id: "b5", title: "Anti-Delay Shield", description: "Maintain a low procrastination risk for 3 days.", unlockedAt: new Date("2026-06-21").toISOString(), icon: "CheckCircle", category: "streaks", xpReward: 200 }
    ];
  });

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_challenges");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: "c1", title: "7-Day Focus Challenge", description: "Clear 5 study/project tasks with high difficulty.", duration: "7 Days", reward: "500 XP + Focus Shield Badge", xpReward: 500, progress: 2, target: 5, completed: false, category: "focus" },
      { id: "c2", title: "Emergency Clear-Out", description: "Resolve 4 pending tasks during a single Rescue Mode session.", duration: "24 Hours", reward: "300 XP + Crisis Shield Badge", xpReward: 300, progress: 0, target: 4, completed: false, category: "anti-procrastination" },
      { id: "c3", title: "Habit Stacker Pro", description: "Perform all registered habits before 10 AM for 3 days.", duration: "3 Days", reward: "200 XP", xpReward: 200, progress: 2, target: 3, completed: false, category: "habit-stack" }
    ];
  });

  const [rescueModeActive, setRescueModeActiveState] = useState<boolean>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_rescue_active");
      return raw === "true";
    } catch {
      return false;
    }
  });

  const [rescuePlan, setRescuePlan] = useState<{ hour: string; action: string }[] | null>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_rescue_plan");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [procrastinationAnalysis, setProcrastinationAnalysis] = useState<ProcrastinationAnalysis>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_procrastination_analysis");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      riskScore: 42,
      level: "Moderate",
      delayedTasksCount: 1,
      postponementRate: 25,
      avoidancePatterns: ["Rescheduling complex study items in the evenings", "Tackling low priority items first during peak energy windows"],
      behavioralFeedback: "You have excellent consistency on habits, but tend to delay hard study deliverables to late evenings when SDE stamina is depleted.",
      recommendedInterventions: [
        "Implement early-day 'Eat the Frog' strategy for Tree traversals.",
        "Schedule a 20-minute focus pocket right after morning breathing habit.",
        "Delay lower-priority administrative tasks."
      ]
    };
  });

  const [loadingProcrastination, setLoadingProcrastination] = useState<boolean>(false);
  const [celebration, setCelebration] = useState<{ show: boolean; title: string; message: string; badge?: string } | null>(null);

  // Planner State Synchronization
  const [plannerData, setPlannerData] = useState<GeneratedPlannerResult>(() => {
    let data: GeneratedPlannerResult;
    try {
      const raw = safeLocalStorage.getItem("dg_planner_data");
      data = raw ? JSON.parse(raw) : {
        focusRecommendation: "Conduct 90-minute high-intensity focus blocks early in the morning.",
        timeBlocks: [
          { timeRange: "09:00 AM - 11:30 AM", focus: "Practice trees, graphs traversal algorithms", category: "Coding Practice" },
          { timeRange: "02:00 PM - 04:30 PM", focus: "Draft comprehensive schema blueprints and implement React context hooks", category: "Projects" },
          { timeRange: "05:00 PM - 06:15 PM", focus: "Rehearse core DBMS questions and practice technical HR queries", category: "Interview Prep" }
        ],
        milestones: [
          "Day 1-2: Setup template framework and review core structures",
          "Day 3-4: Build backend database, execute state hooks, and test edge cases",
          "Day 5-6: Conduct mock reviews, resolve bottlenecks, and audit safety checks",
          "Day 7: Finalize production deployment and lock deliverables"
        ],
        deadlinesRescue: [
          { hour: "Hour 1", action: "Verify constraints, setup baseline modules and check dependencies" },
          { hour: "Hour 2-3", action: "Construct fundamental logic loops, map routing, connect db" },
          { hour: "Hour 4", action: "Initiate comprehensive bug-checking sessions, refine layout spacing" },
          { hour: "Hour 5", action: "Perform complete validation review and trigger secure deploy" }
        ],
        workloadOptimizationAdvice: "Your current schedule has dense intervals. Shift light habits and allocate dedicated hours to high difficulty parameters."
      };
    } catch {
      data = {
        focusRecommendation: "Conduct 90-minute high-intensity focus blocks early in the morning.",
        timeBlocks: [
          { timeRange: "09:00 AM - 11:30 AM", focus: "Practice trees, graphs traversal algorithms", category: "Coding Practice" },
          { timeRange: "02:00 PM - 04:30 PM", focus: "Draft comprehensive schema blueprints and implement React context hooks", category: "Projects" },
          { timeRange: "05:00 PM - 06:15 PM", focus: "Rehearse core DBMS questions and practice technical HR queries", category: "Interview Prep" }
        ],
        milestones: [
          "Day 1-2: Setup template framework and review core structures",
          "Day 3-4: Build backend database, execute state hooks, and test edge cases",
          "Day 5-6: Conduct mock reviews, resolve bottlenecks, and audit safety checks",
          "Day 7: Finalize production deployment and lock deliverables"
        ],
        deadlinesRescue: [
          { hour: "Hour 1", action: "Verify constraints, setup baseline modules and check dependencies" },
          { hour: "Hour 2-3", action: "Construct fundamental logic loops, map routing, connect db" },
          { hour: "Hour 4", action: "Initiate comprehensive bug-checking sessions, refine layout spacing" },
          { hour: "Hour 5", action: "Perform complete validation review and trigger secure deploy" }
        ],
        workloadOptimizationAdvice: "Your current schedule has dense intervals. Shift light habits and allocate dedicated hours to high difficulty parameters."
      };
    }

    if (data.timeBlocks) {
      data.timeBlocks.forEach((block: any, idx) => {
        if (!block.id) block.id = `block-${idx}-init`;
        if (!block.taskId) block.taskId = `task-planner-${idx}-init`;
      });
    }
    return data;
  });

  const [isPlannerSynced, setIsPlannerSynced] = useState<boolean>(() => {
    try {
      const raw = safeLocalStorage.getItem("dg_planner_synced");
      return raw === "true";
    } catch {
      return false;
    }
  });

  // Sync planner to localStorage
  useEffect(() => {
    safeLocalStorage.setItem("dg_planner_data", JSON.stringify(plannerData));
  }, [plannerData]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_planner_synced", isPlannerSynced.toString());
  }, [isPlannerSynced]);

  const syncPlannerToWorkspace = (data: GeneratedPlannerResult) => {
    const today = new Date();
    const dateStr = today.toISOString().substring(0, 10);
    
    // Ensure every timeBlock has a unique ID and taskId
    if (data.timeBlocks) {
      data.timeBlocks.forEach((block: any, idx) => {
        if (!block.id) {
          block.id = "block-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        }
        if (!block.taskId) {
          block.taskId = "task-planner-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        }
      });
    }

    // Persist assigned IDs back to plannerData state
    setPlannerData({ ...data });
    
    const newTasks = [...tasks];
    const newEvents = [...events];
    const newGoals = [...goals];

    let hasActualChanges = false;

    if (data.timeBlocks && data.timeBlocks.length > 0) {
      data.timeBlocks.forEach((block, idx) => {
        let startHour = "09:00:00";
        let endHour = "11:00:00";
        let duration = 2.5;
        try {
          const parts = block.timeRange.split("-");
          if (parts.length === 2) {
            const startClean = parts[0].trim();
            const endClean = parts[1].trim();
            
            const parseSingleTime = (timeStr: string) => {
              const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (match) {
                let hr = parseInt(match[1]);
                const min = match[2];
                const ampm = match[3].toUpperCase();
                if (ampm === "PM" && hr < 12) hr += 12;
                if (ampm === "AM" && hr === 12) hr = 0;
                return `${String(hr).padStart(2, "0")}:${min}:00`;
              }
              return null;
            };

            const s = parseSingleTime(startClean);
            const e = parseSingleTime(endClean);
            if (s) startHour = s;
            if (e) endHour = e;

            if (s && e) {
              const [sh, sm] = s.split(":").map(Number);
              const [eh, em] = e.split(":").map(Number);
              duration = (eh - sh) + (em - sm) / 60;
              if (duration < 0) duration += 24;
            }
          }
        } catch (err) {
          console.error("Error parsing block timeRange:", err);
        }

        const startISO = `${dateStr}T${startHour}`;
        const endISO = `${dateStr}T${endHour}`;
        
        // Match existing task by unique taskId, fallback to title matching for legacy compatibility
        const existingTaskIndex = newTasks.findIndex(t => 
          t.id === (block as any).taskId || 
          t.title.trim().toLowerCase() === block.focus.trim().toLowerCase()
        );
        
        const rawCat = block.category ? block.category.toLowerCase() : "";
        const mappedCategory: Task["category"] = 
          rawCat.includes("code") || rawCat.includes("coding") ? "Coding Practice" :
          rawCat.includes("project") ? "Projects" :
          rawCat.includes("interview") ? "Interview Preparation" :
          "Study";

        if (existingTaskIndex >= 0) {
          const ext = newTasks[existingTaskIndex];
          // Keep unique taskId assigned if it wasn't already
          if (ext.id !== (block as any).taskId && (block as any).taskId) {
            ext.id = (block as any).taskId;
          }
          
          if (ext.completed || ext.startTime !== startISO || ext.endTime !== endISO) {
            hasActualChanges = true;
          }

          const updatedTask: Task = {
            ...ext,
            completed: false, // Reset completed state so user can do it again today!
            deadline: startISO,
            startTime: startISO,
            endTime: endISO,
            duration: duration,
            estimatedHours: duration,
            category: mappedCategory,
            isDashboardReference: true
          };
          newTasks[existingTaskIndex] = updatedTask;

          // Update corresponding calendar event
          const existingEventIndex = newEvents.findIndex(ev => ev.linkedId === ext.id || ev.title.trim().toLowerCase() === block.focus.trim().toLowerCase());
          const updatedEv: CalendarEvent = {
            id: existingEventIndex >= 0 ? newEvents[existingEventIndex].id : "event-planner-" + idx + "-" + Date.now(),
            title: block.focus,
            start: startISO,
            end: endISO,
            type: "ai_activity",
            priority: "high",
            description: block.category,
            linkedId: ext.id
          };

          if (existingEventIndex >= 0) {
            newEvents[existingEventIndex] = updatedEv;
          } else {
            newEvents.push(updatedEv);
          }
        } else {
          // Add as a brand new task
          hasActualChanges = true;
          const taskId = (block as any).taskId || "task-planner-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          const eventId = "event-planner-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          
          const newTask: Task = {
            id: taskId,
            title: block.focus,
            completed: false,
            priority: "high",
            category: mappedCategory,
            difficulty: "medium",
            estimatedHours: duration,
            deadline: startISO,
            startTime: startISO,
            endTime: endISO,
            duration: duration,
            calendarEventId: eventId,
            isDashboardReference: true,
            description: `AI Planner Focus Block: ${block.category}`
          };
          newTasks.unshift(newTask);

          const newEv: CalendarEvent = {
            id: eventId,
            title: block.focus,
            start: startISO,
            end: endISO,
            type: "ai_activity",
            priority: "high",
            description: block.category,
            linkedId: taskId
          };
          newEvents.push(newEv);
        }
      });
    }

    if (data.milestones && data.milestones.length > 0) {
      data.milestones.forEach((m, idx) => {
        const goalExists = newGoals.some(g => g.title.trim().toLowerCase() === m.trim().toLowerCase());
        if (!goalExists) {
          hasActualChanges = true;
          const newGoal: Goal = {
            id: "goal-planner-" + idx + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            title: m,
            category: "AI Milestone Track",
            targetDate: new Date(Date.now() + 86400000 * (idx + 1) * 2).toISOString().substring(0, 10),
            progress: 0,
            completed: false,
            priority: "medium",
            status: "Healthy"
          };
          newGoals.push(newGoal);
        }
      });
    }

    setTasks(newTasks);
    setEvents(newEvents);
    setGoals(newGoals);
    setIsPlannerSynced(true);

    if (hasActualChanges) {
      addNotification(
        "Workspace Synchronized",
        `Automatically mapped ${data.timeBlocks?.length || 0} focus blocks and roadmaps across Dashboard, Tasks, Goals & Calendar.`,
        "streak",
        "high",
        "Unified Planner Sync"
      );

      addActivity("AI Planner schedule and milestones synced to active workspace.", "success");
      earnXP(100, "Synchronized AI daily focus blocks to workspace.");
      showToast("🤖 AI Planner synchronized", "Time blocks, tasks, and calendar events are in perfect sync.", "success");
    } else {
      addActivity("AI Planner schedule is already synced and up to date.", "info");
    }
  };

  // Sync to localStorage
  useEffect(() => {
    safeLocalStorage.setItem("dg_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_activities", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_xp", xp.toString());
  }, [xp]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_level", level.toString());
  }, [level]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_badges", JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_challenges", JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_rescue_active", rescueModeActive.toString());
  }, [rescueModeActive]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_rescue_plan", rescuePlan ? JSON.stringify(rescuePlan) : "");
  }, [rescuePlan]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_procrastination_analysis", JSON.stringify(procrastinationAnalysis));
  }, [procrastinationAnalysis]);

  useEffect(() => {
    safeLocalStorage.setItem("dg_briefing", JSON.stringify(briefing));
  }, [briefing]);

  useEffect(() => {
    if (analyticsData) {
      safeLocalStorage.setItem("dg_analytics", JSON.stringify(analyticsData));
    }
  }, [analyticsData]);

  const regenerateAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await fetchAIAnalytics(userProfile, tasks, habits, goals, events);
      setAnalyticsData(data);
    } catch (e) {
      console.error("Failed to fetch analytics telemetry:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    regenerateAnalytics();
  }, [tasks, habits, goals, events]);

  // Load theme preference and keep document element class sync'd
  useEffect(() => {
    const storedTheme = safeLocalStorage.getItem("dg_theme") as "dark" | "light" | null;
    if (!storedTheme) {
      try {
        if (window.matchMedia) {
          const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          const initialTheme = systemPrefersDark ? "dark" : "light";
          setTheme(initialTheme);
          safeLocalStorage.setItem("dg_theme", initialTheme);
        }
      } catch (e) {
        console.warn("Failed to set default system theme:", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.warn("Failed to sync document theme classes:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    safeLocalStorage.setItem("dg_theme", nextTheme);
  };

  // Safe user profile updater
  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    addActivity(`Updated user profile settings`, "system");
  };

  // Helper helper to add message log entries
  const addActivity = (message: string, type: ActivityLog["type"]) => {
    const newAct: ActivityLog = {
      id: "act-" + Math.random().toString(),
      message,
      timestamp: "Just now",
      type,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const regenerateBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const data = await fetchAIBriefing(userProfile, tasks, habits, goals);
      setBriefing(data);
      addActivity("AI daily briefing analyzed & optimized", "success");
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBriefing(false);
    }
  };

  // --- GOOGLE CALENDAR TASK & EVENT SYNCHRONIZATION HELPERS ---

  const ensureRFC3339 = (str: any): string => {
    if (!str || typeof str !== "string") {
      return new Date().toISOString();
    }
    // Normalize spaces to T
    let normalized = str.trim().replace(" ", "T");

    // If it already ends with Z or a timezone offset (e.g., -07:00 or -0700 or +00:00)
    if (/Z|([+-]\d{2}:?\d{2})$/.test(normalized)) {
      return normalized;
    }

    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return `${normalized}T00:00:00Z`;
    }

    // Match YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
      return `${normalized}:00Z`;
    }

    // Match YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
      return `${normalized}Z`;
    }

    // Match YYYY-MM-DDTHH:mm:ss.sss
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/.test(normalized)) {
      return `${normalized}Z`;
    }

    // Fallback: try parsing with Date constructor
    try {
      const cleaned = normalized.replace(/[^0-9T:.-]/g, "");
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch (e) {}

    // Ultimate fallback: standard current timestamp
    return new Date().toISOString();
  };

  const getValidStartEndISO = (startStr: any, endStr: any, fallbackDurationHours = 1): { startIso: string; endIso: string } => {
    let finalStartIso = ensureRFC3339(startStr);
    let finalEndIso = ensureRFC3339(endStr);

    const startMs = new Date(finalStartIso).getTime();
    const endMs = new Date(finalEndIso).getTime();

    if (isNaN(startMs)) {
      finalStartIso = new Date().toISOString();
    }
    
    const validStartMs = new Date(finalStartIso).getTime();
    if (isNaN(endMs) || endMs <= validStartMs) {
      finalEndIso = new Date(validStartMs + fallbackDurationHours * 3600000).toISOString();
    }

    return { startIso: finalStartIso, endIso: finalEndIso };
  };

  const getCleanGoogleEventId = (id: string | undefined): string | undefined => {
    if (!id) return undefined;
    if (
      id.startsWith("pending-sync-") ||
      id.startsWith("event-") ||
      id.startsWith("task-")
    ) {
      return undefined;
    }
    return id;
  };

  const syncTaskToGoogle = async (task: Task, action: "create" | "update" | "delete") => {
    const token = googleAccessToken || getAccessToken();
    if (!googleCalConnected) return;

    const startCandidate = task.startTime || task.deadline;
    const endCandidate = task.endTime;
    const { startIso: finalStartIso, endIso: finalEndIso } = getValidStartEndISO(
      startCandidate,
      endCandidate,
      task.estimatedHours || 1
    );

    const googleEv: GoogleCalendarEvent = {
      summary: (task.completed ? "✅ " : "") + task.title,
      description: task.description || `Guardian Task in category ${task.category}`,
      start: { dateTime: finalStartIso },
      end: { dateTime: finalEndIso },
      colorId: getGoogleColorId(task.category),
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: getReminderMinutes(defaultReminderOption) },
        ],
      },
    };

    const cleanEventId = getCleanGoogleEventId(task.calendarEventId);
    const trackingId = cleanEventId || task.id;

    if (!token || !isOnline()) {
      addToOfflineQueue(trackingId, action, googleEv);
      return;
    }

    try {
      if (action === "create" || (action === "update" && !cleanEventId)) {
        const res = await createGoogleEventAPI(googleEv, token);
        if (res?.id) {
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, calendarEventId: res.id } : t));
          // Create internal calendar event as well
          setEvents((prev) => [
            ...prev,
            {
              id: res.id,
              title: googleEv.summary,
              start: finalStartIso,
              end: finalEndIso,
              type: "task",
              linkedId: task.id,
              priority: task.priority,
              description: task.description,
            },
          ]);
        }
      } else if (action === "update" && cleanEventId) {
        await updateGoogleEventAPI(cleanEventId, googleEv, token);
        // Also update local events list
        setEvents((prev) =>
          prev.map((e) =>
            e.id === cleanEventId || e.linkedId === task.id
              ? { ...e, title: googleEv.summary, start: finalStartIso, end: finalEndIso }
              : e
          )
        );
      } else if (action === "delete" && cleanEventId) {
        await deleteGoogleEventAPI(cleanEventId, token);
        // Also remove from local events list
        setEvents((prev) => prev.filter((e) => e.id !== cleanEventId && e.linkedId !== task.id));
      }
    } catch (e) {
      const errMsg = String(e?.message || e).toLowerCase();
      const is401 = errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid authentication credentials");
      if (is401) {
        await handleGoogleAuthError();
        return;
      }
      const is404 = errMsg.includes("404") || errMsg.includes("notfound");
      const is400 = errMsg.includes("400") || errMsg.includes("timerangeempty");

      if (!is404 && !is400) {
        console.error(`Failed to sync task: ${action}`, e);
      } else {
        console.warn(`Known non-fatal sync issue for task: ${action} - ${errMsg}`);
      }

      const isRetryable = (error: any): boolean => {
        const msg = String(error?.message || error).toLowerCase();
        return !(
          msg.includes("404") ||
          msg.includes("notfound") ||
          msg.includes("400") ||
          msg.includes("timerangeempty") ||
          msg.includes("403") ||
          msg.includes("forbidden")
        );
      };

      if (isRetryable(e)) {
        addToOfflineQueue(trackingId, action, googleEv);
      } else {
        if (is404) {
          // Clear local reference if not found on server
          setTasks((prev) =>
            prev.map((t) => (t.calendarEventId === cleanEventId || t.id === task.id ? { ...t, calendarEventId: undefined } : t))
          );
          setEvents((prev) => prev.filter((ev) => ev.id !== cleanEventId && ev.linkedId !== task.id));

          if (action === "update") {
            // Re-create the event since it's missing on the server but we want it synced!
            console.warn(`Task event ${cleanEventId} not found (404) on Google Calendar during update. Re-creating event.`);
            await syncTaskToGoogle({ ...task, calendarEventId: undefined }, "create");
          }
        }
      }
    }
  };

  const syncEventToGoogle = async (ev: CalendarEvent, action: "create" | "update" | "delete") => {
    const token = googleAccessToken || getAccessToken();
    if (!googleCalConnected) return;

    const { startIso: finalStartIso, endIso: finalEndIso } = getValidStartEndISO(
      ev.start,
      ev.end,
      1
    );

    const googleEv: GoogleCalendarEvent = {
      summary: ev.title,
      description: ev.description || `Guardian Calendar Event`,
      start: { dateTime: finalStartIso },
      end: { dateTime: finalEndIso },
      colorId: getGoogleColorId(ev.type || "Personal"),
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: getReminderMinutes(defaultReminderOption) },
        ],
      },
    };

    const cleanEventId = getCleanGoogleEventId(ev.id);
    const trackingId = cleanEventId || ev.id;

    if (!token || !isOnline()) {
      addToOfflineQueue(trackingId, action, googleEv);
      return;
    }

    try {
      if (action === "create" || (action === "update" && !cleanEventId)) {
        const res = await createGoogleEventAPI(googleEv, token);
        if (res?.id) {
          setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, id: res.id } : e)));
        }
      } else if (action === "update" && cleanEventId) {
        await updateGoogleEventAPI(cleanEventId, googleEv, token);
      } else if (action === "delete" && cleanEventId) {
        await deleteGoogleEventAPI(cleanEventId, token);
      }
    } catch (e) {
      const errMsg = String(e?.message || e).toLowerCase();
      const is401 = errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid authentication credentials");
      if (is401) {
        await handleGoogleAuthError();
        return;
      }
      const is404 = errMsg.includes("404") || errMsg.includes("notfound");
      const is400 = errMsg.includes("400") || errMsg.includes("timerangeempty");

      if (!is404 && !is400) {
        console.error(`Failed to sync calendar event: ${action}`, e);
      } else {
        console.warn(`Known non-fatal sync issue for calendar event: ${action} - ${errMsg}`);
      }

      const isRetryable = (error: any): boolean => {
        const msg = String(error?.message || error).toLowerCase();
        return !(
          msg.includes("404") ||
          msg.includes("notfound") ||
          msg.includes("400") ||
          msg.includes("timerangeempty") ||
          msg.includes("403") ||
          msg.includes("forbidden")
        );
      };

      if (isRetryable(e)) {
        addToOfflineQueue(trackingId, action, googleEv);
      } else {
        if (is404) {
          // Clear event locally if deleted on Google Calendar
          setEvents((prev) => prev.filter((item) => item.id !== cleanEventId));

          if (action === "update") {
            // Re-create the calendar event since it's missing on the server but we want it synced
            console.warn(`Calendar event ${cleanEventId} not found (404) on Google Calendar during update. Re-creating.`);
            await syncEventToGoogle({ ...ev, id: "pending-sync-" + Math.random().toString() }, "create");
          }
        }
      }
    }
  };

  // Add Task Function
  const addTask = (
    title: string,
    priority: Task["priority"],
    category: Task["category"],
    difficulty: Task["difficulty"],
    estimatedHours: number,
    deadline: string
  ) => {
    const newTask: Task = {
      id: "task-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title,
      completed: false,
      priority,
      category,
      difficulty,
      estimatedHours,
      deadline: deadline || new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days default
    };
    setTasks((prev) => [newTask, ...prev]);
    addActivity(`Scheduled priority task: "${title}"`, "info");

    // Immediately trigger Google Calendar sync
    if (googleCalConnected) {
      syncTaskToGoogle(newTask, "create");
    }
  };

  const addCustomTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    addActivity(`AI auto-scheduled task: "${task.title}"`, "success");
    if (googleCalConnected) {
      syncTaskToGoogle(task, "create");
    }
  };

  const toggleTask = (id: string) => {
    let completedState = false;
    let title = "";
    let matchedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          completedState = !t.completed;
          title = t.title;
          matchedTask = { ...t, completed: completedState };
          return matchedTask;
        }
        return t;
      })
    );

    if (title) {
      addActivity(
        completedState
          ? `Cleared task: "${title}"`
          : `Re-opened task: "${title}"`,
        completedState ? "success" : "info"
      );

      // Trigger Google Calendar sync
      if (googleCalConnected && matchedTask) {
        syncTaskToGoogle(matchedTask, "update");
      }
    }
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (googleCalConnected) {
      syncTaskToGoogle(updatedTask, "update");
    }
  };

  const deleteTask = (id: string) => {
    const t = tasks.find((item) => item.id === id);
    setTasks((prev) => prev.filter((item) => item.id !== id));
    if (t) {
      addActivity(`Deleted priority task: "${t.title}"`, "alert");

      // Trigger Google Calendar delete sync
      if (googleCalConnected && t) {
        syncTaskToGoogle(t, "delete");
      }
    }
  };

  // Add Habit function
  const addHabit = (title: string, frequency: Habit["frequency"], timeOfDay: string) => {
    const newHabit: Habit = {
      id: "habit-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title,
      frequency,
      streak: 0,
      lastCompleted: null,
      totalCompletions: 0,
      timeOfDay,
    };
    setHabits((prev) => [...prev, newHabit]);
    addActivity(`Initiated custom habit loop: "${title}"`, "info");
  };

  const completeHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const todayStr = new Date().toISOString().substring(0, 10);
          const wasCompletedToday = h.lastCompleted?.substring(0, 10) === todayStr;
          
          if (wasCompletedToday) {
            // Already completed today, un-complete it
            return {
              ...h,
              streak: Math.max(0, h.streak - 1),
              lastCompleted: null,
              totalCompletions: Math.max(0, h.totalCompletions - 1),
            };
          } else {
            return {
              ...h,
              streak: h.streak + 1,
              lastCompleted: new Date().toISOString(),
              totalCompletions: h.totalCompletions + 1,
            };
          }
        }
        return h;
      })
    );
    const habObj = habits.find(h => h.id === id);
    if (habObj) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const isUndoing = habObj.lastCompleted?.substring(0, 10) === todayStr;
      addActivity(
        isUndoing
          ? `Undid completion of: "${habObj.title}"`
          : `Accomplished habit: "${habObj.title}"`,
        isUndoing ? "alert" : "habit"
      );
    }
  };

  const deleteHabit = (id: string) => {
    const h = habits.find((item) => item.id === id);
    setHabits((prev) => prev.filter((item) => item.id !== id));
    if (h) {
      addActivity(`Removed habit pattern: "${h.title}"`, "alert");
    }
  };

  // Goals CRUD
  const addGoal = (title: string, category: string, targetDate: string) => {
    const newGoal: Goal = {
      id: "goal-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title,
      category,
      targetDate: targetDate || new Date(Date.now() + 86400000 * 90).toISOString().substring(0, 10), // 90 days
      progress: 0,
      completed: false,
    };
    setGoals((prev) => [...prev, newGoal]);
    addActivity(`Mapped focus target: "${title}"`, "info");
  };

  const updateGoalProgress = (id: string, progressValue: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const completed = progressValue >= 100;
          return { ...g, progress: progressValue, completed };
        }
        return g;
      })
    );
  };

  const deleteGoal = (id: string) => {
    const g = goals.find((item) => item.id === id);
    setGoals((prev) => prev.filter((item) => item.id !== id));
    if (g) {
      addActivity(`Removed target objective: "${g.title}"`, "alert");
    }
  };

  // Calendar events CRUD
  const addEvent = (
    title: string,
    start: string,
    end: string,
    type: CalendarEvent["type"],
    priority?: CalendarEvent["priority"],
    description?: string
  ) => {
    const newEvent: CalendarEvent = {
      id: "event-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title,
      start,
      end,
      type,
      priority: priority || "medium",
      description: description || ""
    };
    setEvents((prev) => [...prev, newEvent]);
    addActivity(`Created calendar event: "${title}"`, "info");

    if (googleCalConnected) {
      syncEventToGoogle(newEvent, "create");
    }
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
    addActivity(`Rescheduled event: "${updatedEvent.title}"`, "info");

    if (googleCalConnected) {
      syncEventToGoogle(updatedEvent, "update");
    }
  };

  const deleteEvent = (id: string) => {
    const ev = events.find((item) => item.id === id);
    setEvents((prev) => prev.filter((item) => item.id !== id));
    if (ev) {
      addActivity(`Removed calendar event: "${ev.title}"`, "alert");

      if (googleCalConnected && ev) {
        syncEventToGoogle(ev, "delete");
      }
    }
  };

  // Advanced Agentic Layer Methods
  const addNotification = (
    title: string,
    message: string,
    type: SmartNotification["type"],
    priority: SmartNotification["priority"],
    contextMessage?: string
  ) => {
    const newNotif: SmartNotification = {
      id: "notif-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title,
      message,
      timestamp: "Just now",
      type,
      priority,
      read: false,
      contextMessage
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addActivity(`Smart Alert: "${title}"`, priority === "critical" || priority === "high" ? "alert" : "info");
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const earnXP = (amount: number, reason: string) => {
    setXp((prev) => {
      const nextXP = prev + amount;
      const nextLevel = Math.floor(nextXP / 1000) + 1;
      if (nextLevel > level) {
        setLevel(nextLevel);
        setCelebration({
          show: true,
          title: `🏆 Level Up! Level ${nextLevel}`,
          message: `Incredible! Your relentless consistency has propelled you to Level ${nextLevel}. Keep defeating procrastination!`
        });
      }
      return nextXP;
    });
  };

  const unlockBadge = (id: string) => {
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === id && b.unlockedAt === "locked") {
          setTimeout(() => {
            earnXP(b.xpReward, `Unlocked Badge: ${b.title}!`);
            setCelebration({
              show: true,
              title: `🛡️ Badge Unlocked: ${b.title}`,
              message: b.description,
              badge: b.icon
            });
          }, 100);
          return { ...b, unlockedAt: new Date().toISOString() };
        }
        return b;
      })
    );
  };

  const completeChallengeStep = (id: string, amount: number) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id && !c.completed) {
          const nextProgress = Math.min(c.target, c.progress + amount);
          const completed = nextProgress >= c.target;
          if (completed) {
            setTimeout(() => {
              earnXP(c.xpReward, `Completed Challenge: ${c.title}!`);
              setCelebration({
                show: true,
                title: `🎯 Challenge Completed: ${c.title}`,
                message: `You successfully finished the ${c.title} and earned ${c.reward}!`
              });
              if (c.id === "c1") unlockBadge("b1");
              if (c.id === "c2") unlockBadge("b3");
            }, 100);
          }
          return { ...c, progress: nextProgress, completed };
        }
        return c;
      })
    );
  };

  const dismissCelebration = () => {
    setCelebration(null);
  };

  const triggerManualProcrastinationCheck = async () => {
    setLoadingProcrastination(true);
    try {
      // Analyze current pending tasks
      const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date());
      const criticalTasks = tasks.filter(t => !t.completed && (t.priority === "high" || t.priority === "critical"));
      const totalPending = tasks.filter(t => !t.completed).length;

      let score = 24;
      let levelText: "Low" | "Moderate" | "High" | "Critical" = "Low";
      let avoidancePatternsList = ["Tacking micro-habits before addressing major deliverables"];

      if (overdueTasks.length > 0 || criticalTasks.length > 1) {
        score = 56;
        levelText = "High";
        avoidancePatternsList.push("Postponing study milestones under focus strain", "Completing administrative tasks over core projects");
      }
      if (overdueTasks.length > 1 || totalPending > 4) {
        score = 84;
        levelText = "Critical";
        avoidancePatternsList.push("Severe schedule drift", "Continuous postponement of high difficulty SDE preparation");
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcrastinationAnalysis({
        riskScore: score,
        level: levelText,
        delayedTasksCount: overdueTasks.length,
        postponementRate: Math.round((overdueTasks.length / Math.max(1, tasks.length)) * 100),
        avoidancePatterns: avoidancePatternsList,
        behavioralFeedback: score > 70 
          ? `Attention Raju: Critical deadlines are colliding. Your schedule is showing high vulnerability. Activate Rescue Mode now.`
          : `You are maintaining excellent focus integrity, although SDE study targets should be locked down earlier in the day.`,
        recommendedInterventions: score > 70
          ? ["Activate Deadline Rescue Mode.", "Apply the 'Eat the Frog' strategy to Trees & Graphs.", "Disable social notifications for 4 hours."]
          : ["Stack study tasks immediately after box breathing meditation.", "Reserve mornings for high difficulty tasks."]
      });

      addActivity(`Procrastination audit completed: Risk score is ${score}`, score > 50 ? "alert" : "success");
      addNotification(
        "Behavioral Audit Completed",
        `Your calculated procrastination risk is ${score}% (${levelText}). Review recommendations.`,
        "procrastination",
        score > 70 ? "critical" : (score > 50 ? "high" : "medium"),
        `Risk factor: ${score}`
      );
    } catch (e) {
      console.error("Procrastination audit failed:", e);
    } finally {
      setLoadingProcrastination(false);
    }
  };

  const triggerDeadlineRescue = async (isManual = true) => {
    setRescueModeActiveState(true);
    addActivity(`⚠️ DEADLINE RESCUE MODE ACTIVATED!`, "alert");

    // Autonomous re-arrangement of schedules: defer low priority items
    setTasks((prev) =>
      prev.map((t) => {
        if (!t.completed && (t.priority === "low" || t.priority === "medium")) {
          // Push deadline by 2 days
          const original = t.deadline ? new Date(t.deadline) : new Date();
          const pushed = new Date(original.getTime() + 86400000 * 2).toISOString();
          return { ...t, deadline: pushed, title: `[DEFERRED] ${t.title}` };
        }
        return t;
      })
    );

    // Generate detailed hour-by-hour emergency recovery plan
    const customRescuePlan = [
      { hour: "Hour 1 (Shield Up)", action: "Lock down all messaging devices. Enter deep Pomodoro space. Review critical path." },
      { hour: "Hour 2 (Primary Frog)", action: "Focus entirely on SDE Trees & Graphs DSA. Code first 2 recursion problems." },
      { hour: "Hour 3 (Career Anchor)", action: "Flesh out FAANG mock interview answers. Stretch and drink water." },
      { hour: "Hour 4 (Heavy Lift)", action: "Initiate Database Assignment subqueries. Outline table schemas." },
      { hour: "Hour 5 (Check & Submit)", action: "Compile all deliverables, verify correctness, and perform final uploads." }
    ];
    setRescuePlan(customRescuePlan);

    // Re-schedule event calendar to prioritize overdue items
    setEvents((prev) => {
      const preserved = prev.filter(e => e.priority === "critical" || e.priority === "high");
      const emergencyBlocks: CalendarEvent[] = [
        {
          id: "rescue-ev-1",
          title: "🚨 EMERGENCY FOCUS: Trees & Graphs SDE DSA",
          start: "2026-06-23T09:00:00",
          end: "2026-06-23T11:30:00",
          type: "ai_activity",
          priority: "critical",
          description: "Auto-scheduled by Deadline Guardian AI Autonomous Recovery Engine"
        },
        {
          id: "rescue-ev-2",
          title: "🚨 EMERGENCY SPRINT: Database Assignment Delivery",
          start: "2026-06-23T13:00:00",
          end: "2026-06-23T16:00:00",
          type: "project_milestone",
          priority: "critical",
          description: "High-intensity output block. Maintain lock-out."
        }
      ];
      return [...preserved, ...emergencyBlocks];
    });

    addNotification(
      "Rescue Mode Active",
      "Schedules have been autonomously re-arranged to defer light work. Follow the hour-by-hour crisis plan.",
      "rescue",
      "critical",
      "Crisis Shield Activated"
    );

    completeChallengeStep("c2", 1);
  };

  const setRescueModeActive = (active: boolean) => {
    setRescueModeActiveState(active);
    if (!active) {
      setRescuePlan(null);
      addActivity(`Deadline Rescue Mode deactivated. Schedules normalized.`, "system");
    }
  };

  const login = async (email: string, name: string): Promise<boolean> => {
    setIsAuthenticated(true);
    safeLocalStorage.setItem("dg_authenticated", "true");
    
    // Check if there is already a profile, or populate default
    const existingProfileStr = safeLocalStorage.getItem("dg_profile");
    const existingProfile = existingProfileStr ? JSON.parse(existingProfileStr) : {};

    const updatedProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      ...existingProfile,
      name: name || existingProfile.name || DEFAULT_PROFILE.name || "Raju",
      email: email,
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      avatar: existingProfile.avatar || "",
      notificationPreferences: existingProfile.notificationPreferences || { email: true, push: true, sms: false },
      accountCreationDate: existingProfile.accountCreationDate || new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      accountStatus: existingProfile.accountStatus || "Active"
    };
    
    setUserProfileState(updatedProfile);
    safeLocalStorage.setItem("dg_profile", JSON.stringify(updatedProfile));
    
    // Seed standard mock tasks/habits/goals if they were cleared completely
    const existingTasks = safeLocalStorage.getItem("dg_tasks");
    if (!existingTasks || JSON.parse(existingTasks).length === 0) {
      setTasks(DEFAULT_TASKS);
      safeLocalStorage.setItem("dg_tasks", JSON.stringify(DEFAULT_TASKS));
    }
    const existingHabits = safeLocalStorage.getItem("dg_habits");
    if (!existingHabits || JSON.parse(existingHabits).length === 0) {
      setHabits(DEFAULT_HABITS);
      safeLocalStorage.setItem("dg_habits", JSON.stringify(DEFAULT_HABITS));
    }
    const existingGoals = safeLocalStorage.getItem("dg_goals");
    if (!existingGoals || JSON.parse(existingGoals).length === 0) {
      setGoals(DEFAULT_GOALS);
      safeLocalStorage.setItem("dg_goals", JSON.stringify(DEFAULT_GOALS));
    }
    const existingEvents = safeLocalStorage.getItem("dg_events");
    if (!existingEvents || JSON.parse(existingEvents).length === 0) {
      setEvents(DEFAULT_EVENTS);
      safeLocalStorage.setItem("dg_events", JSON.stringify(DEFAULT_EVENTS));
    }
    
    addActivity(`User ${name || email} logged in successfully`, "system");
    return true;
  };

  const register = async (email: string, name: string, role: string, productivityMode: "Student" | "Job Seeker" | "Professional" | "Entrepreneur"): Promise<boolean> => {
    setIsAuthenticated(true);
    safeLocalStorage.setItem("dg_authenticated", "true");
    
    const newProfile: UserProfile = {
      name: name,
      role: role,
      email: email,
      targetHours: 8,
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      productivityMode: productivityMode,
      hasCompletedOnboarding: true,
      isAuthenticated: true,
      avatar: "",
      notificationPreferences: { email: true, push: true, sms: false },
      accountCreationDate: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      accountStatus: "Active"
    };
    
    setUserProfileState(newProfile);
    safeLocalStorage.setItem("dg_profile", JSON.stringify(newProfile));
    
    // Seed standard mock tasks/habits/goals for new registration
    setTasks(DEFAULT_TASKS);
    safeLocalStorage.setItem("dg_tasks", JSON.stringify(DEFAULT_TASKS));
    setHabits(DEFAULT_HABITS);
    safeLocalStorage.setItem("dg_habits", JSON.stringify(DEFAULT_HABITS));
    setGoals(DEFAULT_GOALS);
    safeLocalStorage.setItem("dg_goals", JSON.stringify(DEFAULT_GOALS));
    setEvents(DEFAULT_EVENTS);
    safeLocalStorage.setItem("dg_events", JSON.stringify(DEFAULT_EVENTS));
    
    addActivity(`User ${name} registered successfully as ${role}`, "system");
    return true;
  };

  // --- GOOGLE CALENDAR METHODS ---

  const connectGoogleCalendar = async (token: string) => {
    setGoogleAccessToken(token);
    setGoogleCalConnected(true);
    showToast("Google Calendar Connected", "Initializing synchronization...", "success");
    addActivity("Connected Google Calendar feed successfully", "success");
    
    // Automatically trigger initial bidirectional sync
    setTimeout(() => {
      syncNow();
    }, 500);
  };

  const disconnectGoogleCalendar = async () => {
    setGoogleAccessToken(null);
    setGoogleCalConnected(false);
    setLastSyncTime("Never");
    safeLocalStorage.setItem("dg_google_last_sync", "Never");
    safeLocalStorage.setItem("dg_google_cal_connected", "false");
    
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn("Failed to logout Google Auth state", e);
    }
    
    showToast("Disconnected", "Google Calendar disconnected.", "info");
    addActivity("Disconnected Google Calendar integration", "alert");
  };

  const handleGoogleAuthError = async () => {
    setGoogleAccessToken(null);
    setGoogleCalConnected(false);
    setLastSyncTime("Expired");
    safeLocalStorage.setItem("dg_google_last_sync", "Expired");
    safeLocalStorage.setItem("dg_google_cal_connected", "false");
    
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn("Failed to logout Google Auth state on auth error", e);
    }
    
    showToast("Session Expired", "Your Google Calendar session has expired. Please click 'Connect' to sign in again.", "alert");
    addActivity("Google Calendar session expired (401)", "alert");
  };

  const syncNow = async () => {
    const token = googleAccessToken || getAccessToken();
    if (!token) {
      console.warn("No active Google Calendar access token found in memory.");
      return;
    }

    if (!isOnline()) {
      showToast("Offline Mode", "You are currently offline. Changes are saved locally.", "alert");
      addActivity("Offline: Sync with Google Calendar suspended", "system");
      return;
    }

    try {
      // 1. Process Offline Queue first
      await processOfflineQueue(
        (msg) => showToast("Offline Sync", msg, "success"),
        (eventId, googleId) => {
          setTasks((prev) => prev.map(t => t.id === eventId ? { ...t, calendarEventId: googleId } : t));
          setEvents((prev) => prev.map(e => e.id === eventId ? { ...e, id: googleId } : e));
        }
      );

      // 2. Fetch Latest Google Calendar Events
      const gEvents = await listGoogleEvents(token);
      
      setEvents((prevEvents) => {
        let updatedEvents = [...prevEvents];

        gEvents.forEach((gEv: any) => {
          const gStart = gEv.start?.dateTime || gEv.start?.date || "";
          const gEnd = gEv.end?.dateTime || gEv.end?.date || "";
          if (!gStart || !gEnd) return;

          const isCompletedInGoogle = (gEv.summary || "").trim().startsWith("✅");
          const cleanTitle = (gEv.summary || "").replace(/^✅\s*/, "").trim();

          // Check if this event already exists locally (by matching ID or linked ID)
          const existingIdx = updatedEvents.findIndex(
            (e) => e.id === gEv.id || e.linkedId === gEv.id
          );

          if (existingIdx > -1) {
            // Local match found! Let's update start/end/title if they have drifted
            const localEv = updatedEvents[existingIdx];
            if (
              localEv.title !== gEv.summary ||
              localEv.start !== gStart ||
              localEv.end !== gEnd
            ) {
              updatedEvents[existingIdx] = {
                ...localEv,
                title: gEv.summary,
                start: gStart,
                end: gEnd,
                description: gEv.description || localEv.description || "",
              };
            }

            // Sync Task Completion
            if (localEv.linkedId) {
              setTasks((prevTasks) =>
                prevTasks.map((t) => {
                  if (t.id === localEv.linkedId && t.completed !== isCompletedInGoogle) {
                    return { ...t, completed: isCompletedInGoogle };
                  }
                  return t;
                })
              );
            }
          } else {
            // New event from Google! Check for time conflict first
            const conflicts = detectTimeConflicts(gStart, gEnd, updatedEvents);
            if (conflicts.length > 0) {
              addNotification(
                "⚠ Time Conflict Detected",
                `"${cleanTitle}" from Google Calendar overlaps with existing items on your schedule.`,
                "task_alert",
                "high",
                `Conflict count: ${conflicts.length}`
              );
            }

            // Import as personal calendar event
            updatedEvents.push({
              id: gEv.id,
              title: gEv.summary,
              start: gStart,
              end: gEnd,
              type: "personal_event",
              priority: "medium",
              description: gEv.description || "",
            });

            // If summary contains task indicators, auto-create a task
            const isTodoStr = (gEv.summary || "").toLowerCase();
            if (isTodoStr.includes("todo:") || isTodoStr.includes("task:") || isTodoStr.includes("guardian:")) {
              setTasks((prevTasks) => {
                if (prevTasks.some((t) => t.calendarEventId === gEv.id)) return prevTasks;
                return [
                  {
                    id: "task-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
                    title: cleanTitle.replace(/^(todo|task|guardian):\s*/i, ""),
                    completed: isCompletedInGoogle,
                    deadline: gEnd,
                    priority: "medium",
                    category: "Personal",
                    difficulty: "medium",
                    estimatedHours: 1,
                    calendarEventId: gEv.id,
                  },
                  ...prevTasks,
                ];
              });
            }
          }
        });

        return updatedEvents;
      });

      // 3. Sync local tasks/events UP to Google if missing
      // We will handle tasks with a check in an awaited loop
      for (const task of tasks) {
        if (!task.calendarEventId && task.title) {
          const { startIso: finalStartIso, endIso: finalEndIso } = getValidStartEndISO(
            task.startTime || task.deadline,
            task.endTime,
            task.estimatedHours || 1
          );

          const googleEv: GoogleCalendarEvent = {
            summary: (task.completed ? "✅ " : "") + task.title,
            description: task.description || `Guardian Task in category ${task.category}`,
            start: { dateTime: finalStartIso },
            end: { dateTime: finalEndIso },
            colorId: getGoogleColorId(task.category),
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: getReminderMinutes(defaultReminderOption) },
              ],
            },
          };

          try {
            const res = await createGoogleEventAPI(googleEv, token);
            if (res?.id) {
              setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, calendarEventId: res.id } : t))
              );
              setEvents((prev) => [
                ...prev,
                {
                  id: res.id,
                  title: googleEv.summary,
                  start: finalStartIso,
                  end: finalEndIso,
                  type: "task",
                  linkedId: task.id,
                  priority: task.priority,
                  description: task.description,
                },
              ]);
            }
          } catch (e) {
            console.error("Failed to sync local task up to Google Calendar", e);
            const errMsg = String(e?.message || e).toLowerCase();
            const is401 = errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid authentication credentials");
            if (is401) {
              await handleGoogleAuthError();
              return; // abort sync completely on auth error
            }
            const isRetryable = (error: any): boolean => {
              const msg = String(error?.message || error).toLowerCase();
              return !(
                msg.includes("404") ||
                msg.includes("notfound") ||
                msg.includes("400") ||
                msg.includes("timerangeempty") ||
                msg.includes("403") ||
                msg.includes("forbidden")
              );
            };
            if (isRetryable(e)) {
              addToOfflineQueue(task.id, "create", googleEv);
            }
          }
        }
      }

      // Update sync timestamp
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " " + new Date().toLocaleDateString([], { month: "short", day: "numeric" });
      setLastSyncTime(nowStr);
      safeLocalStorage.setItem("dg_google_last_sync", nowStr);
      showToast("Synchronized", "Bidirectional sync with Google Calendar completed!", "success");
      addActivity("Synchronized with Google Calendar successfully", "success");
    } catch (e) {
      console.error("Sync now error:", e);
      const errStr = String(e?.message || e).toLowerCase();
      if (errStr.includes("401") || errStr.includes("unauthorized") || errStr.includes("invalid authentication credentials")) {
        await handleGoogleAuthError();
      } else {
        showToast("Sync Failed", "Could not complete bidirectional synchronization with Google Calendar.", "alert");
      }
    }
  };

  // Auth Initialization Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleAccessToken(token);
        setGoogleCalConnected(true);
      },
      () => {
        // Silent fail/local session only
      }
    );
    return () => unsubscribe();
  }, []);

  // Background polling for Google Calendar updates
  useEffect(() => {
    if (googleCalConnected) {
      const interval = setInterval(() => {
        syncNow();
      }, syncFrequencyMinutes * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [googleCalConnected, googleAccessToken, syncFrequencyMinutes]);

  // Online connection recovery listener
  useEffect(() => {
    const handleOnline = () => {
      if (googleCalConnected) {
        showToast("Connected", "Internet connection restored. Synchronizing...", "success");
        syncNow();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [googleCalConnected, googleAccessToken]);

  // --- UNIFIED CALENDAR SYNCHRONIZATION ENGINE ---
  useEffect(() => {
    let changed = false;
    let updatedEvents = [...events];

    // 1. Handle Deletions: Remove events linked to tasks that no longer exist
    const activeTaskIds = new Set(tasks.map((t) => t.id));
    const eventsToKeep = updatedEvents.filter((ev) => {
      if (ev.linkedId && ev.linkedId.startsWith("task-") && !activeTaskIds.has(ev.linkedId)) {
        changed = true;
        // If Google Calendar is connected and this event has a google ID, delete it there
        if (googleCalConnected && ev.id && !ev.id.startsWith("event-task-") && !ev.id.startsWith("pending-sync-")) {
          const token = googleAccessToken || getAccessToken();
          if (token && isOnline()) {
            deleteGoogleEventAPI(ev.id, token).catch((e) => {
              console.error("Failed to delete Google Calendar event on task deletion:", e);
              const errMsg = String(e?.message || e).toLowerCase();
              if (errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid authentication credentials")) {
                handleGoogleAuthError();
              } else {
                showToast("⚠ Unable to sync with Google Calendar.", "Your task has been safely saved locally.", "alert");
              }
            });
          } else {
            addToOfflineQueue(ev.id, "delete", null);
          }
        }
        return false;
      }
      return true;
    });
    updatedEvents = eventsToKeep;

    // 2. Handle Additions and Updates for active tasks with deadlines/dates
    tasks.forEach((task) => {
      if (!task.title) return;
      const startCandidate = task.startTime || task.deadline;
      if (!startCandidate) return; // Ignore tasks without date/deadline

      const { startIso: finalStartIso, endIso: finalEndIso } = getValidStartEndISO(
        startCandidate,
        task.endTime,
        task.estimatedHours || 1
      );
      const expectedTitle = (task.completed ? "✅ " : "") + task.title;

      // Find if there's an existing calendar event for this task
      const existingIdx = updatedEvents.findIndex((ev) => ev.linkedId === task.id);

      if (existingIdx >= 0) {
        const ev = updatedEvents[existingIdx];
        const hasTimeOrTitleChanged = ev.title !== expectedTitle || ev.start !== finalStartIso || ev.end !== finalEndIso || ev.priority !== task.priority;

        if (hasTimeOrTitleChanged) {
          changed = true;
          updatedEvents[existingIdx] = {
            ...ev,
            title: expectedTitle,
            start: finalStartIso,
            end: finalEndIso,
            priority: task.priority,
            description: task.description || ev.description
          };

          // If Google Calendar is connected and we have a valid calendarEventId, update it in Google Calendar too
          const cleanEventId = getCleanGoogleEventId(task.calendarEventId);
          if (googleCalConnected && cleanEventId) {
            const token = googleAccessToken || getAccessToken();
            const googleEv: GoogleCalendarEvent = {
              summary: expectedTitle,
              description: task.description || `Guardian Task in category ${task.category}`,
              start: { dateTime: finalStartIso },
              end: { dateTime: finalEndIso },
              colorId: getGoogleColorId(task.category),
            };
            if (token && isOnline()) {
              updateGoogleEventAPI(cleanEventId, googleEv, token).catch((e) => {
                console.error("Failed to update Google Calendar event:", e);
                const errMsg = String(e?.message || e).toLowerCase();
                const is401 = errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid authentication credentials");
                if (is401) {
                  handleGoogleAuthError();
                  return;
                }
                const isRetryable = (error: any): boolean => {
                  const msg = String(error?.message || error).toLowerCase();
                  return !(
                    msg.includes("404") ||
                    msg.includes("notfound") ||
                    msg.includes("400") ||
                    msg.includes("timerangeempty") ||
                    msg.includes("403") ||
                    msg.includes("forbidden")
                  );
                };
                if (isRetryable(e)) {
                  addToOfflineQueue(cleanEventId, "update", googleEv);
                } else {
                  const errMsg = String(e?.message || e).toLowerCase();
                  if (errMsg.includes("404") || errMsg.includes("notfound")) {
                    setTasks((prev) =>
                      prev.map((t) => (t.calendarEventId === cleanEventId || t.id === task.id ? { ...t, calendarEventId: undefined } : t))
                    );
                    setEvents((prev) => prev.filter((ev) => ev.id !== cleanEventId && ev.linkedId !== task.id));
                  }
                }
                showToast("⚠ Unable to sync with Google Calendar.", "Your task has been safely saved locally.", "alert");
              });
            } else {
              addToOfflineQueue(cleanEventId, "update", googleEv);
            }
          }
        }
      } else {
        // Create new internal calendar event
        changed = true;
        const cleanEventId = getCleanGoogleEventId(task.calendarEventId);
        const eventId = cleanEventId || "event-task-" + task.id;
        updatedEvents.push({
          id: eventId,
          title: expectedTitle,
          start: finalStartIso,
          end: finalEndIso,
          type: "task",
          linkedId: task.id,
          priority: task.priority,
          description: task.description
        });

        // If Google Calendar is connected, sync creation
        if (googleCalConnected && !cleanEventId) {
          if (inFlightSyncs.current.has(task.id)) {
            return;
          }
          inFlightSyncs.current.add(task.id);

          const token = googleAccessToken || getAccessToken();
          const googleEv: GoogleCalendarEvent = {
            summary: expectedTitle,
            description: task.description || `Guardian Task in category ${task.category}`,
            start: { dateTime: finalStartIso },
            end: { dateTime: finalEndIso },
            colorId: getGoogleColorId(task.category),
          };

          if (token && isOnline()) {
            createGoogleEventAPI(googleEv, token).then((res) => {
              inFlightSyncs.current.delete(task.id);
              if (res?.id) {
                setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, calendarEventId: res.id } : t));
                setEvents((prev) => prev.map((e) => e.linkedId === task.id ? { ...e, id: res.id } : e));
                showToast("☁ Google Calendar synchronized", `"${task.title}" has been synced.`, "success");
              }
            }).catch((err) => {
              inFlightSyncs.current.delete(task.id);
              console.error("Failed to create Google Calendar event:", err);
              const errMsg = String(err?.message || err).toLowerCase();
              const is401 = errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid authentication credentials");
              if (is401) {
                handleGoogleAuthError();
                return;
              }
              const isRetryable = (error: any): boolean => {
                const msg = String(error?.message || error).toLowerCase();
                return !(
                  msg.includes("404") ||
                  msg.includes("notfound") ||
                  msg.includes("400") ||
                  msg.includes("timerangeempty") ||
                  msg.includes("403") ||
                  msg.includes("forbidden")
                );
              };
              if (isRetryable(err)) {
                addToOfflineQueue(task.id, "create", googleEv);
              }
              showToast("⚠ Unable to sync with Google Calendar.", "Your task has been safely saved locally.", "alert");
            });
          } else {
            addToOfflineQueue(task.id, "create", googleEv);
            inFlightSyncs.current.delete(task.id);
          }
        }
      }
    });

    if (changed) {
      setEvents(updatedEvents);
    }
  }, [tasks, googleCalConnected, googleAccessToken, defaultReminderOption]);

  const logout = () => {
    setIsAuthenticated(false);
    safeLocalStorage.setItem("dg_authenticated", "false");
    
    // Clear user-specific data from local storage
    const keysToRemove = [
      "dg_profile", "dg_events", "dg_tasks", "dg_habits", "dg_goals", 
      "dg_activities", "dg_briefing", "dg_analytics", "dg_notifications", 
      "dg_xp", "dg_level", "dg_badges", "dg_challenges", "dg_rescue_active", 
      "dg_rescue_plan", "dg_procrastination_analysis"
    ];
    keysToRemove.forEach(key => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn(`[SafeStorage] Access denied deleting key: ${key}`, e);
      }
    });
    
    // Reset React state
    setUserProfileState({
      name: "",
      role: "",
      targetHours: 8,
      workDays: [],
      hasCompletedOnboarding: false,
      isAuthenticated: false,
      avatar: "",
      email: "",
      notificationPreferences: { email: true, push: true, sms: false },
      accountCreationDate: "",
      accountStatus: ""
    });
    setTasks([]);
    setHabits([]);
    setGoals([]);
    setEvents([]);
    setActivities([]);
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        analyticsData,
        loadingAnalytics,
        regenerateAnalytics,
        userProfile,
        setUserProfile,
        tasks,
        setTasks,
        habits,
        setHabits,
        goals,
        setGoals,
        activities,
        setActivities,
        briefing,
        setBriefing,
        theme,
        toggleTheme,
        activePage,
        setActivePage,
        loadingBriefing,
        regenerateBriefing,
        addTask,
        addCustomTask,
        toggleTask,
        updateTask,
        deleteTask,
        addHabit,
        completeHabit,
        deleteHabit,
        addGoal,
        updateGoalProgress,
        deleteGoal,
        addActivity,
        events,
        setEvents,
        addEvent,
        updateEvent,
        deleteEvent,

        // Advanced Agentic Layer
        notifications,
        setNotifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        xp,
        level,
        badges,
        challenges,
        earnXP,
        unlockBadge,
        completeChallengeStep,
        celebration,
        dismissCelebration,
        procrastinationAnalysis,
        loadingProcrastination,
        triggerManualProcrastinationCheck,
        rescueModeActive,
        rescuePlan,
        triggerDeadlineRescue,
        setRescueModeActive,
        isAuthenticated,
        login,
        logout,
        register,

        // Planner State Synchronization
        plannerData,
        setPlannerData,
        isPlannerSynced,
        setIsPlannerSynced,
        syncPlannerToWorkspace,

        // Google Calendar Integration
        googleCalConnected,
        setGoogleCalConnected,
        googleAccessToken,
        lastSyncTime,
        defaultReminderOption,
        setDefaultReminderOption,
        defaultCalendarName,
        setDefaultCalendarName,
        syncFrequencyMinutes,
        setSyncFrequencyMinutes,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncNow,

        // Toasts
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside the AppProvider");
  return context;
};
