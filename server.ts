import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize Gemini SDK with lazy check to prevent crashing on startup without key.
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("► Deadline Guardian AI Server: Gemini SDK Initialized successfully.");
  } catch (error) {
    console.error("► Deadline Guardian AI Server: Failed to initialize Gemini SDK:", error);
  }
} else {
  console.warn("► Deadline Guardian AI Server: GEMINI_API_KEY is not configured or placeholder. Running in fallback mode.");
}

function logApiWarning(context: string, error: any) {
  const errMsg = error?.message || String(error);
  if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("demand")) {
    console.warn(`► [API NOTICE] ${context} temporarily unavailable due to high model demand (503). Using smooth local fallback.`);
  } else if (errMsg.includes("429") || errMsg.includes("Quota") || errMsg.includes("exhausted")) {
    console.warn(`► [API NOTICE] ${context} rate limit exceeded (429). Using smooth local fallback.`);
  } else {
    console.warn(`► [API NOTICE] ${context} encountered an API exception:`, errMsg);
  }
}

// ---------------------- API ROUTES ----------------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!ai, timestamp: new Date() });
});

// Post endpoint for generating AI briefing
app.post("/api/ai/briefing", async (req, res) => {
  const { userProfile, tasks, habits, goals } = req.body;

  // Format inputs for clean prompt engineering
  const name = userProfile?.name || "Raju";
  const role = userProfile?.role || "Student / Professional";
  const focusTime = userProfile?.targetHours || "8";
  
  const tasksStr = Array.isArray(tasks) && tasks.length > 0
    ? tasks.map(t => `- [${t.completed ? "x" : " "}] ${t.title} | Deadline: ${t.deadline || "No deadline"} | Priority: ${t.priority} | Category: ${t.category}`).join("\n")
    : "No active tasks.";

  const habitsStr = Array.isArray(habits) && habits.length > 0
    ? habits.map(h => `- ${h.title} | Day Streak: ${h.streak || 0} | Frequency: ${h.frequency || "Daily"}`).join("\n")
    : "No tracking habits.";

  const goalsStr = Array.isArray(goals) && goals.length > 0
    ? goals.map(g => `- ${g.title} | Target Date: ${g.targetDate || "No target date"} | Progress: ${g.progress || 0}%`).join("\n")
    : "No active long-term goals.";

  const prompt = `
    You are Deadline Guardian AI, a premium productivity coach and schedule optimizer.
    Analyze the user's workload, upcoming deadlines, habits, and goals. Generate a highly personalized briefing.
    
    User Profile:
    - Name: ${name}
    - Role: ${role}
    - Daily Target Focus Hours: ${focusTime} hrs
    - Active Productivity Mode: ${userProfile?.productivityMode || "Student"}
    - Onboarding Priorities Questionnaire: ${JSON.stringify(userProfile?.onboardingAnswers || {})}

    Active Tasks List:
    ${tasksStr}

    Daily Habits List:
    ${habitsStr}

    Active Goals List:
    ${goalsStr}

    IMPORTANT TAILORING DIRECTIONS:
    Customize all schedules, failure risk analyses, and recommended focuses precisely to their active mode:
    - For Student Mode: Highlight exams, study consistency, research deadlines, and course balance.
    - For Job Seeker Mode: Prioritize interview preparation, coding practice (DSA), and application tracking.
    - For Professional Mode: Focus on sprint deliveries, workload balance, client projects, and meeting blocks.
    - For Entrepreneur Mode: Tailor toward business strategy, growth priorities, launch roadmaps, and validation milestones.

    Return a beautiful, professional, and practical response in JSON format. Do not include random commentary or markdown surrounding the JSON.
  `;

  const fallbackData = {
    greeting: `Good Morning, ${name}.`,
    analysis: `You have ${tasks?.filter((t: any) => !t.completed).length || 0} active tasks remaining. Let's make sure we map out today's agenda to avoid deadline compression. Focus on high priority items and stay clear of distractions.`,
    urgencyLevel: tasks?.some((t: any) => !t.completed && t.priority === "high") ? "high" : "medium",
    criticalRisks: [
      tasks?.find((t: any) => !t.completed && t.priority === "high")
        ? `"${tasks.find((t: any) => !t.completed && t.priority === "high").title}" has a pressing deadline and high work load volume.`
        : "Workload distribution is steady, but consistent action is needed to stay ahead of upcoming deadlines.",
    ],
    recommendedFocus: tasks?.find((t: any) => !t.completed)?.title 
      ? `Revise and complete: ${tasks.find((t: any) => !t.completed).title}`
      : "Establish core priorities for the day to build momentum.",
    hourlyActionPlan: [
      { time: "09:00 AM", task: "Admin, Planning & Guard Review", active: true },
      { time: "10:30 AM", task: tasks?.find((t: any) => !t.completed)?.title || "Primary core work block", active: false },
      { time: "02:00 PM", task: "Secondary active sprint session", active: false },
      { time: "04:30 PM", task: "Habit stacking & alignment check-in", active: false },
    ],
    motivationalQuote: "The secret to getting ahead is getting started. Keep your guard up today!"
  };

  if (!ai) {
    // Return standard briefing safely if Gemini is not setup
    return res.json(fallbackData);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greeting: { type: Type.STRING, description: "Personalized header, e.g. 'Good Morning, Raju. Let's conquer today.'" },
            analysis: { type: Type.STRING, description: "A highly intelligent, succinct 2-3 sentence overview of the day's timeline workload, stating if the user is safe or at risk of delays." },
            urgencyLevel: { type: Type.STRING, description: "One of: low, medium, high, critical" },
            criticalRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Precise predicted critical risks or bottleneck alerts like 'Project X is due tomorrow but has no checkpoints completed yet'."
            },
            recommendedFocus: { type: Type.STRING, description: "The single most critical task or action they MUST take first, e.g. 'Submit final budget proposal before 1 PM.'" },
            hourlyActionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "E.g., 09:30 AM" },
                  task: { type: Type.STRING, description: "Focus, task or activity details" },
                  active: { type: Type.BOOLEAN, description: "Set to true representing the earliest high-priority action item timeline slot, false otherwise." }
                },
                required: ["time", "task", "active"]
              },
              description: "A highly custom proposed 4-step schedule block distribution fitting the user's workload."
            },
            motivationalQuote: { type: Type.STRING, description: "An energetic, startup-grade, empowering motivation quote." }
          },
          required: ["greeting", "analysis", "urgencyLevel", "criticalRisks", "recommendedFocus", "hourlyActionPlan", "motivationalQuote"]
        },
        systemInstruction: "You are the central core core-brain of Deadline Guardian AI. You analyze goals, tasks, and schedules to produce strict, high-fidelity, high-accuracy executive schedules, risk predictions, and professional coaching diagnostics. Keep tone elite, supportive, smart, laser-focused, similar to a high-class PM or Silicon Valley performance chief."
      }
    });

    const jsonText = response.text?.trim() || "";
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (error) {
    logApiWarning("AI Briefing Generation", error);
    res.json(fallbackData);
  }
});

