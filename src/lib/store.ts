import { UserProfile, Task, Habit, Goal, ActivityLog, AIBriefing, CalendarEvent, ProductivityAnalytics } from "../types";

// Seed Initial Data for Demo/Startup Pitch Grade Presentation
export const DEFAULT_PROFILE: UserProfile = {
  name: "Raju",
  role: "SDE Aspirant & Computer Science Student",
  targetHours: 8,
  workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "DSA Revision: Trees & Graph Traversals",
    completed: false,
    deadline: "2026-06-23T16:00:00.000Z", // Due today!
    priority: "high",
    category: "Study",
    difficulty: "hard",
    estimatedHours: 3,
  },
  {
    id: "task-2",
    title: "Prepare for FAANG Mock Interview Session",
    completed: false,
    deadline: "2026-06-23T18:00:00.000Z", // Due today!
    priority: "high",
    category: "Work",
    difficulty: "medium",
    estimatedHours: 2,
  },
  {
    id: "task-3",
    title: "Database System Assignment Submission",
    completed: false,
    deadline: "2026-06-24T23:59:00.000Z", // Tomorrow
    priority: "high",
    category: "Study",
    difficulty: "hard",
    estimatedHours: 4,
  },
  {
    id: "task-4",
    title: "Apply to Stripe & Vercel SDE Internships",
    completed: false,
    deadline: "2026-06-25T12:00:00.000Z",
    priority: "medium",
    category: "Personal",
    difficulty: "easy",
    estimatedHours: 1,
  },
  {
    id: "task-5",
    title: "LeetCode Daily Challenge: Dynamic Programming",
    completed: true,
    deadline: "2026-06-23T06:00:00.000Z",
    priority: "low",
    category: "Study",
    difficulty: "medium",
    estimatedHours: 1.5,
  },
];

export const DEFAULT_HABITS: Habit[] = [
  {
    id: "habit-1",
    title: "Code 2 LeetCode Problems",
    frequency: "Daily",
    streak: 12,
    lastCompleted: "2026-06-22T20:00:00.000Z",
    totalCompletions: 48,
    timeOfDay: "Morning",
  },
  {
    id: "habit-2",
    title: "5 Minutes Deep Breathing & Box Meditation",
    frequency: "Daily",
    streak: 5,
    lastCompleted: "2026-06-23T07:15:00.000Z",
    totalCompletions: 14,
    timeOfDay: "Morning",
  },
  {
    id: "habit-3",
    title: "Review Design Pattern Cards",
    frequency: "Daily",
    streak: 2,
    lastCompleted: null,
    totalCompletions: 6,
    timeOfDay: "Evening",
  },
];

export const DEFAULT_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Land a Software Engineer Offer",
    category: "Career",
    targetDate: "2026-09-01",
    progress: 65,
    completed: false,
  },
  {
    id: "goal-2",
    title: "Achieve 500 LeetCode Solved Milestone",
    category: "Coding",
    targetDate: "2026-07-30",
    progress: 88,
    completed: false,
  },
  {
    id: "goal-3",
    title: "Perfect Personal Portfolio Webpage",
    category: "Personal",
    targetDate: "2026-06-30",
    progress: 40,
    completed: false,
  },
];

export const DEFAULT_ACTIVITIES: ActivityLog[] = [
  {
    id: "act-1",
    message: "Completed Daily Meditation Habit stack",
    timestamp: "10 mins ago",
    type: "habit",
  },
  {
    id: "act-2",
    message: "Completed LeetCode Daily Challenge",
    timestamp: "2 hours ago",
    type: "success",
  },
  {
    id: "act-3",
    message: "Critical Risk Detected: Tree DSA deadline due in 8 hours",
    timestamp: "3 hours ago",
    type: "alert",
  },
  {
    id: "act-4",
    message: "System calibrated. Habit streaks recovered.",
    timestamp: "Today morning",
    type: "system",
  },
];

export const DEFAULT_BRIEFING: AIBriefing = {
  greeting: "Good Morning Raju.",
  analysis: "You have 2 urgent tasks, 1 interview preparation session, and 1 assignment deadline approaching rapidly. Your overall productivity pace is on track, but trees revision has zero focus hours recorded yet. Let's map a strict time pocket.",
  urgencyLevel: "high",
  criticalRisks: [
    "Trees & Graph DSA revision remains uncompleted and is due before 4 PM today.",
    "Database Assignment is sizeable (estimated 4 hrs) with tomorrow's deadline.",
  ],
  recommendedFocus: "Complete DSA revision before 4 PM.",
  hourlyActionPlan: [
    { time: "09:00 AM", task: "Admin, Planning & Guard Review", active: false },
    { time: "10:30 AM", task: "DSA Revision: Trees & Graph Traversals", active: true },
    { time: "02:00 PM", task: "Prepare Mock Interview Session", active: false },
    { time: "04:30 PM", task: "Database Systems Work Sprint", active: false },
  ],
  motivationalQuote: "A deadline is the ultimate inspiration. Safeguard your day with precision focus!",
};

