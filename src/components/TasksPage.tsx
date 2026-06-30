import React, { useState, useEffect, useRef } from "react";
import { useApp } from "./AppContext";
import { Task } from "../types";
import { fetchAIParseTask } from "../lib/store";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Search,
  Trash2,
  Columns,
  List as ListIcon,
  ChevronRight,
  HelpCircle,
  FolderDot,
  Mic,
  MicOff,
  Settings,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  Send,
  Tag,
  Hash,
  Link2,
  Bell,
  AlertCircle,
  Play,
  Grid,
  CornerDownLeft,
  Sliders,
  MoreVertical
} from "lucide-react";

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "alert";
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  taskPayload?: Task; // If AI successfully generated a task
  suggestions?: string[]; // Quick action suggestions
}

export const TasksPage: React.FC = () => {
  const { tasks, setTasks, toggleTask, updateTask, deleteTask, addActivity, setActivePage, addCustomTask } = useApp();

  // Floating Toast Notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Page active view: "list" | "kanban" | "calendar"
  const [activeLayout, setActiveLayout] = useState<"list" | "kanban" | "calendar">("list");

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");

  // Chat Conversation State
  const [chatPrompt, setChatPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to your AI Productivity Console. I am your Deadline Guardian AI assistant. Tell me what you need to achieve—I will automatically structure, schedule, prioritize, and compile subtask checklists for you.",
      suggestions: [
        "Schedule Tree & Graph DSA revision due tomorrow, high priority",
        "Set up FAANG mock interview prep session for Friday, critical category study",
        "Add database systems homework study session with 3 hours effort"
      ]
    }
  ]);

  // Task Editing Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editCategory, setEditCategory] = useState<Task["category"]>("Study");
  const [editDifficulty, setEditDifficulty] = useState<Task["difficulty"]>("medium");
  const [editHours, setEditHours] = useState(2);
  const [editDeadline, setEditDeadline] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editDependencies, setEditDependencies] = useState("");
  const [editRelatedGoals, setEditRelatedGoals] = useState("");
  const [editSubtasks, setEditSubtasks] = useState<string[]>([]);
  const [aiRefinementCommand, setAiRefinementCommand] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Kanban column tracking
  const [kanbanSimColumn, setKanbanSimColumn] = useState<Record<string, "planned" | "progress" | "completed">>({});

  // Chat container scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Populate Kanban columns initially
  useEffect(() => {
    const nextCols = { ...kanbanSimColumn };
    tasks.forEach(t => {
      if (!nextCols[t.id]) {
        nextCols[t.id] = t.completed ? "completed" : "planned";
      }
    });
    setKanbanSimColumn(nextCols);
  }, [tasks]);

  // Scroll to bottom of chat whenever history changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Trigger Toast function
  const showToast = (title: string, message: string, type: "success" | "info" | "alert" = "info") => {
    const id = "toast-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Web Speech API / Virtual Microphone simulator
  const startSpeechRecognition = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        showToast("AI Voice Activated", "Listening to your instructions...", "info");
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setChatPrompt(text);
        showToast("Speech Captured", `"${text}"`, "success");
      };

      recognition.onerror = () => {
        runMockSpeech();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      runMockSpeech();
    }
  };

  // Simulation fallback for voice recognition
  const runMockSpeech = () => {
    setIsRecording(true);
    showToast("Simulating Mic Ingress", "Transcribing virtual voice stack...", "info");
    
    const mockPhrases = [
      "Prepare project presentation slides due tomorrow 5 PM, medium priority study",
      "Leetcode daily challenge coding practice 1 hour due tonight high priority",
      "Finalize system architecture report by Friday afternoon with tags #coding #design",
      "Organize bedroom checklist due Sunday evening category Personal"
    ];
    
    const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
    let currentText = "";
    let index = 0;

    const interval = setInterval(() => {
      if (index < randomPhrase.length) {
        currentText += randomPhrase[index];
        setChatPrompt(currentText);
        index++;
      } else {
        clearInterval(interval);
        setIsRecording(false);
        showToast("Voice Input Processed", "Structured text transcribed successfully.", "success");
      }
    }, 35);
  };

  // Core Natural Language Submission handler
  const handleChatSubmit = async (promptText: string) => {
    if (!promptText.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: promptText
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatPrompt("");
    setIsProcessing(true);

    try {
      const localTimeStr = new Date().toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });

      // Query the enhanced backend parser
      const parsedRes = await fetchAIParseTask(promptText, localTimeStr);

      // Create physical task model based on results if isMissingCriticalInfo is false
      let generatedTask: Task | undefined = undefined;

      if (!parsedRes.isMissingCriticalInfo) {
        // Calculate deadline timestamp
        let isoDeadline = "";
        if (parsedRes.task.deadlineISO) {
          isoDeadline = parsedRes.task.deadlineISO;
        } else {
          const days = parsedRes.task.deadlineDaysFromNow || 2;
          const targetDate = new Date(Date.now() + 86400000 * days);
          isoDeadline = targetDate.toISOString().substring(0, 16);
        }

        const startIso = parsedRes.task.startTimeISO || isoDeadline;
        const endIso = parsedRes.task.endTimeISO || (parsedRes.task.startTimeISO 
          ? new Date(new Date(parsedRes.task.startTimeISO).getTime() + (parsedRes.task.estimatedHours || 1) * 3600000).toISOString().substring(0, 16)
          : new Date(new Date(isoDeadline).getTime() + (parsedRes.task.estimatedHours || 1) * 3600000).toISOString().substring(0, 16));

        generatedTask = {
          id: "task-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
          title: parsedRes.task.title,
          completed: false,
          deadline: isoDeadline,
          startTime: startIso,
          endTime: endIso,
          priority: parsedRes.task.priority,
          category: parsedRes.task.category,
          difficulty: parsedRes.task.difficulty,
          estimatedHours: parsedRes.task.estimatedHours,
          description: parsedRes.task.description,
          tags: parsedRes.task.tags || ["#AI-parsed"],
          recurringSchedule: parsedRes.task.recurringSchedule,
          dependencies: parsedRes.task.dependencies,
          relatedGoals: parsedRes.task.relatedGoals,
          suggestedTimeBlocks: parsedRes.task.suggestedTimeBlocks,
          subtasks: parsedRes.task.subtasks,
          subtaskCompletion: parsedRes.task.subtasks ? new Array(parsedRes.task.subtasks.length).fill(false) : [],
          aiStatus: "Auto-Scheduled"
        };

        // Append to local store state with Google Calendar sync capability
        addCustomTask(generatedTask!);
        showToast("Task Auto-Scheduled", `"${generatedTask.title}" is locked into your schedule!`, "success");
      }

      // Add AI reply to Chat log
      const aiReply: ChatMessage = {
        id: "reply-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
        sender: "ai",
        text: parsedRes.isMissingCriticalInfo
          ? parsedRes.followUpQuestion
          : parsedRes.assistantReply,
        taskPayload: generatedTask,
        suggestions: parsedRes.isMissingCriticalInfo
          ? [
              "Schedule it for tomorrow",
              "Set it as high priority Study",
              "It is work related and due next Friday"
            ]
          : [
              "Create another coding task",
              "Show me my current schedule",
              "Optimize today's agenda with AI"
            ]
      };

      setChatHistory((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error("AI prompt processing error", err);
      showToast("Error parsing prompt", "Guardian AI experienced high load. Retrying locally...", "alert");
      
      // Fallback local mock task creator
      const fallbackTask: Task = {
        id: "task-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
        title: promptText.substring(0, 55),
        completed: false,
        deadline: new Date(Date.now() + 172800000).toISOString().substring(0, 16),
        priority: "medium",
        category: "Projects",
        difficulty: "medium",
        estimatedHours: 2,
        description: `Auto-parsed from prompt: "${promptText}"`,
        tags: ["#local-parsed"],
        recurringSchedule: "None",
        dependencies: "None",
        relatedGoals: "None",
        suggestedTimeBlocks: ["10:00 AM - 12:00 PM Tomorrow"],
        subtasks: ["Initial research", "Core coding work", "Verify results"],
        subtaskCompletion: [false, false, false],
        aiStatus: "Local-Scheduled"
      };

      addCustomTask(fallbackTask);
      setChatHistory((prev) => [
        ...prev,
        {
          id: "reply-err-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
          sender: "ai",
          text: "I have parsed your task in safe-offline mode due to connection timeouts. Your parameters have been structured below.",
          taskPayload: fallbackTask
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle internal subtask completion checkbox
  const toggleSubtask = (taskId: string, subtaskIndex: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const currentCompletes = [...(t.subtaskCompletion || [])];
          // Ensure arrays are initialized
          if (currentCompletes.length === 0 && t.subtasks) {
            for (let i = 0; i < t.subtasks.length; i++) currentCompletes.push(false);
          }
          currentCompletes[subtaskIndex] = !currentCompletes[subtaskIndex];
          
          // If all subtasks completed, check if we should prompt to complete task, or leave it
          const allDone = currentCompletes.every(x => x);
          
          addActivity(`Updated subtask in "${t.title}"`, "info");
          return {
            ...t,
            subtaskCompletion: currentCompletes,
            // optionally auto complete task if user desires
            completed: allDone ? t.completed : t.completed
          };
        }
        return t;
      })
    );
    showToast("Subtask Toggled", "Task progress bar updated.", "success");
  };

  // Open Edit Modal & populate states
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDifficulty(task.difficulty || "medium");
    setEditHours(task.estimatedHours);
    setEditDeadline(task.deadline ? task.deadline.substring(0, 16) : "");
    setEditTags((task.tags || []).join(", "));
    setEditSchedule(task.recurringSchedule || "None");
    setEditDependencies(task.dependencies || "None");
    setEditRelatedGoals(task.relatedGoals || "None");
    setEditSubtasks(task.subtasks || []);
    setAiRefinementCommand("");
  };

  // Save changes to current task
  const handleSaveEdit = () => {
    if (!editingTask) return;

    const tagsArr = editTags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith("#") ? t : "#" + t);

    const updatedTask: Task = {
      ...editingTask,
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      category: editCategory,
      difficulty: editDifficulty,
      estimatedHours: editHours,
      deadline: editDeadline,
      startTime: editDeadline ? editDeadline : editingTask.startTime,
      endTime: editDeadline 
        ? new Date(new Date(editDeadline).getTime() + (editHours || 1) * 3600000).toISOString().substring(0, 16)
        : editingTask.endTime,
      tags: tagsArr,
      recurringSchedule: editSchedule,
      dependencies: editDependencies,
      relatedGoals: editRelatedGoals,
      subtasks: editSubtasks,
      subtaskCompletion: editingTask.subtasks?.length === editSubtasks.length
        ? (editingTask.subtaskCompletion || new Array(editSubtasks.length).fill(false))
        : new Array(editSubtasks.length).fill(false),
      aiStatus: "Refined"
    };

    updateTask(updatedTask);

    addActivity(`Saved updates to task: "${editTitle}"`, "success");
    showToast("Changes Saved", `Task details updated for "${editTitle}".`, "success");
    setEditingTask(null);
  };

  // AI Assisted Refinement commands inside edit modal
  const handleAIRefine = async () => {
    if (!aiRefinementCommand.trim() || isRefining) return;
    setIsRefining(true);
    showToast("AI Refinement Active", `Applying command: "${aiRefinementCommand}"`, "info");

    // Simulate AI model modifying variables on-the-fly inside the form
    setTimeout(() => {
      const command = aiRefinementCommand.toLowerCase();

      if (command.includes("friday") || command.includes("postpone") || command.includes("later")) {
        // Postpone deadline
        const nextDate = new Date(Date.now() + 86400000 * 4);
        setEditDeadline(nextDate.toISOString().substring(0, 16));
        showToast("Deadline Rescheduled", "Rescheduled task deadline to next Friday.", "success");
      } else if (command.includes("high") || command.includes("urgent") || command.includes("critical") || command.includes("increase")) {
        setEditPriority("critical");
        showToast("Priority Raised", "Updated priority level to Critical.", "success");
      } else if (command.includes("split") || command.includes("subtask") || command.includes("break")) {
        // Dynamically split into 4 specific micro subtasks
        const subList = [
          "1. Comprehensive architectural design documentation",
          "2. Scaffold client routes & integrate store state context",
          "3. Setup full unit testing suite configurations",
          "4. Execute end-to-end user verification audits"
        ];
        setEditSubtasks(subList);
        setEditHours(6.5);
        showToast("Task Segmented", "Automatically split task into professional checkpoints.", "success");
      } else if (command.includes("study") || command.includes("work") || command.includes("personal")) {
        if (command.includes("study")) setEditCategory("Study");
        if (command.includes("work")) setEditCategory("Work");
        if (command.includes("personal")) setEditCategory("Personal");
        showToast("Category Synced", "Task classification reassigned.", "success");
      } else {
        // Generic refinement text modification
        setEditTitle(editTitle + " [AI Optimized]");
        setEditDesc(editDesc + `\n\n[Refinement applied: "${aiRefinementCommand}"]`);
        showToast("AI Applied Content Updates", "Optimized name and details.", "success");
      }

      setAiRefinementCommand("");
      setIsRefining(false);
    }, 1200);
  };

  // Move task in Kanban lane
  const moveKanbanTask = (taskId: string, targetLane: "planned" | "progress" | "completed") => {
    setKanbanSimColumn(prev => ({
      ...prev,
      [taskId]: targetLane
    }));

    // Synchronize completion state
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const completedState = targetLane === "completed";
          if (t.completed !== completedState) {
            addActivity(
              completedState
                ? `Cleared task: "${t.title}"`
                : `Re-opened task: "${t.title}"`,
              completedState ? "success" : "info"
            );
            return { ...t, completed: completedState };
          }
        }
        return t;
      })
    );
    showToast("Lane Updated", `Shifted task to ${targetLane.toUpperCase()}`, "info");
  };

  // Filter tasks based on Search query and Category/Priority drop downs
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    
    let matchesStatus = true;
    if (filterStatus === "pending") matchesStatus = !t.completed;
    if (filterStatus === "completed") matchesStatus = t.completed;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-10 animate-fade-in relative min-h-screen select-none pb-24">
      {/* ================= FLOATING TOASTS ================= */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all transform animate-slide-in duration-300 ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : toast.type === "alert"
                ? "bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : "bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : toast.type === "alert" ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            ) : (
              <Sparkles className="w-5 h-5 shrink-0 text-blue-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{toast.title}</p>
              <p className="text-xs mt-0.5 opacity-90 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-brand-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-brand-primary/15 text-brand-primary rounded-full">
              Guardian Console
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-brand-secondary font-semibold">AI Assistant Online</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-brand-heading leading-tight flex items-center gap-2.5">
            AI Productivity Workspace
          </h1>
          <p className="text-base text-brand-secondary max-w-2xl font-medium">
            No more manual form entries. Communicate with Deadline Guardian AI to plan, organize, and optimize your schedule instantly.
          </p>
        </div>

        {/* Toolbar tabs */}
        <div className="flex bg-brand-bg p-1 rounded-xl shrink-0 self-start lg:self-center border border-brand-border shadow-inner">
          <button
            onClick={() => setActiveLayout("list")}
            className={`inline-flex items-center gap-2 px-4 h-10 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeLayout === "list"
                ? "bg-brand-card text-brand-heading shadow-md border border-brand-border"
                : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            <ListIcon className="w-4 h-4" />
            LIST INDEX
          </button>
          
          <button
            onClick={() => setActiveLayout("kanban")}
            className={`inline-flex items-center gap-2 px-4 h-10 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeLayout === "kanban"
                ? "bg-brand-card text-brand-heading shadow-md border border-brand-border"
                : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            <Columns className="w-4 h-4" />
            KANBAN BOARD
          </button>

          <button
            onClick={() => setActiveLayout("calendar")}
            className={`inline-flex items-center gap-2 px-4 h-10 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeLayout === "calendar"
                ? "bg-brand-card text-brand-heading shadow-md border border-brand-border"
                : "text-brand-secondary hover:text-brand-heading"
            }`}
          >
            <Calendar className="w-4 h-4" />
            AGENDA TIMELINE
          </button>
        </div>
      </div>

      {/* ================= PRIMARY CONSOLE GRID ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: INTERACTIVE AI CHAT CONSOLE (5 COLS) */}
        <div className="xl:col-span-5 flex flex-col bg-brand-card rounded-2xl border border-brand-border shadow-lg overflow-hidden h-[640px]">
          {/* Header */}
          <div className="px-6 py-4 bg-brand-bg/50 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-brand-heading text-sm">Deadline Guardian AI</h3>
                <p className="text-[10px] text-brand-secondary font-semibold">COGNITIVE COMPLIANCE AGENT</p>
              </div>
            </div>
            <button
              onClick={() => {
                setChatHistory([
                  {
                    id: "welcome",
                    sender: "ai",
                    text: "Workspace conversation log cleared. What objective can I schedule next?",
                    suggestions: [
                      "Create a chemistry assignment deadline",
                      "Schedule study block for trees traversal"
                    ]
                  }
                ]);
                showToast("Chat Cleared", "AI conversation log reset.", "info");
              }}
              className="p-1.5 text-brand-placeholder hover:text-brand-danger transition-colors cursor-pointer rounded-lg hover:bg-brand-bg"
              title="Clear Log"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-brand-border">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                {/* Sender label */}
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5 px-1">
                  {msg.sender === "user" ? "You" : "Deadline Guardian"}
                </span>

                {/* Message bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed font-medium shadow-sm transition-all ${
                    msg.sender === "user"
                      ? "bg-brand-primary text-white rounded-tr-none"
                      : "bg-brand-bg text-brand-heading border border-brand-border rounded-tl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}

                  {/* If task is generated, show complete structured payload in chat */}
                  {msg.taskPayload && (
                    <div className="mt-4 p-4 rounded-xl bg-brand-card border border-brand-border space-y-3.5 text-brand-heading shadow-md text-xs">
                      <div className="flex items-center justify-between border-b border-brand-border pb-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-brand-primary flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> TASK AUTO-SCHEDULED
                        </span>
                        <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary font-bold rounded uppercase text-[9px]">
                          {msg.taskPayload.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="font-extrabold text-sm">{msg.taskPayload.title}</p>
                        <p className="text-brand-secondary italic leading-relaxed">{msg.taskPayload.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-b border-brand-border py-2 text-brand-secondary">
                        <div>
                          <strong>Urgency:</strong> <span className="font-bold text-brand-danger uppercase">{msg.taskPayload.priority}</span>
                        </div>
                        <div>
                          <strong>Estimated Duration:</strong> <span className="font-semibold text-brand-heading">{msg.taskPayload.estimatedHours}h</span>
                        </div>
                        <div>
                          <strong>Dependencies:</strong> <span className="font-semibold text-brand-heading">{msg.taskPayload.dependencies || "None"}</span>
                        </div>
                        <div>
                          <strong>Goal Link:</strong> <span className="font-semibold text-brand-heading">{msg.taskPayload.relatedGoals || "None"}</span>
                        </div>
                      </div>

                      {msg.taskPayload.tags && msg.taskPayload.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.taskPayload.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-md font-bold text-brand-secondary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {msg.taskPayload.subtasks && msg.taskPayload.subtasks.length > 0 && (
                        <div className="pt-2">
                          <p className="font-bold text-brand-heading mb-1.5 text-[11px]">Chronological Action Plan:</p>
                          <ul className="space-y-1 text-brand-secondary pl-1 list-none">
                            {msg.taskPayload.subtasks.map((st, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-brand-primary text-[10px] mt-0.5 font-bold">↳</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Micro Suggestions Pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-start max-w-full">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleChatSubmit(sug)}
                        className="px-3 py-1.5 text-xs font-semibold bg-brand-bg hover:bg-brand-primary hover:text-white border border-brand-border hover:border-brand-primary rounded-full transition-all cursor-pointer text-brand-secondary text-left leading-tight shrink-0 shadow-sm"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input box */}
          <div className="p-4 bg-brand-bg/40 border-t border-brand-border space-y-3">
            <div className="relative flex items-end gap-3 bg-brand-card border-[1.5px] border-brand-border hover:border-brand-primary rounded-2xl p-2.5 shadow-md transition-all">
              <textarea
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit(chatPrompt);
                  }
                }}
                placeholder="Talk to Deadline Guardian AI... e.g., 'Schedule study session due tomorrow high priority'"
                rows={2}
                className="flex-1 text-sm bg-transparent border-none text-brand-input-text placeholder-brand-placeholder focus:outline-none resize-none leading-relaxed h-[50px] pl-1 pr-10"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {/* Micro microphone trigger */}
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-brand-placeholder hover:text-brand-heading hover:bg-brand-bg"
                  }`}
                  title="Speech to Text (Voice Creation)"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  disabled={isProcessing || !chatPrompt.trim()}
                  onClick={() => handleChatSubmit(chatPrompt)}
                  className="p-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-brand-placeholder font-bold flex items-center gap-1 leading-none">
                <CornerDownLeft className="w-3 h-3" /> Press Enter to schedule automatically
              </p>
              {isRecording && (
                <span className="flex items-center gap-1 text-[10px] text-rose-500 font-extrabold animate-pulse leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Transcribing voice...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE TARGET AREA (7 COLS) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* FILTERING & SEARCH PANEL */}
          <div className="p-5 bg-brand-card rounded-2xl border border-brand-border shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-brand-placeholder" />
                <input
                  type="text"
                  placeholder="Query names, descriptions, or #tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-brand-bg border border-brand-border focus:border-brand-primary focus:outline-none rounded-xl text-sm text-brand-input-text placeholder-brand-placeholder transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCategory("all");
                    setFilterPriority("all");
                    setFilterStatus("all");
                    showToast("Filters Reset", "Showing all active tasks.", "info");
                  }}
                  className="px-4 h-11 bg-brand-bg hover:bg-brand-border border border-brand-border rounded-xl text-xs font-bold text-brand-secondary transition-colors cursor-pointer shrink-0"
                >
                  RESET
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Health">Health</option>
                  <option value="Personal">Personal</option>
                  <option value="Finance">Finance</option>
                  <option value="Projects">Projects</option>
                  <option value="Interview Preparation">Interview Prep</option>
                  <option value="Coding Practice">Coding Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="low">Low Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full h-10 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* ================= VIEW 1: TASK LIST VIEW ================= */}
          {activeLayout === "list" && (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-16 text-center bg-brand-card rounded-2xl border border-brand-border shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-brand-placeholder mx-auto mb-4" />
                  <p className="font-extrabold text-brand-heading text-lg">No Tasks Found</p>
                  <p className="text-sm text-brand-secondary mt-1">Try querying a different keyword or describe a new task to your AI assistant!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    // Calculate progress based on subtasks
                    const totalSub = task.subtasks?.length || 0;
                    const doneSub = (task.subtaskCompletion || []).filter(x => x).length;
                    const progressPercent = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : (task.completed ? 100 : 0);

                    // Check if is at risk
                    const isAtRisk = !task.completed && (task.priority === "critical" || task.priority === "high");

                    return (
                      <div
                        key={task.id}
                        className={`p-6 bg-brand-card rounded-2xl border transition-all hover:shadow-md flex flex-col md:flex-row md:items-start justify-between gap-5 relative overflow-hidden ${
                          task.completed
                            ? "opacity-70 border-brand-border"
                            : isAtRisk
                            ? "border-rose-200 dark:border-rose-900 shadow-sm shadow-rose-50/10"
                            : "border-brand-border"
                        }`}
                      >
                        {/* Task completion checkbox accent line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          task.completed
                            ? "bg-slate-300"
                            : task.priority === "critical"
                            ? "bg-rose-500"
                            : task.priority === "high"
                            ? "bg-amber-500"
                            : "bg-brand-primary"
                        }`} />

                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Standard interactive completion toggle */}
                          <button
                            onClick={() => {
                              toggleTask(task.id);
                              showToast(
                                task.completed ? "Task Reopened" : "Task Completed",
                                `"${task.title}" updated successfully!`,
                                "success"
                              );
                            }}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer mt-0.5 transition-all shrink-0 ${
                              task.completed
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-brand-border hover:border-brand-primary hover:bg-brand-primary/5"
                            }`}
                          >
                            {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>

                          <div className="space-y-2.5 flex-1 min-w-0">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className={`text-base font-extrabold leading-snug truncate ${task.completed ? "line-through text-brand-placeholder" : "text-brand-heading"}`}>
                                  {task.title}
                                </h4>
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  task.priority === "critical"
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                                    : task.priority === "high"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {task.priority}
                                </span>
                                {task.aiStatus && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> {task.aiStatus}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-xs text-brand-secondary mt-1 max-w-xl font-medium leading-relaxed italic">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Core stats block */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-brand-secondary">
                              <span className="px-2.5 py-0.5 bg-brand-bg rounded-lg text-brand-heading font-bold text-[10px] uppercase">
                                {task.category}
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-brand-placeholder" />
                                {task.estimatedHours}h effort
                              </span>
                              {task.deadline && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <Calendar className="w-3.5 h-3.5 text-brand-placeholder" />
                                  Due {new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                              {task.dependencies && task.dependencies !== "None" && (
                                <span className="flex items-center gap-1 text-[11px] text-brand-primary font-bold shrink-0">
                                  <Link2 className="w-3.5 h-3.5 text-brand-primary" />
                                  Needs: {task.dependencies}
                                </span>
                              )}
                            </div>

                            {/* Tags list */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {task.tags.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold text-brand-secondary bg-brand-bg border border-brand-border px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Progress bar based on subtask checklist */}
                            <div className="space-y-1.5 pt-1.5 border-t border-brand-border/60 max-w-md">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-brand-secondary uppercase">Task Progression</span>
                                <span className="text-brand-heading">{progressPercent}% Completed</span>
                              </div>
                              <div className="w-full bg-brand-bg rounded-full h-1.5 overflow-hidden border border-brand-border/40">
                                <div
                                  style={{ width: `${progressPercent}%` }}
                                  className="bg-brand-primary h-full rounded-full transition-all duration-300"
                                />
                              </div>
                            </div>

                            {/* Detailed Subtasks checklist */}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="space-y-1.5 pt-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder">Action Checkpoints:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {task.subtasks.map((st, sIndex) => {
                                    const isDone = task.subtaskCompletion?.[sIndex] || false;
                                    return (
                                      <button
                                        key={sIndex}
                                        onClick={() => toggleSubtask(task.id, sIndex)}
                                        className={`p-2 rounded-lg border text-left flex items-start gap-2 transition-all text-xs font-semibold cursor-pointer ${
                                          isDone
                                            ? "bg-brand-bg border-brand-border text-brand-placeholder line-through"
                                            : "bg-brand-card hover:bg-brand-bg border-brand-border text-brand-heading"
                                        }`}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                          isDone ? "bg-brand-primary border-brand-primary text-white" : "border-brand-placeholder"
                                        }`}>
                                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <span className="truncate">{st}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick action buttons block */}
                        <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 border-brand-border pt-3 md:pt-0">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-2 text-brand-placeholder hover:text-brand-heading transition-colors cursor-pointer rounded-xl hover:bg-brand-bg text-xs font-bold flex items-center gap-1"
                            title="Edit with AI Help"
                          >
                            <Sliders className="w-4 h-4" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              setActivePage("calendar");
                              showToast("Calendar View", "Reviewing scheduled timeline.", "info");
                            }}
                            className="p-2 text-brand-placeholder hover:text-brand-primary transition-colors cursor-pointer rounded-xl hover:bg-brand-bg text-xs font-bold flex items-center gap-1"
                            title="Open in Calendar Timeline"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Agenda</span>
                          </button>

                          <button
                            onClick={() => {
                              setChatPrompt(`Review and optimize task: "${task.title}"`);
                              showToast("AI Context Setup", "Starting optimization chat for this task.", "info");
                              chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="p-2 text-brand-placeholder hover:text-brand-primary transition-colors cursor-pointer rounded-xl hover:bg-brand-bg text-xs font-bold flex items-center gap-1"
                            title="Consult Guardian AI"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Ask AI</span>
                          </button>

                          <button
                            onClick={() => {
                              deleteTask(task.id);
                              showToast("Task Deleted", "Removed task from active focus.", "alert");
                            }}
                            className="p-2 text-brand-placeholder hover:text-brand-danger transition-colors cursor-pointer rounded-xl hover:bg-brand-bg text-xs font-bold flex items-center gap-1"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 2: KANBAN BOARD VIEW ================= */}
          {activeLayout === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Planned / To Do */}
              <div className="p-4 bg-brand-bg/50 rounded-2xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">Planned</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-bg text-[10px] text-brand-secondary font-bold">
                    {filteredTasks.filter(t => !t.completed && (kanbanSimColumn[t.id] || "planned") === "planned").length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredTasks.filter(t => !t.completed && (kanbanSimColumn[t.id] || "planned") === "planned").map(t => (
                    <div key={t.id} className="p-4 bg-brand-card rounded-xl shadow-sm border border-brand-border space-y-3 hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold uppercase text-brand-primary tracking-wide">{t.category}</p>
                      <h5 className="text-sm font-extrabold text-brand-heading leading-snug">{t.title}</h5>
                      <div className="flex justify-between items-center pt-2 border-t border-brand-border/60">
                        <span className="text-[10px] text-brand-secondary font-bold">{t.estimatedHours}h effort</span>
                        <button
                          onClick={() => moveKanbanTask(t.id, "progress")}
                          className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Start <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => !t.completed && (kanbanSimColumn[t.id] || "planned") === "planned").length === 0 && (
                    <p className="text-xs text-brand-placeholder py-8 text-center font-bold">No planned items</p>
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="p-4 bg-brand-bg/50 rounded-2xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">Working</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-bg text-[10px] text-brand-secondary font-bold">
                    {filteredTasks.filter(t => !t.completed && kanbanSimColumn[t.id] === "progress").length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredTasks.filter(t => !t.completed && kanbanSimColumn[t.id] === "progress").map(t => (
                    <div key={t.id} className="p-4 bg-brand-card rounded-xl shadow-sm border border-amber-100 dark:border-amber-950/40 space-y-3 hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wide">{t.category}</p>
                      <h5 className="text-sm font-extrabold text-brand-heading leading-snug">{t.title}</h5>
                      <div className="flex justify-between items-center pt-2 border-t border-brand-border/60">
                        <span className="text-[10px] text-brand-secondary font-bold">{t.estimatedHours}h effort</span>
                        <button
                          onClick={() => moveKanbanTask(t.id, "completed")}
                          className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Complete <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => !t.completed && kanbanSimColumn[t.id] === "progress").length === 0 && (
                    <p className="text-xs text-brand-placeholder py-8 text-center font-bold">No active tasks</p>
                  )}
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="p-4 bg-brand-bg/50 rounded-2xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">Completed</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-bg text-[10px] text-brand-secondary font-bold">
                    {filteredTasks.filter(t => t.completed).length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredTasks.filter(t => t.completed).map(t => (
                    <div key={t.id} className="p-4 bg-brand-card rounded-xl shadow-sm border border-brand-border space-y-3 opacity-65 hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold uppercase text-emerald-600 tracking-wide">COMPLETED</p>
                      <h5 className="text-sm font-extrabold text-brand-secondary line-through leading-snug truncate">{t.title}</h5>
                      <div className="flex justify-between items-center pt-2 border-t border-brand-border/60">
                        <span className="text-[10px] text-brand-secondary font-bold">Finished</span>
                        <button
                          onClick={() => moveKanbanTask(t.id, "planned")}
                          className="text-[11px] font-bold text-brand-secondary hover:underline cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.completed).length === 0 && (
                    <p className="text-xs text-brand-placeholder py-8 text-center font-bold">No completed items</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: SCHEDULE / AGENDA TIMELINE VIEW ================= */}
          {activeLayout === "calendar" && (
            <div className="bg-brand-card rounded-2xl border border-brand-border shadow-md p-6 lg:p-8 space-y-6">
              <h3 className="text-xl font-extrabold text-brand-heading flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-primary" /> Active Guardian Agenda
              </h3>
              <p className="text-xs text-brand-secondary font-semibold uppercase tracking-wider">
                Chronological schedule optimization list:
              </p>

              <div className="space-y-6">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-brand-placeholder py-12 text-center font-bold">No agendas scheduled.</p>
                ) : (
                  // Sort chronologically by deadline
                  [...filteredTasks]
                    .sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())
                    .map((t) => {
                      const dateObj = t.deadline ? new Date(t.deadline) : new Date();
                      return (
                        <div key={t.id} className="flex gap-4">
                          {/* Left calendar date badge */}
                          <div className="w-16 flex flex-col items-center justify-center p-3 rounded-xl bg-brand-bg border border-brand-border shrink-0">
                            <span className="text-[9px] uppercase text-brand-primary font-black tracking-widest">
                              {dateObj.toLocaleDateString([], { weekday: "short" })}
                            </span>
                            <span className="text-xl font-extrabold text-brand-heading mt-0.5">
                              {dateObj.toLocaleDateString([], { day: "numeric" })}
                            </span>
                          </div>

                          {/* Agenda Details card */}
                          <div className="flex-1 p-4 rounded-xl border border-brand-border bg-brand-card flex items-center justify-between min-w-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="pr-2 min-w-0 space-y-1">
                              <p className="text-sm font-extrabold text-brand-heading truncate">{t.title}</p>
                              <div className="flex items-center gap-2 text-xs text-brand-secondary">
                                <span className="px-1.5 py-0.5 bg-brand-bg rounded font-bold text-[10px] text-brand-heading">
                                  {t.category}
                                </span>
                                <span>• Time: {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase shrink-0 ${
                              t.priority === "critical"
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                                : "bg-slate-100 dark:bg-slate-800 text-brand-secondary"
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= EDIT / REFINEMENT MODAL ================= */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-brand-bg/60 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                <h3 className="font-extrabold text-brand-heading text-base">AI Task Refinement Console</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 text-brand-placeholder hover:text-brand-heading cursor-pointer rounded-lg hover:bg-brand-bg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* AI REFINEMENT QUICK COMMANDS (THE COGNITIVE INPUT BOX) */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase">
                  <Sparkles className="w-4 h-4 animate-spin-slow" /> Guard Command Line Refinement
                </div>
                <p className="text-[11px] text-brand-secondary font-medium leading-relaxed">
                  Type instructions like <span className="font-bold underline text-brand-heading">"split into checklist steps"</span>, <span className="font-bold underline text-brand-heading">"postpone to Friday"</span>, or <span className="font-bold underline text-brand-heading">"increase priority"</span> to automatically update the form properties below.
                </p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiRefinementCommand}
                    onChange={(e) => setAiRefinementCommand(e.target.value)}
                    placeholder="e.g., Postpone to next Friday and set priority to critical"
                    className="flex-1 h-10 px-3 text-xs bg-brand-bg border border-brand-border rounded-lg text-brand-heading placeholder-brand-placeholder focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAIRefine();
                      }
                    }}
                  />
                  <button
                    onClick={handleAIRefine}
                    disabled={isRefining || !aiRefinementCommand.trim()}
                    className="px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isRefining ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" /> REFINE
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* STANDARD PARAMETER INPUT FORM */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Task Objective Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full h-11 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Category Class</label>
                    <select
                      value={editCategory}
                      onChange={(e: any) => setEditCategory(e.target.value)}
                      className="w-full h-11 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="Work">Work</option>
                      <option value="Study">Study</option>
                      <option value="Health">Health</option>
                      <option value="Personal">Personal</option>
                      <option value="Finance">Finance</option>
                      <option value="Projects">Projects</option>
                      <option value="Interview Preparation">Interview Prep</option>
                      <option value="Coding Practice">Coding Practice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Description Context</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e: any) => setEditPriority(e.target.value)}
                      className="w-full h-10 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Estimated Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={editHours}
                      onChange={(e) => setEditHours(parseFloat(e.target.value) || 1)}
                      className="w-full h-10 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Difficulty Depth</label>
                    <select
                      value={editDifficulty}
                      onChange={(e: any) => setEditDifficulty(e.target.value)}
                      className="w-full h-10 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Due Deadline</label>
                    <input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full h-11 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading focus:outline-none cursor-pointer font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1.5">Hashtags / Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="#coding, #assignment"
                      className="w-full h-11 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-heading focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs border-t border-brand-border/60 pt-4 text-brand-secondary font-semibold">
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1">Schedule Loop</span>
                    <input
                      type="text"
                      value={editSchedule}
                      onChange={(e) => setEditSchedule(e.target.value)}
                      className="w-full h-9 px-2 bg-brand-bg border border-brand-border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1">Dependencies</span>
                    <input
                      type="text"
                      value={editDependencies}
                      onChange={(e) => setEditDependencies(e.target.value)}
                      className="w-full h-9 px-2 bg-brand-bg border border-brand-border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder mb-1">Related Goal Link</span>
                    <input
                      type="text"
                      value={editRelatedGoals}
                      onChange={(e) => setEditRelatedGoals(e.target.value)}
                      className="w-full h-9 px-2 bg-brand-bg border border-brand-border rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Subtask editing Checklist */}
                <div className="space-y-2 border-t border-brand-border/60 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-placeholder">Checkpoint Steps Checklist</label>
                    <button
                      onClick={() => setEditSubtasks([...editSubtasks, `Checkpoint ${editSubtasks.length + 1}`])}
                      className="text-[10px] font-extrabold text-brand-primary hover:underline cursor-pointer"
                    >
                      + ADD ACTION STEP
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {editSubtasks.map((st, sIdx) => (
                      <div key={sIdx} className="flex gap-2 items-center">
                        <span className="text-xs text-brand-primary font-bold">{sIdx + 1}.</span>
                        <input
                          type="text"
                          value={st}
                          onChange={(e) => {
                            const list = [...editSubtasks];
                            list[sIdx] = e.target.value;
                            setEditSubtasks(list);
                          }}
                          className="flex-1 h-8 px-2 bg-brand-bg border border-brand-border rounded text-xs text-brand-heading"
                        />
                        <button
                          onClick={() => setEditSubtasks(editSubtasks.filter((_, idx) => idx !== sIdx))}
                          className="p-1 hover:text-brand-danger text-slate-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {editSubtasks.length === 0 && (
                      <p className="text-[11px] text-brand-placeholder py-3 text-center italic">No micro check steps defined.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-brand-bg/60 border-t border-brand-border flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 hover:bg-brand-border text-xs font-bold text-brand-secondary rounded-lg transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
              >
                SAVE CHANGES
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