// Post endpoint for coaching conversations
app.post("/api/ai/chat", async (req, res) => {
  const { messages, userInput, context } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: "Missing user input" });
  }

  const systemPrompt = `
    You are the elite, premium "AI Coach, Career Mentor, Study Planner, Accountability Partner, and Executive Assistant" 24/7.
    You must use the provided user context to formulate hyper-personalized, highly actionable coaching responses.

    Current Temporal & User Context:
    - Current Time & Day: \${context?.currentDay || 'Today'} (ISO: \${context?.currentTime || ''})
    - User Profile: \${JSON.stringify(context?.userProfile || { name: 'User', role: 'Student/Professional' })}
    - Productivity Health Score: \${context?.analyticsData?.healthScore || 85}%
    - Focus Score: \${context?.analyticsData?.focusVelocity || 75}%
    - Burnout Risk Level: \${context?.analyticsData?.predictions?.burnoutRiskScore || 'Low'}
    - Tasks List (Remaining): \${JSON.stringify(context?.tasks?.filter((t: any) => !t.completed) || [])}
    - Core Habits List: \${JSON.stringify(context?.habits || [])}
    - Master Goals (Progress tracking): \${JSON.stringify(context?.goals || [])}
    - Calendar Events: \${JSON.stringify(context?.events || [])}
    - Productivity Insights: \${JSON.stringify(context?.analyticsData?.aiInsights || {})}

    Core Roles & Responsibilities:
    1. PERSONAL PRODUCTIVITY COACH & STUDY ADVISOR:
       - Understand their study plans, exam preparations, revision schedules, and academic goals.
       - Provide structured, visual study plans (e.g., using "Day 1:", "Day 2:" or "Hour 1:", "Hour 2:" prefixes so the UI parses them perfectly).
       - When requested for study plans or "Prepare for Infosys Interview" or "Create DSA Roadmap", map out structured checklists.
    2. CAREER MENTOR & PORTFOLIO ADVISOR:
       - Provide specialized guidance for job search, resume building, interview preparation, portfolio strategy, and technical skills.
       - Give concrete recommendations for roles, e.g. "Prepare for Full Stack Developer Role", "Prepare for Infosys Interview", "Portfolio Strategy", "Create DSA Roadmap".
    3. ACCOUNTABILITY PARTNER & EXEC ASSISTANT:
       - Actively analyze their habit streaks, completed vs. missed habits, and outstanding high-priority deadlines.
       - If they are slipping, offer a specific "Smart Recovery Plan" or "Workload balancing suggestion".
       - Example accountability dialogue: "You planned 3 coding sessions this week. Only 1 has been completed. Here is your recovery plan..."
    4. MOTIVATOR & CELEBRATOR:
       - Include positive reinforcement, achievement celebrations (e.g. "Great job! You completed all planned tasks yesterday", "You are maintaining a 21-day coding streak").

    Response Format Constraints:
    - Never include random commentary or surrounding markdown outside of the requested JSON output structure.
    - Every response MUST end with a beautiful "Recommended Actions:" section containing 3-4 bulleted next steps that are concrete and immediate.
    - Keep formatting exceptionally clean. Make heavy use of bullet points, step structures ("Step 1:", "Day 1:", "Hour 1:") because the UI parses these prefixes into beautiful visual components (Timeline checklists, hourly schedulers, etc.) to give a stellar dashboard feel.

    Your output must be a single JSON object matching:
    {
      "response": "Your structured markdown response here, ending with Recommended Actions.",
      "actionSuggestions": ["Suggested prompt option 1", "Suggested prompt option 2", "Suggested prompt option 3"]
    }
  `;

  const legacyPrompt = `${systemPrompt}\n\nUser Input: ${userInput}\nProvide JSON response matching: { "response": "Your markdown advice...", "actionSuggestions": ["Suggestion 1", "Suggestion 2"] }`;

  const helperFallback = {
    response: `### 🛡️ Guardian Briefing\n\nI'm ready to help you optimize this workload. To guarantee you complete tasks on time, I recommend the following tactical sequence:\n\n1. **High-Value Focus**: Lock in on tasks with immediate timeline consequences.\n2. **Time Boxing**: Allocate a distinct 50-minute distraction-free flow block.\n3. **Habit Integration**: Pair your difficult priority directly with a solid daily habit.\n\n*Configure a valid GEMINI_API_KEY in the Secrets menu to unlock fully personalized real-time AI strategic planning and deadline risk assessment.*`,
    actionSuggestions: ["Set urgent deadlines", "Audit today's work timeline", "Create custom plan"]
  };

  if (!ai) {
    return res.json(helperFallback);
  }

  try {
    const formattedHistory = Array.isArray(messages) ? messages.slice(-6).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) : [];

    // Append current prompt and context
    formattedHistory.push({
      role: 'user',
      parts: [{ text: `User query: ${userInput}\n\nGenerate structured response matching the coaching format.` }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedHistory as any,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING, description: "Succinct coaching feedback and custom plan of attack in beautiful Markdown formatting." },
            actionSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 short clickable follow-up action options for the user interface."
            }
          },
          required: ["response", "actionSuggestions"]
        },
        systemInstruction: systemPrompt
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    logApiWarning("AI Chat", error);
    res.json(helperFallback);
  }
});