// State fetching functions to proxy through backend server
export async function fetchAIBriefing(
  userProfile: UserProfile,
  tasks: Task[],
  habits: Habit[],
  goals: Goal[]
): Promise<AIBriefing> {
  try {
    const response = await fetch("/api/ai/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProfile, tasks, habits, goals }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("Failed to query AI briefing endpoint:", error);
    return DEFAULT_BRIEFING;
  }
}

export async function fetchAIAnalytics(
  userProfile: UserProfile,
  tasks: Task[],
  habits: Habit[],
  goals: Goal[],
  events: CalendarEvent[]
): Promise<ProductivityAnalytics> {
  try {
    const response = await fetch("/api/ai/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProfile, tasks, habits, goals, events }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("Failed to query AI analytics endpoint, returning local calculations:", error);
    // Dynamic local fallback if server cannot be reached
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 80;
    const healthScore = Math.round(completionRate * 0.8 + 15);
    
    return {
      healthScore,
      components: {
        taskCompletion: completionRate,
        deadlineManagement: 85,
        goalProgress: 75,
        habitConsistency: 80,
        focusPerformance: 85,
        scheduleAdherence: 80
      },
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks: 0,
        highPriorityTasks: tasks.filter(t => !t.completed && t.priority === "high").length,
        missedDeadlines: 0,
        completionRate,
        focusScore: 85,
        consistencyScore: 80,
        goalProgressScore: 75,
        habitPerformanceScore: 80,
        weeklyRating: `Good (${healthScore}/100)`,
        monthlyRating: `Good (${Math.max(40, healthScore - 5)}/100)`,
        deepWorkHours: 6.5,
        interruptions: 1,
        productivityPeaks: "09:00 AM - 11:30 AM"
      },
      timeAllocation: { coding: 6, studying: 5, working: 4, goals: 3, waste: 2 },
      bestPeriods: {
        mostProductiveHour: "10:00 AM",
        mostProductiveDay: "Wednesday",
        bestStudyPeriod: "Morning focus block",
        bestCodingPeriod: "Afternoon deep sprint"
      },
      predictions: {
        tasksAtRisk: [],
        overloadedDays: ["Tuesday"],
        schedulingConflicts: [],
        burnoutRiskScore: "Low",
        burnoutFactors: ["High density of high-priority tasks"],
        recommendations: ["Maintain active breaks between coding blocks"]
      },
      goalForecasts: goals.map(g => ({
        goalTitle: g.title,
        likelihood: Math.min(99, Math.max(10, g.progress + 10)),
        forecastDate: g.targetDate || "2026-09-01",
        insights: "Stable trajectory"
      })),
      aiInsights: {
        strengths: ["Great morning routines"],
        weaknesses: ["Afternoon energy slumps"],
        recommendations: ["Take walking breaks"],
        scheduleImprovements: "Shift coding to mornings",
        goalAdjustments: "Accelerate milestones",
        habitSuggestions: "Meditation stacking",
        priorityRecommendations: "Finish high priority studies first"
      },
      weeklySummary: { wins: [], challenges: [], trends: "Improving", recommendations: [] },
      monthlyReview: { goalProgress: "Steady", habitProgress: "Excellent", healthTrends: "Upward", recommendations: [] }
    };
  }
}

export async function fetchAICoach(
  messages: { role: string; content: string }[],
  userInput: string,
  context: { userProfile: UserProfile; tasks: Task[]; habits: Habit[]; goals: Goal[] }
): Promise<{ response: string; actionSuggestions: string[] }> {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, userInput, context }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("Failed to query AI Chat endpoint:", error);
    return {
      response: `### 🛡️ Guardian Offline Mode\n\nI was unable to establish connection with the AI core backend. Let's review standard advice:\n\n- Take immediate action on high priority work.\n- Use the **Pomodoro** structure to maximize focus.\n- Establish defensive planning by placing safety buffers.`,
      actionSuggestions: ["Set urgent deadlines", "Audit today's schedule", "Generate plan"]
    };
  }
}

export interface AIParseTaskResponse {
  task: {
    title: string;
    description: string;
    category: "Work" | "Study" | "Health" | "Personal" | "Finance" | "Education" | "Interview Preparation" | "Coding Practice" | "Projects" | "Career";
    priority: "low" | "medium" | "high" | "critical";
    difficulty: "easy" | "medium" | "hard";
    estimatedHours: number;
    deadlineDaysFromNow: number;
    deadlineISO?: string;
    startTimeISO?: string;
    endTimeISO?: string;
    tags: string[];
    recurringSchedule: string;
    dependencies: string;
    relatedGoals: string;
    suggestedTimeBlocks: string[];
    subtasks: string[];
  };
  isMissingCriticalInfo: boolean;
  followUpQuestion: string;
  assistantReply: string;
}

