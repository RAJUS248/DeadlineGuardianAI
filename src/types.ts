export interface UserProfile {
  name: string;
  role: string;
  targetHours: number;
  workDays: string[];
  productivityMode?: "Student" | "Job Seeker" | "Professional" | "Entrepreneur";
  hasCompletedOnboarding?: boolean;
  email?: string;
  avatar?: string;
  notificationPreferences?: { email: boolean; push: boolean; sms: boolean };
  accountCreationDate?: string;
  accountStatus?: string;
  isAuthenticated?: boolean;
  onboardingAnswers?: {
    whoAreYou?: string;
    goals?: string;
    priorities?: string;
    deadlines?: string;
    primaryGoal?: string;
    preparingFor?: string;
    productiveHours?: string;
    importantSkills?: string;
    deadlinesOrGoals?: string;
  };
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  deadline: string; // ISO date or plain string
  priority: "low" | "medium" | "high" | "critical";
  category: "Work" | "Study" | "Health" | "Personal" | "Finance" | "Education" | "Interview Preparation" | "Coding Practice" | "Projects" | "Career";
  difficulty: "easy" | "medium" | "hard";
  estimatedHours: number;
  description?: string;
  tags?: string[];
  recurringSchedule?: string;
  dependencies?: string;
  relatedGoals?: string;
  suggestedTimeBlocks?: string[];
  subtasks?: string[];
  subtaskCompletion?: boolean[];
  aiStatus?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  calendarEventId?: string;
  isDashboardReference?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  streak: number;
  longestStreak?: number;
  lastCompleted: string | null; // ISO Date string
  totalCompletions: number;
  timeOfDay: string; // e.g. "Morning", "Afternoon", "Evening"
  completionHistory?: string[]; // YYYY-MM-DD strings
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetDate: string;
  priority?: "low" | "medium" | "high" | "critical";
  progress: number; // 0 to 100
  completed: boolean;
  milestones?: GoalMilestone[];
  status?: "Healthy" | "At Risk" | "Critical";
  completionProbability?: number;
  estimatedCompletionDate?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string (YYYY-MM-DDTHH:mm:ss) or plain date YYYY-MM-DD
  end: string;
  type: "task" | "meeting" | "study_session" | "project_milestone" | "personal_event" | "habit" | "ai_activity";
  linkedId?: string;
  priority?: "low" | "medium" | "high" | "critical";
  description?: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string; // timestamp display
  type: "success" | "alert" | "info" | "habit" | "system";
}

export interface AIBriefing {
  greeting: string;
  analysis: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  criticalRisks: string[];
  recommendedFocus: string;
  hourlyActionPlan: {
    time: string;
    task: string;
    active: boolean;
  }[];
  motivationalQuote: string;
}

export interface ProductivityAnalytics {
  healthScore: number;
  components: {
    taskCompletion: number;
    deadlineManagement: number;
    goalProgress: number;
    habitConsistency: number;
    focusPerformance: number;
    scheduleAdherence: number;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    missedDeadlines: number;
    completionRate: number;
    focusScore: number;
    consistencyScore: number;
    goalProgressScore: number;
    habitPerformanceScore: number;
    weeklyRating: string;
    monthlyRating: string;
    deepWorkHours: number;
    interruptions: number;
    productivityPeaks: string;
  };
  timeAllocation: {
    coding: number;
    studying: number;
    working: number;
    goals: number;
    waste: number;
  };
  bestPeriods: {
    mostProductiveHour: string;
    mostProductiveDay: string;
    bestStudyPeriod: string;
    bestCodingPeriod: string;
  };
  predictions: {
    tasksAtRisk: { title: string; risk: "low" | "medium" | "high"; reason: string }[];
    overloadedDays: string[];
    schedulingConflicts: string[];
    burnoutRiskScore: "Low" | "Moderate" | "High" | "Critical";
    burnoutFactors: string[];
    recommendations: string[];
  };
  goalForecasts: {
    goalTitle: string;
    likelihood: number;
    forecastDate: string;
    insights: string;
  }[];
  aiInsights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    scheduleImprovements: string;
    goalAdjustments: string;
    habitSuggestions: string;
    priorityRecommendations: string;
  };
  weeklySummary: {
    wins: string[];
    challenges: string[];
    trends: string;
    recommendations: string[];
  };
  monthlyReview: {
    goalProgress: string;
    habitProgress: string;
    healthTrends: string;
    recommendations: string[];
  };
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO or human readable
  type: "procrastination" | "rescue" | "achievement" | "streak" | "task_alert" | "system";
  priority: "critical" | "high" | "medium" | "low";
  read: boolean;
  actionLink?: string;
  contextMessage?: string; // custom context e.g. "Completing this keeps score > 85"
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  unlockedAt: string; // ISO date or "locked"
  icon: string; // Name of Lucide icon to render
  category: "tasks" | "habits" | "rescue" | "goals" | "streaks";
  xpReward: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "7 Days", "24 Hours"
  reward: string; // e.g. "500 XP + Focus Shield Badge"
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
  category: "focus" | "anti-procrastination" | "habit-stack" | "deadline-clear";
}

export interface ProcrastinationAnalysis {
  riskScore: number; // 0 - 100
  level: "Low" | "Moderate" | "High" | "Critical";
  delayedTasksCount: number;
  postponementRate: number; // e.g. percentage of tasks postponed
  avoidancePatterns: string[];
  behavioralFeedback: string;
  recommendedInterventions: string[];
}