// Post endpoint for parsing task through natural language processing
app.post("/api/ai/parse-task", async (req, res) => {
  const { userInput, currentLocalTime } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: "Missing userInput" });
  }

  const defaultParsed = {
    task: {
      title: userInput.substring(0, 50),
      description: `Drafted from user prompt: "${userInput}"`,
      category: "Projects",
      priority: "high",
      difficulty: "medium",
      estimatedHours: 2,
      deadlineDaysFromNow: 2,
      deadlineISO: new Date(Date.now() + 172800000).toISOString().substring(0, 16),
      startTimeISO: new Date(Date.now() + 172800000).toISOString().substring(0, 16),
      endTimeISO: new Date(Date.now() + 172800000 + 7200000).toISOString().substring(0, 16),
      tags: ["#task"],
      recurringSchedule: "None",
      dependencies: "None",
      relatedGoals: "None",
      suggestedTimeBlocks: ["9:00 AM - 11:00 AM Tomorrow"],
      subtasks: ["Initial Prep", "Execution", "Completion Checks"]
    },
    isMissingCriticalInfo: false,
    followUpQuestion: "",
    assistantReply: "I've understood your prompt and auto-scheduled your new objective task."
  };

  if (!ai) {
    return res.json(defaultParsed);
  }

  try {
    const referenceTimeInfo = currentLocalTime 
      ? `The user's current exact local date, day of week, and time is: ${currentLocalTime}.` 
      : `The server's current UTC date and time is: ${new Date().toISOString()}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `User Query: "${userInput}"\n\nReference Temporal Context:\n${referenceTimeInfo}\n\nAnalyze the natural language prompt and extract complete task details. Ensure we calculate appropriate values if unspecified, unless the input is completely empty or meaningless.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "A descriptive, professional name of the task of max 5-6 words." },
                description: { type: Type.STRING, description: "A detailed summary of what needs to be done, or explanation." },
                category: { type: Type.STRING, enum: ["Work", "Study", "Health", "Personal", "Finance", "Education", "Interview Preparation", "Coding Practice", "Projects", "Career"], description: "The best fitting category." },
                priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"], description: "The priority of the task." },
                difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"], description: "The difficulty depth of the task." },
                estimatedHours: { type: Type.NUMBER, description: "Estimated active focus hours needed (0.5 to 12)." },
                deadlineDaysFromNow: { type: Type.NUMBER, description: "Estimated days from now until completion is required (1 to 30)." },
                deadlineISO: { type: Type.STRING, description: "The calculated deadline date and time in local 'YYYY-MM-DDTHH:mm' format (e.g. '2026-06-29T10:00'). ALWAYS calculate this accurately by resolving relative phrases ('today', 'tomorrow', 'next Monday', 'at 10:00 a.m.') relative to the provided current local time." },
                startTimeISO: { type: Type.STRING, description: "The calculated proposed start date and time in local 'YYYY-MM-DDTHH:mm' format." },
                endTimeISO: { type: Type.STRING, description: "The calculated proposed end date and time in local 'YYYY-MM-DDTHH:mm' format." },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant hashtags/tags (e.g., #coding, #assignment, #study)." },
                recurringSchedule: { type: Type.STRING, description: "Any repeating schedule, e.g. 'None', 'Weekly', 'Daily', or 'Every Monday'." },
                dependencies: { type: Type.STRING, description: "Pre-requisite tasks/dependencies, or 'None'." },
                relatedGoals: { type: Type.STRING, description: "Goals related to this task, or 'None'." },
                suggestedTimeBlocks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested calendar time blocks (e.g. ['10:00 AM - 12:00 PM Tomorrow', '3:00 PM - 5:00 PM Friday'])." },
                subtasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Chronological breakdown steps (3-5 items)." }
              },
              required: ["title", "description", "category", "priority", "difficulty", "estimatedHours", "deadlineDaysFromNow", "deadlineISO", "startTimeISO", "endTimeISO", "tags", "recurringSchedule", "dependencies", "relatedGoals", "suggestedTimeBlocks", "subtasks"]
            },
            isMissingCriticalInfo: { type: Type.BOOLEAN, description: "True if the query is extremely brief, vague, or nonsensical, requiring a follow-up clarification before a task can be scheduled." },
            followUpQuestion: { type: Type.STRING, description: "A friendly query to ask the user if isMissingCriticalInfo is true (e.g. 'What specific topic do you want to study?'). If false, return empty string." },
            assistantReply: { type: Type.STRING, description: "A friendly conversational reply explaining how the task was categorized and scheduled." }
          },
          required: ["task", "isMissingCriticalInfo", "followUpQuestion", "assistantReply"]
        },
        systemInstruction: "You are the AI Executive Assistant at Deadline Guardian AI. Your mission is to take a natural language productivity prompt and structure it into a complete, schedule-ready task object. Use the provided current local time of the user to resolve relative phrases (like 'tomorrow at 10 AM', 'this Friday at 3:00 PM', 'today at noon') into exact local absolute dates & times in 'YYYY-MM-DDTHH:mm' format for deadlineISO, startTimeISO, and endTimeISO. If the user input is extremely vague (like 'hello' or 'just study' or 'schedule'), mark isMissingCriticalInfo as true and ask a friendly, constructive follow-up question. Otherwise, fill out all details intelligently, inferring reasonable defaults for deadline (e.g. 2 days) and effort (e.g. 2 hours) if they are not explicitly specified."
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    logApiWarning("AI Parse Task", error);
    res.json(defaultParsed);
  }
});