export interface GeneratedPlannerResult {
  focusRecommendation: string;
  timeBlocks: {
    timeRange: string;
    focus: string;
    category: string;
  }[];
  milestones: string[];
  deadlinesRescue: {
    hour: string;
    action: string;
  }[];
  workloadOptimizationAdvice: string;
}

export async function fetchAIParseTask(userInput: string, currentLocalTime?: string): Promise<AIParseTaskResponse> {
  try {
    const response = await fetch("/api/ai/parse-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput, currentLocalTime }),
    });
    if (!response.ok) throw new Error("Server error parsing task");
    return await response.json();
  } catch (err) {
    console.error("fetchAIParseTask failed:", err);
    return {
      task: {
        title: userInput.substring(0, 50),
        description: `Drafted from prompt: "${userInput}"`,
        category: "Projects",
        priority: "high",
        difficulty: "medium",
        estimatedHours: 2,
        deadlineDaysFromNow: 2,
        tags: ["#task"],
        recurringSchedule: "None",
        dependencies: "None",
        relatedGoals: "None",
        suggestedTimeBlocks: ["9:00 AM - 11:00 AM Tomorrow"],
        subtasks: ["Initial Prep", "Execution", "Completion Checks"]
      },
      isMissingCriticalInfo: false,
      followUpQuestion: "",
      assistantReply: "Offline Mode: Drafted task from your input."
    };
  }
}

export async function fetchAIGeneratePlanner(
  type: string,
  query: string,
  context: { tasks: Task[]; goals: Goal[] }
): Promise<GeneratedPlannerResult> {
  try {
    const response = await fetch("/api/ai/generate-planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, query, context }),
    });
    if (!response.ok) throw new Error("Planner response invalid");
    return await response.json();
  } catch (err) {
    console.error("fetchAIGeneratePlanner failed, returning fallback:", err);
    return {
      focusRecommendation: "Dedicate continuous focus cycles of 90 minutes. Buffer array/tree preparation tasks first.",
      timeBlocks: [
        { timeRange: "09:00 AM - 11:30 AM", focus: "In-depth practice on high priority algorithm traversal questions", category: "Coding Practice" },
        { timeRange: "02:00 PM - 04:30 PM", focus: "Develop client-side components & connect reactive state variables", category: "Projects" },
        { timeRange: "05:00 PM - 06:15 PM", focus: "Refined review of critical HR questionnaires", category: "Interview Preparation" }
      ],
      milestones: [
        "Day 1-2: Set up repository template and finish essential study prep on Arrays/Hashes",
        "Day 3-4: Build basic logic, handle edge cases, and run sample interview sets",
        "Day 5-6: Run performance analysis, complete clean database migrations",
        "Day 7: Full clean rehearsal and comprehensive project submission checks"
      ],
      deadlinesRescue: [
        { hour: "Hour 1", action: "Perform setup, outline dependencies and finalize high leverage goals" },
        { hour: "Hour 2-3", action: "Execute primary implementation, write tests and cover critical blocks" },
        { hour: "Hour 4", action: "Confirm formatting, handle potential edge cases and fix warnings" },
        { hour: "Hour 5", action: "Complete final submission, record validation state and report success" }
      ],
      workloadOptimizationAdvice: "You have several pending deadlines approaching. Focus exclusively on critical difficulty brackets and postpone low-priority goals to prevent workload overload."
    };
  }
}

export const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: "event-1",
    title: "DSA Practice: Solve Tree Traversals",
    start: "2026-06-23T09:00:00",
    end: "2026-06-23T11:00:00",
    type: "study_session",
    priority: "high",
    description: "Focus on DFS and BFS tree traversal patterns."
  },
  {
    id: "event-2",
    title: "React Architecture Refactoring Sprint",
    start: "2026-06-23T11:30:00",
    end: "2026-06-23T12:30:00",
    type: "task",
    priority: "medium",
    description: "Re-organize component tree into modular files."
  },
  {
    id: "event-3",
    title: "Mock Interview & Resume Critique Session",
    start: "2026-06-23T14:00:00",
    end: "2026-06-23T15:00:00",
    type: "meeting",
    priority: "high",
    description: "Rehearse with peer and refine projects details."
  },
  {
    id: "event-4",
    title: "Database Assignment Submission Window",
    start: "2026-06-24T10:00:00",
    end: "2026-06-24T12:00:00",
    type: "project_milestone",
    priority: "critical",
    description: "Finalize subqueries and export migration queries."
  },
  {
    id: "event-5",
    title: "Morning Box Breathing Meditation",
    start: "2026-06-23T08:00:00",
    end: "2026-06-23T08:15:00",
    type: "habit",
    priority: "low",
    description: "Calm mind before coding blocks."
  },
  {
    id: "event-6",
    title: "Personal Portfolio Milestone Review",
    start: "2026-06-25T15:00:00",
    end: "2026-06-25T16:30:00",
    type: "project_milestone",
    priority: "medium",
    description: "Verify CSS borders and layout responsive fluidity."
  }
];