// Post endpoint for generating custom interactive study/project/sprint timelines
app.post("/api/ai/generate-planner", async (req, res) => {
  const { type, query, context } = req.body;

  const demoPlanner = {
    focusRecommendation: "Allocate direct 90-minute morning distraction-free windows.",
    timeBlocks: [
      { timeRange: "09:00 AM - 11:00 AM", focus: "Critical DSA practice & key algorithm mock runs", category: "Coding Practice" },
      { timeRange: "02:00 PM - 04:00 PM", focus: "Develop high-fidelity React component modules", category: "Projects" },
      { timeRange: "05:00 PM - 06:30 PM", focus: "Review mock HR questions and resume keywords", category: "Interview Preparation" }
    ],
    milestones: [
      "Day 1-2: Core Arrays, Strings & HashMap practice",
      "Day 3-4: Trees, Traversals & Recusion depth-first checks",
      "Day 5-6: System Design basics & mock timing interviews",
      "Day 7: Final revision & mental guard prep"
    ],
    deadlinesRescue: [
      { hour: "Hour 1-2", action: "Perform high-intensity research, spec draft, and setup" },
      { hour: "Hour 3-4", action: "Execute key code foundations, logic routing, and DB connection" },
      { hour: "Hour 5-6", action: "Run system verification tests, catch bugs, and submit deliverables" }
    ],
    workloadOptimizationAdvice: "Your active queue has quite a dense load this period. Postpone light Personal items and leverage early morning hours for deep focus on high difficulty deliverables."
  };

  if (!ai) {
    return res.json(demoPlanner);
  }

  try {
    const userPrompt = `Planner Type requested: "${type || "day"}"
Custom query/goal: "${query || "standard schedule study sprint"}"

Active Context:
- Current Pending Tasks: ${JSON.stringify(context?.tasks?.filter((t: any) => !t.completed) || [])}
- Master Goals: ${JSON.stringify(context?.goals || [])}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusRecommendation: { type: Type.STRING, description: "The single most tactical advice or recommendation for this planner type." },
            timeBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeRange: { type: Type.STRING, description: "E.g., 09:30 AM - 11:30 AM" },
                  focus: { type: Type.STRING, description: "A precise custom action target description." },
                  category: { type: Type.STRING, description: "E.g. Study, Work, Coding Practice" }
                },
                required: ["timeRange", "focus", "category"]
              },
              description: "A balanced chronological distribution of 3 timeblocks fitting the theme."
            },
            milestones: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A custom 4-item schedule roadmap (typically Day-by-Day or Week-by-Week milestones)."
            },
            deadlinesRescue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hour: { type: Type.STRING, description: "E.g. Hour 1, Hour 2-3" },
                  action: { type: Type.STRING, description: "Specific emergency tasks to do during this window." }
                },
                required: ["hour", "action"]
              },
              description: "An emergency 5-step hour-by-hour roadmap layout for near-deadline recovery."
            },
            workloadOptimizationAdvice: { type: Type.STRING, description: "Direct diagnostic evaluation of high-risk bottlenecks, describing what tasks to postpone, delete, or accelerate." }
          },
          required: ["focusRecommendation", "timeBlocks", "milestones", "deadlinesRescue", "workloadOptimizationAdvice"]
        },
        systemInstruction: "You are the Strategy Planner Core of Deadline Guardian AI. Your mission is to formulate custom-segmented day-by-day study roadmap grids, emergency hour-by-hour recovery plans, and strategic time-block calendars."
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    logApiWarning("AI Planner Generation", error);
    res.json(demoPlanner);
  }
});


// Calendar scheduling endpoint
app.post("/api/ai/calendar-schedule", async (req, res) => {
  const { tasks, goals, habits, userProfile } = req.body;
  
  const fallbackSchedule = {
    scheduledBlocks: [
      { timeRange: "09:00 AM - 11:00 AM", title: "DSA Practice: Trees Traversals", start: "2026-06-23T09:00:00", end: "2026-06-23T11:00:00", type: "study_session" },
      { timeRange: "11:30 AM - 01:00 PM", title: "React Project Architecture", start: "2026-06-23T11:30:00", end: "2026-06-23T13:00:00", type: "task" },
      { timeRange: "02:00 PM - 03:30 PM", title: "Interview Prep Focus Session", start: "2026-06-23T14:00:00", end: "2026-06-23T15:30:00", type: "ai_activity" }
    ],
    recommendations: {
      bestTimeToStudy: "08:00 AM - 11:00 AM",
      bestTimeToCode: "02:00 PM - 05:00 PM",
      focusPeriod: "Morning session (Optimal alert levels)",
      advice: "Your workload is high for tomorrow. Protect your early morning for deep algorithmic work before operational noise starts."
    },
    focusSessionSuggestion: {
      title: "Deep Work Focus Session",
      duration: "90 Minutes",
      task: "LeetCode Daily Challenge or Interview Preparation",
      priority: "high"
    }
  };

  if (!ai) {
    return res.json(fallbackSchedule);
  }

  try {
    const prompt = `
      You are the scheduling core of Deadline Guardian AI. Analyze the user's details:
      Profile: ${JSON.stringify(userProfile)}
      Tasks: ${JSON.stringify(tasks)}
      Goals: ${JSON.stringify(goals)}
      Habits: ${JSON.stringify(habits)}

      Formulate auto-scheduled focus blocks for today (assume current date is 2026-06-23). Also recommend the best time to study, best time to code, optimal focus periods, and generate a dedicated custom focus session suggestion.

      Return the response in JSON format matching this schema strictly.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scheduledBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeRange: { type: Type.STRING },
                  title: { type: Type.STRING },
                  start: { type: Type.STRING, description: "ISO Datetime e.g. 2026-06-23T09:00:00" },
                  end: { type: Type.STRING, description: "ISO Datetime e.g. 2026-06-23T11:00:00" },
                  type: { type: Type.STRING, description: "One of: task, study_session, habit, ai_activity, meeting" }
                },
                required: ["timeRange", "title", "start", "end", "type"]
              }
            },
            recommendations: {
              type: Type.OBJECT,
              properties: {
                bestTimeToStudy: { type: Type.STRING },
                bestTimeToCode: { type: Type.STRING },
                focusPeriod: { type: Type.STRING },
                advice: { type: Type.STRING }
              },
              required: ["bestTimeToStudy", "bestTimeToCode", "focusPeriod", "advice"]
            },
            focusSessionSuggestion: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                duration: { type: Type.STRING },
                task: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ["title", "duration", "task", "priority"]
            }
          },
          required: ["scheduledBlocks", "recommendations", "focusSessionSuggestion"]
        }
      }
    });

    res.json(JSON.parse(response.text?.trim() || "{}"));
  } catch (error) {
    logApiWarning("AI Calendar Schedule Generation", error);
    res.json(fallbackSchedule);
  }
});


// Goal breakdown and status evaluation endpoint
app.post("/api/ai/goal-breakdown", async (req, res) => {
  const { title, description, category, targetDate } = req.body;

  const fallbackBreakdown = {
    milestones: [
      { id: "ms-1", title: "Review foundational concepts & setup environment", completed: false },
      { id: "ms-2", title: "Complete middle tier architectural specifications", completed: false },
      { id: "ms-3", title: "Build integration pathways & run test cases", completed: false },
      { id: "ms-4", title: "Deliver final deployment & review performance benchmarks", completed: false }
    ],
    completionProbability: 75,
    status: "Healthy",
    estimatedCompletionDate: targetDate || "2026-08-30",
    coachingAdvice: "Preserve 4.5 hours of dedicated focus blocks weekly to achieve this target. Your chosen schedule aligns beautifully."
  };

  if (!ai) {
    return res.json(fallbackBreakdown);
  }

  try {
    const prompt = `
      You are the long-term target planning core of Deadline Guardian AI. Break down this goal into 4 highly realistic chronologically ordered milestone tasks:
      Title: "${title}"
      Description: "${description || "None"}"
      Category: "${category}"
      Target Date: "${targetDate}"

      Also calculate a realistic completion probability (0-100), status ("Healthy", "At Risk", or "Critical" based on timeframe and complexity), estimated completion date, and direct personalized coaching advice.

      Return the response in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ["id", "title", "completed"]
              }
            },
            completionProbability: { type: Type.INTEGER },
            status: { type: Type.STRING, description: "One of: Healthy, At Risk, Critical" },
            estimatedCompletionDate: { type: Type.STRING, description: "YYYY-MM-DD" },
            coachingAdvice: { type: Type.STRING }
          },
          required: ["milestones", "completionProbability", "status", "estimatedCompletionDate", "coachingAdvice"]
        }
      }
    });

    res.json(JSON.parse(response.text?.trim() || "{}"));
  } catch (error) {
    logApiWarning("AI Goal Breakdown", error);
    res.json(fallbackBreakdown);
  }
});


// Habit tracking and coaching analysis endpoint
app.post("/api/ai/habit-analysis", async (req, res) => {
  const { habits } = req.body;

  const fallbackAnalysis = {
    consistencyFeedback: "Your morning box breathing routine is establishing deep consistency. Let's lock in design pattern reviews to match.",
    suggestedScheduleAdjustments: "Consider doing design pattern reviews right after trees DSA practice sessions (habit stacking).",
    newGoalSuggestions: [
      "Launch a 30-day coding consistency challenge",
      "Read 3 system architecture blogs weekly"
    ],
    encouragingQuote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit. Keep stacking!"
  };

  if (!ai) {
    return res.json(fallbackAnalysis);
  }

  try {
    const prompt = `
      You are the habit consistency coach of Deadline Guardian AI. Analyze this user's habits list:
      Habits: ${JSON.stringify(habits)}

      Analyze their streaks, frequency, and categories. Suggest specific schedule adjustments (habit stacking), propose 2 new exciting goals to pair with these habits, and write a personalized encouraging motivational quote.

      Return the response in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            consistencyFeedback: { type: Type.STRING },
            suggestedScheduleAdjustments: { type: Type.STRING },
            newGoalSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            encouragingQuote: { type: Type.STRING }
          },
          required: ["consistencyFeedback", "suggestedScheduleAdjustments", "newGoalSuggestions", "encouragingQuote"]
        }
      }
    });

    res.json(JSON.parse(response.text?.trim() || "{}"));
  } catch (error) {
    logApiWarning("AI Habit Analysis", error);
    res.json(fallbackAnalysis);
  }
});


// Productivity Analytics, Scoring, and Future Risk Prediction Engine endpoint
app.post("/api/ai/analytics", async (req, res) => {
  const { tasks = [], habits = [], goals = [], userProfile = {}, events = [] } = req.body;

  // Baseline Date for Calculations: 2026-06-23
  const BASELINE_DATE = new Date("2026-06-23T12:00:00.000Z");

  // 1. DYNAMIC CALCULATIONS FOR HEALTH SCORE COMPONENTS
  
  // A. Task Completion Component (25%)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const pendingTasks = tasks.filter((t: any) => !t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const taskCompletionComponent = completionRate;

  // B. Deadline Management Component (20%)
  // Missed deadlines (due before baseline and not completed) & overdue tasks
  let overdueCount = 0;
  let missedDeadlinesCount = 0;
  tasks.forEach((t: any) => {
    if (t.deadline) {
      const deadlineDate = new Date(t.deadline);
      if (deadlineDate < BASELINE_DATE) {
        if (!t.completed) {
          overdueCount++;
          missedDeadlinesCount++;
        }
      }
    }
  });
  const highPriorityPending = tasks.filter((t: any) => !t.completed && (t.priority === "high" || t.priority === "critical")).length;
  const deadlineScore = Math.max(0, 100 - (overdueCount * 20) - (highPriorityPending * 10));
  const deadlineManagementComponent = deadlineScore;

  // C. Goal Progress Component (15%)
  const activeGoals = goals.filter((g: any) => !g.completed);
  const completedGoalsCount = goals.filter((g: any) => g.completed).length;
  const averageGoalProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc: number, g: any) => acc + (g.progress || 0), 0) / goals.length) 
    : 80;
  const goalProgressComponent = averageGoalProgress;

  // D. Habit Consistency Component (15%)
  // Based on average streaks
  const totalStreaks = habits.reduce((acc: number, h: any) => acc + (h.streak || 0), 0);
  const averageStreak = habits.length > 0 ? totalStreaks / habits.length : 0;
  const habitScore = habits.length > 0 ? Math.min(100, Math.round((averageStreak / 8) * 100)) : 85;
  const habitConsistencyComponent = habitScore;

  // E. Focus Performance Component (15%)
  // Target focus hours vs study session scheduled hours
  const targetFocusHours = userProfile.targetHours || 8;
  const scheduledStudyEvents = events.filter((ev: any) => ev.type === "study_session" || ev.type === "ai_activity");
  let totalScheduledHours = 0;
  scheduledStudyEvents.forEach((ev: any) => {
    if (ev.start && ev.end) {
      const s = new Date(ev.start).getTime();
      const e = new Date(ev.end).getTime();
      const diffHrs = Math.max(0, (e - s) / (1000 * 60 * 60));
      totalScheduledHours += diffHrs;
    }
  });
  if (totalScheduledHours === 0) {
    totalScheduledHours = 5.5; // Default safe estimate for demo
  }
  const focusPerformanceScore = Math.min(100, Math.round((totalScheduledHours / targetFocusHours) * 100));
  const focusPerformanceComponent = focusPerformanceScore;

  // F. Schedule Adherence Component (10%)
  // How well they checked off high priority events or tasks
  const completedHighRate = tasks.filter((t: any) => t.completed && (t.priority === "high" || t.priority === "critical")).length;
  const totalHigh = tasks.filter((t: any) => t.priority === "high" || t.priority === "critical").length;
  const highRatio = totalHigh > 0 ? (completedHighRate / totalHigh) : 1;
  const scheduleAdherenceScore = Math.round((0.7 * completionRate) + (30 * highRatio));
  const scheduleAdherenceComponent = Math.min(100, Math.max(0, scheduleAdherenceScore));

  // G. Flagship Productivity Health Score Calculation (Weighted Formula)
  const healthScore = Math.round(
    (taskCompletionComponent * 0.25) +
    (deadlineManagementComponent * 0.20) +
    (goalProgressComponent * 0.15) +
    (habitConsistencyComponent * 0.15) +
    (focusPerformanceComponent * 0.15) +
    (scheduleAdherenceComponent * 0.10)
  );

  // Time allocation values
  const codingHours = tasks.filter((t: any) => t.category === "Coding Practice" || t.category === "Projects").reduce((acc: number, t: any) => acc + (t.estimatedHours || 2), 0) || 5;
  const studyHours = tasks.filter((t: any) => t.category === "Study" || t.category === "Education").reduce((acc: number, t: any) => acc + (t.estimatedHours || 2), 0) || 4;
  const workHours = tasks.filter((t: any) => t.category === "Work" || t.category === "Career").reduce((acc: number, t: any) => acc + (t.estimatedHours || 2), 0) || 3;
  const goalHours = goals.length * 1.5 || 3;
  const wasteHours = Math.max(1, Math.round(15 - (codingHours + studyHours + workHours) * 0.3));

  // Determine Rating Labels
  const getRatingLabel = (score: number) => {
    if (score >= 90) return "Elite Productivity";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Improvement";
    return "Critical";
  };

  const weeklyRating = `${getRatingLabel(healthScore)} (${healthScore}/100)`;
  const monthlyRating = `${getRatingLabel(Math.max(40, healthScore - 3))} (${Math.max(40, healthScore - 3)}/100)`;

  // High Priority tasks pending
  const highPriorityTasksCount = tasks.filter((t: any) => !t.completed && (t.priority === "high" || t.priority === "critical")).length;

  // Burnout indicators
  const burnoutRisk = healthScore > 85 ? "Low" : (healthScore > 70 ? "Moderate" : (healthScore > 50 ? "High" : "Critical"));

  // Formulate Fallback Payload dynamically aligned with user profile
  const fallbackAnalytics = {
    healthScore,
    components: {
      taskCompletion: taskCompletionComponent,
      deadlineManagement: deadlineManagementComponent,
      goalProgress: goalProgressComponent,
      habitConsistency: habitConsistencyComponent,
      focusPerformance: focusPerformanceComponent,
      scheduleAdherence: scheduleAdherenceComponent,
    },
    metrics: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks: overdueCount,
      highPriorityTasks: highPriorityTasksCount,
      missedDeadlines: missedDeadlinesCount,
      completionRate,
      focusScore: focusPerformanceComponent,
      consistencyScore: habitScore,
      goalProgressScore: averageGoalProgress,
      habitPerformanceScore: Math.min(100, habitScore + 5),
      weeklyRating,
      monthlyRating,
      deepWorkHours: totalScheduledHours || 6,
      interruptions: overdueCount > 0 ? overdueCount : 1,
      productivityPeaks: "09:00 AM - 11:30 AM & 02:00 PM - 04:30 PM",
    },
    timeAllocation: {
      coding: codingHours,
      studying: studyHours,
      working: workHours,
      goals: goalHours,
      waste: wasteHours,
    },
    bestPeriods: {
      mostProductiveHour: "10:00 AM",
      mostProductiveDay: "Wednesday",
      bestStudyPeriod: "Morning focus block",
      bestCodingPeriod: "Afternoon deep sprint",
    },
    predictions: {
      tasksAtRisk: tasks.filter((t: any) => !t.completed && t.priority === "high").slice(0, 2).map((t: any) => ({
        title: t.title,
        risk: "high",
        reason: "Rapidly approaching deadline with sizeable estimated work hours."
      })).concat(pendingTasks === 0 ? [] : [{
        title: tasks.find((t: any) => !t.completed)?.title || "Upcoming deliverables",
        risk: "medium",
        reason: "Resource constraint in current weekly cycle."
      }]),
      overloadedDays: ["Tuesday", "Thursday"],
      schedulingConflicts: ["Mock FAANG Interview Block overlaps with DSA Study Sprint buffer"],
      burnoutRiskScore: burnoutRisk,
      burnoutFactors: [
        highPriorityTasksCount > 2 ? "High density of High/Critical tasks." : "Consistently long focus intervals.",
        "Minimal restorative pauses during the afternoon coding windows."
      ],
      recommendations: [
        "Distribute high priority tasks evenly across Wednesday and Friday.",
        "Inject 10-minute micro-breaks between consecutive focus sprints to reset baseline alert levels.",
        "Delegate or postpone low priority items until high-urgency deadlines are safely met."
      ]
    },
    goalForecasts: goals.map((g: any) => {
      // Calculate probability based on goal progress, healthScore and time alignment
      const probability = Math.min(99, Math.max(10, Math.round(g.progress * 0.8 + healthScore * 0.2)));
      return {
        goalTitle: g.title,
        likelihood: probability,
        forecastDate: g.targetDate || "2026-09-01",
        insights: probability > 80 
          ? "Excellent trajectory! Current consistency index guarantees achievement 5 days ahead of schedule."
          : "At risk of delay. Suggest increasing habit stacking frequency to recover the target pace."
      };
    }),
    aiInsights: {
      strengths: [
        "Superb morning routine consistency driven by box breathing integration.",
        "Excellent response rate to critical deadlines in the study category."
      ],
      weaknesses: [
        "Slight timeline congestion on mid-week afternoons.",
        "Postponement trends detected on complex coding assignments."
      ],
      recommendations: [
        "Anchor your difficult SDE preparation tasks immediately after your completed breathing habits.",
        "Carve out a dedicated Sunday evening shield review to pre-arrange high priority tasks."
      ],
      scheduleImprovements: "Shift active coding sprints to the 2 PM - 4 PM window when cognitive stamina peaks.",
      goalAdjustments: "Recommend accelerating Milestone 1 of the SDE Internship goal by 3 days to establish safety buffers.",
      habitSuggestions: "Pair SDE application submissions directly after morning meditation review (habit stack).",
      priorityRecommendations: "Tackle 'DSA Revision' today with absolute focus priority before noon."
    },
    weeklySummary: {
      wins: [
        "Maintained a 12-day LeetCode problems completion streak.",
        "Calibrated schedule safety to clear 2 major high priority targets."
      ],
      challenges: [
        "Encountered minor focus compression during Database submissions.",
        "Average recovery interval declined on Thursday."
      ],
      trends: "Focus volume increased by 14% compared to previous cycle, while deadline stress declined.",
      recommendations: [
        "Protect morning SDE sprint slots from digital interruptions.",
        "Deploy a 15-minute weekly retro review to close outstanding tasks."
      ]
    },
    monthlyReview: {
      goalProgress: "SDE Offer goal is moving steadily at 65% completion. Likely to meet deadline with outstanding consistency.",
      habitProgress: "Habit stacking compliance rate reached an impressive 88% overall.",
      healthTrends: "Your Productivity Health Score rose from 71 to 82 this month, signaling superior schedule adherence.",
      recommendations: [
        "Establish an advanced algorithms milestone for the upcoming month.",
        "Maintain active Shield calibration to avoid burnout risk."
      ]
    }
  };

  if (!ai) {
    return res.json(fallbackAnalytics);
  }

  try {
    // Generate AI-powered insights using Gemini with fallback calculations embedded as context
    const prompt = `
      You are the Neural Intelligence Analytics Engine of "Deadline Guardian AI".
      Perform a deep executive productivity diagnostic and forecasting report based on the user's workload, schedules, goals, and habits.

      Current Calculated Scopes (Calculated mathematically):
      - Overall Productivity Health Score: ${healthScore}/100
      - Component Breakdown: 
        * Task Completion: ${taskCompletionComponent}/100
        * Deadline Management: ${deadlineManagementComponent}/100
        * Goal Progress: ${goalProgressComponent}/100
        * Habit Consistency: ${habitConsistencyComponent}/100
        * Focus Performance: ${focusPerformanceComponent}/100
        * Schedule Adherence: ${scheduleAdherenceComponent}/100
      
      Counts:
      - Total Tasks: ${totalTasks}, Completed Tasks: ${completedTasks}, Pending: ${pendingTasks}
      - Overdue Tasks: ${overdueCount}, High/Critical Priority Tasks Pending: ${highPriorityTasksCount}
      - Missed Deadlines: ${missedDeadlinesCount}
      - Habits list: ${JSON.stringify(habits)}
      - Goals list: ${JSON.stringify(goals)}
      - Recent events/schedule blocks: ${JSON.stringify(events.slice(0, 10))}

      Based on these variables, expand upon this data to produce an elite, Silicon Valley grade diagnostic report. Ensure you provide personalized recommendations, identify approach-deadlines risks, detect overloading, calculate Burnout details, forecast goal completion likelihoods, and generate comprehensive weekly and monthly reviews.

      The response MUST conform strictly to the requested JSON schema. Do not output anything other than pure JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER, description: "Calibrate or refine the mathematically calculated health score if needed (usually matches the calculated score)." },
            components: {
              type: Type.OBJECT,
              properties: {
                taskCompletion: { type: Type.INTEGER },
                deadlineManagement: { type: Type.INTEGER },
                goalProgress: { type: Type.INTEGER },
                habitConsistency: { type: Type.INTEGER },
                focusPerformance: { type: Type.INTEGER },
                scheduleAdherence: { type: Type.INTEGER }
              },
              required: ["taskCompletion", "deadlineManagement", "goalProgress", "habitConsistency", "focusPerformance", "scheduleAdherence"]
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                totalTasks: { type: Type.INTEGER },
                completedTasks: { type: Type.INTEGER },
                pendingTasks: { type: Type.INTEGER },
                overdueTasks: { type: Type.INTEGER },
                highPriorityTasks: { type: Type.INTEGER },
                missedDeadlines: { type: Type.INTEGER },
                completionRate: { type: Type.INTEGER },
                focusScore: { type: Type.INTEGER, description: "0-100 score based on scheduled vs target hours" },
                consistencyScore: { type: Type.INTEGER, description: "0-100 habit consistency score" },
                goalProgressScore: { type: Type.INTEGER, description: "0-100 goal progress rating" },
                habitPerformanceScore: { type: Type.INTEGER },
                weeklyRating: { type: Type.STRING, description: "E.g., Good (74/100)" },
                monthlyRating: { type: Type.STRING, description: "E.g., Excellent (85/100)" },
                deepWorkHours: { type: Type.NUMBER },
                interruptions: { type: Type.INTEGER },
                productivityPeaks: { type: Type.STRING }
              },
              required: [
                "totalTasks", "completedTasks", "pendingTasks", "overdueTasks", "highPriorityTasks", "missedDeadlines",
                "completionRate", "focusScore", "consistencyScore", "goalProgressScore", "habitPerformanceScore",
                "weeklyRating", "monthlyRating", "deepWorkHours", "interruptions", "productivityPeaks"
              ]
            },
            timeAllocation: {
              type: Type.OBJECT,
              properties: {
                coding: { type: Type.NUMBER },
                studying: { type: Type.NUMBER },
                working: { type: Type.NUMBER },
                goals: { type: Type.NUMBER },
                waste: { type: Type.NUMBER }
              },
              required: ["coding", "studying", "working", "goals", "waste"]
            },
            bestPeriods: {
              type: Type.OBJECT,
              properties: {
                mostProductiveHour: { type: Type.STRING },
                mostProductiveDay: { type: Type.STRING },
                bestStudyPeriod: { type: Type.STRING },
                bestCodingPeriod: { type: Type.STRING }
              },
              required: ["mostProductiveHour", "mostProductiveDay", "bestStudyPeriod", "bestCodingPeriod"]
            },
            predictions: {
              type: Type.OBJECT,
              properties: {
                tasksAtRisk: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      risk: { type: Type.STRING, enum: ["low", "medium", "high"] },
                      reason: { type: Type.STRING }
                    },
                    required: ["title", "risk", "reason"]
                  },
                  description: "Predict tasks, projects or milestones at risk of delay"
                },
                overloadedDays: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detect loaded/overloaded weekdays based on deadline density" },
                schedulingConflicts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detect scheduling overlaps" },
                burnoutRiskScore: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
                burnoutFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mitigation steps" }
              },
              required: ["tasksAtRisk", "overloadedDays", "schedulingConflicts", "burnoutRiskScore", "burnoutFactors", "recommendations"]
            },
            goalForecasts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  goalTitle: { type: Type.STRING },
                  likelihood: { type: Type.INTEGER, description: "0-100 percentage" },
                  forecastDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                  insights: { type: Type.STRING }
                },
                required: ["goalTitle", "likelihood", "forecastDate", "insights"]
              },
              description: "Goal forecasting: probability of achievement"
            },
            aiInsights: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                scheduleImprovements: { type: Type.STRING },
                goalAdjustments: { type: Type.STRING },
                habitSuggestions: { type: Type.STRING },
                priorityRecommendations: { type: Type.STRING }
              },
              required: ["strengths", "weaknesses", "recommendations", "scheduleImprovements", "goalAdjustments", "habitSuggestions", "priorityRecommendations"]
            },
            weeklySummary: {
              type: Type.OBJECT,
              properties: {
                wins: { type: Type.ARRAY, items: { type: Type.STRING } },
                challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                trends: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["wins", "challenges", "trends", "recommendations"]
            },
            monthlyReview: {
              type: Type.OBJECT,
              properties: {
                goalProgress: { type: Type.STRING },
                habitProgress: { type: Type.STRING },
                healthTrends: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["goalProgress", "habitProgress", "healthTrends", "recommendations"]
            }
          },
          required: [
            "healthScore", "components", "metrics", "timeAllocation", "bestPeriods",
            "predictions", "goalForecasts", "aiInsights", "weeklySummary", "monthlyReview"
          ]
        },
        systemInstruction: "You are the advanced Neural Predictor and Analytics Engine of Deadline Guardian AI. Your purpose is to diagnose schedules, calculate exact weighted health indices, predict timeline risks/conflicts, measure burnout danger zones, and forecast milestone achievements. Use ultra-professional, encouraging, crisp coaching language."
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    logApiWarning("AI Analytics Diagnostic", error);
    res.json(fallbackAnalytics);
  }
});



// ---------------------- DEV / PROD HOSTING ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middleware. This processes all static files and UI resolution.
    app.use(vite.middlewares);
    console.log("► Running in DEVELOPMENT mode with Vite middleware.");
  } else {
    // Serve production static build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("► Running in PRODUCTION mode serving dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`► Deadline Guardian AI is live at http://localhost:${PORT}`);
  });
}

startServer();
