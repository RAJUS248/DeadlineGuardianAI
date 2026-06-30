import React, { useState, useRef, useEffect } from "react";
import { useApp } from "./AppContext";
import { fetchAICoach } from "../lib/store";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Brain,
  Send,
  Sparkles,
  User,
  Trash2,
  Plus,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Award,
  Menu,
  MoreVertical,
  Copy,
  Edit,
  Check,
  X,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export const CoachPage: React.FC = () => {
  const {
    userProfile,
    tasks,
    habits,
    goals,
    activities,
    addActivity,
    events,
    analyticsData,
    addTask,
    addNotification,
    showToast
  } = useApp();

  // Helper to parse AI Coach schedules, plans, and roadmaps into interactive Tasks/CalendarEvents
  const autoCreateWorkspaceDataFromCoachReply = (text: string) => {
    const lines = text.split("\n");
    let tasksCreated = 0;
    const todayStr = new Date().toISOString().substring(0, 10);

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (/^[-*+]\s+/.test(cleanLine) || /^\d+\.\s+/.test(cleanLine) || /^\[\s*\]\s+/.test(cleanLine)) {
        let taskTitle = cleanLine
          .replace(/^[-*+]\s+/, "")
          .replace(/^\d+\.\s+/, "")
          .replace(/^\[\s*\]\s+/, "")
          .replace(/\*\*|__/g, "")
          .trim();

        if (
          taskTitle.length > 5 &&
          taskTitle.length < 120 &&
          !taskTitle.toLowerCase().includes("http") &&
          !taskTitle.toLowerCase().includes("image") &&
          !taskTitle.toLowerCase().includes("roadmap:") &&
          !taskTitle.toLowerCase().includes("schedule:")
        ) {
          const alreadyExists = tasks.some(t => t.title.toLowerCase() === taskTitle.toLowerCase());
          if (!alreadyExists) {
            let startTime = `${todayStr}T09:00:00`;
            let endTime = `${todayStr}T10:00:00`;
            let duration = 1.0;

            const timeMatch = taskTitle.match(/(\d+(?::\d+)?\s*(?:AM|PM)?)\s*[-–—]\s*(\d+(?::\d+)?\s*(?:AM|PM)?)/i);
            if (timeMatch) {
              const parseSingleTime = (timeStr: string) => {
                const match = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
                if (match) {
                  let hr = parseInt(match[1]);
                  const min = match[2] || "00";
                  const ampm = (match[3] || "AM").toUpperCase();
                  if (ampm === "PM" && hr < 12) hr += 12;
                  if (ampm === "AM" && hr === 12) hr = 0;
                  return `${String(hr).padStart(2, "0")}:${min}:00`;
                }
                return null;
              };

              const s = parseSingleTime(timeMatch[1]);
              const e = parseSingleTime(timeMatch[2]);
              if (s && e) {
                startTime = `${todayStr}T${s}`;
                endTime = `${todayStr}T${e}`;
                const [sh, sm] = s.split(":").map(Number);
                const [eh, em] = e.split(":").map(Number);
                duration = (eh - sh) + (em - sm) / 60;
                if (duration < 0) duration += 24;
              }
            }

            addTask(
              taskTitle,
              "high",
              "Study",
              "medium",
              duration,
              startTime
            );
            tasksCreated++;
          }
        }
      }
    });

    if (tasksCreated > 0) {
      addNotification(
        "Coach Schedule Synchronized",
        `AI Coach added ${tasksCreated} actionable milestone tasks & calendar events to your active workspace automatically.`,
        "streak",
        "high",
        "Coach Autoparser"
      );
      showToast(
        "Coach Schedule Synced",
        `Created ${tasksCreated} new tasks and synchronized them across your entire active workspace.`,
        "success"
      );
    }
  };

  // Multi-conversation state
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("coaching_conversations_v3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    const userName = userProfile?.name || "Raju";
    const initChat: Conversation = {
      id: "chat-init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title: "Active Agenda Sprint",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "init",
          role: "assistant",
          content: `Welcome to the Premium AI Coach. Let's build a flawless workflow strategy today.\n\nI have analyzed your **${tasks.filter(t => !t.completed).length} pending tasks**, **${habits.length} habits**, and **${goals.length} goals**. How can I assist you with your active workload objectives right now?`,
          suggestions: [
            "Optimize today's agenda",
            "Explain why I procrastinate",
            "Give me high-focus interval tips",
            "Recommend a sprint breakdown"
          ]
        }
      ]
    };
    return [initChat];
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const lastActive = localStorage.getItem("coaching_active_chat_id_v3");
    return lastActive || "";
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);

  // Editing & deletion states
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showClearCurrentConfirm, setShowClearCurrentConfirm] = useState(false);

  // Save changes to local storage
  useEffect(() => {
    localStorage.setItem("coaching_conversations_v3", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem("coaching_active_chat_id_v3", activeChatId);
    }
  }, [activeChatId]);

  // Ensure activeChatId is valid and defaults correctly
  useEffect(() => {
    if (conversations.length > 0) {
      const exists = conversations.some(c => c.id === activeChatId);
      if (!exists) {
        setActiveChatId(conversations[0].id);
      }
    }
  }, [conversations, activeChatId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeChatId, loading]);

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0] || null;

  const generateTitleFromMessage = (msg: string): string => {
    const clean = msg.trim().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const words = clean.split(/\s+/);
    if (words.length <= 4) {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
    return words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") + "...";
  };

  const createNewChat = (customTitle?: string) => {
    const newId = "chat-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
    const newChat: Conversation = {
      id: newId,
      title: customTitle || "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
          role: "assistant",
          content: `Welcome to your new chat session. Ask me to optimize your day, explain procrastination, or structure a custom learning plan.`,
          suggestions: [
            "Optimize today's agenda",
            "Explain why I procrastinate",
            "Give me high-focus interval tips",
            "Recommend a sprint breakdown"
          ]
        }
      ]
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    addActivity("Created a new AI Coach session", "system");
    setIsMobileSidebarOpen(false);
    return newChat;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading || !activeChat) return;

    const userMessage: Message = { id: "msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), role: "user", content: textToSend };
    
    // Add user message to active conversation immediately
    setConversations(prev => {
      return prev.map(c => {
        if (c.id === activeChat.id) {
          const updatedMessages = [...c.messages, userMessage];
          
          // Auto generate title after first user message if title is default "New Chat"
          let newTitle = c.title;
          const userMsgCount = c.messages.filter(m => m.role === "user").length;
          if (c.title === "New Chat" && userMsgCount === 0) {
            newTitle = generateTitleFromMessage(textToSend);
          }

          return {
            ...c,
            title: newTitle,
            messages: updatedMessages,
            updatedAt: Date.now()
          };
        }
        return c;
      });
    });

    setInput("");
    setLoading(true);

    try {
      const history = [...activeChat.messages, userMessage].map(m => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        content: m.content
      }));

      const contextToSend = {
        userProfile,
        tasks,
        habits,
        goals,
        events,
        analyticsData,
        currentTime: new Date().toISOString(),
        currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      };

      const response = await fetchAICoach(history, textToSend, contextToSend as any);

      // Trigger automatic workspace synchronization from Coach's suggestions/schedules
      autoCreateWorkspaceDataFromCoachReply(response.response);

      const newBotMsg: Message = {
        id: "bot-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
        role: "assistant",
        content: response.response,
        suggestions: response.actionSuggestions,
      };

      setConversations(prev => {
        return prev.map(c => {
          if (c.id === activeChat.id) {
            return {
              ...c,
              messages: [...c.messages, newBotMsg],
              updatedAt: Date.now()
            };
          }
          return c;
        });
      });
      addActivity(`Inquired AI Coach: "${textToSend.substring(0, 30)}..."`, "system");
    } catch (e) {
      console.error(e);
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === activeChat.id) {
            return {
              ...c,
              messages: [
                ...c.messages,
                { id: "err-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), role: "assistant", content: "Apologies, the AI coach service is temporarily resting. Please try again soon." }
              ],
              updatedAt: Date.now()
            };
          }
          return c;
        });
      });
    } finally {
      setLoading(false);
    }
  };

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditingTitle(currentTitle);
    setActiveMenuChatId(null);
  };

  const handleRenameSave = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editingTitle.trim(), updatedAt: Date.now() } : c));
    }
    setEditingChatId(null);
  };

  const duplicateChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chatToDup = conversations.find(c => c.id === id);
    if (!chatToDup) return;

    const newId = "chat-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
    const duplicated: Conversation = {
      ...chatToDup,
      id: newId,
      title: `${chatToDup.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: chatToDup.messages.map(m => ({ ...m }))
    };

    setConversations(prev => [duplicated, ...prev]);
    setActiveChatId(newId);
    addActivity(`Duplicated chat session: "${chatToDup.title}"`, "system");
    setActiveMenuChatId(null);
    setIsMobileSidebarOpen(false);
  };

  const confirmDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmChatId(id);
    setActiveMenuChatId(null);
  };

  const handleDeleteChat = () => {
    if (!deleteConfirmChatId) return;
    
    const updated = conversations.filter(c => c.id !== deleteConfirmChatId);
    setConversations(updated);
    
    if (activeChatId === deleteConfirmChatId) {
      if (updated.length > 0) {
        setActiveChatId(updated[0].id);
      } else {
        const newChat: Conversation = {
          id: "chat-init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
          title: "New Chat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: "init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
              role: "assistant",
              content: `Welcome to your new chat session. Ask me to optimize your day, explain procrastination, or structure a custom learning plan.`,
              suggestions: [
                "Optimize today's agenda",
                "Explain why I procrastinate",
                "Give me high-focus interval tips",
                "Recommend a sprint breakdown"
              ]
            }
          ]
        };
        setConversations([newChat]);
        setActiveChatId(newChat.id);
      }
    }
    
    addActivity(`Deleted chat session`, "system");
    setDeleteConfirmChatId(null);
  };

  const handleClearCurrentChat = () => {
    if (!activeChat) return;
    setConversations(prev => prev.map(c => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [
            {
              id: "init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
              role: "assistant" as const,
              content: `Chat cleared. Ask me anything to restart the strategy!`,
              suggestions: [
                "Optimize today's agenda",
                "Explain why I procrastinate",
                "Give me high-focus interval tips",
                "Recommend a sprint breakdown"
              ]
            }
          ],
          updatedAt: Date.now()
        };
      }
      return c;
    }));
    addActivity("Cleared active chat messages", "system");
    setShowClearCurrentConfirm(false);
  };

  const handleDeleteAllChats = () => {
    const newChat = {
      id: "chat-init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "init-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
          role: "assistant" as const,
          content: `Welcome to your new chat session. Ask me to optimize your day, explain procrastination, or structure a custom learning plan.`,
          suggestions: [
            "Optimize today's agenda",
            "Explain why I procrastinate",
            "Give me high-focus interval tips",
            "Recommend a sprint breakdown"
          ]
        }
      ]
    };
    setConversations([newChat]);
    setActiveChatId(newChat.id);
    addActivity("Deleted all conversations", "system");
    setShowDeleteAllConfirm(false);
  };

  // Grouping Chats by Time buckets
  const groupConversations = (chats: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {
      "Today": [],
      "Yesterday": [],
      "Previous 7 Days": [],
      "Previous 30 Days": [],
      "Older": []
    };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    chats.forEach((c) => {
      const diff = now - c.updatedAt;
      if (diff < oneDay) {
        groups["Today"].push(c);
      } else if (diff < 2 * oneDay) {
        groups["Yesterday"].push(c);
      } else if (diff < 7 * oneDay) {
        groups["Previous 7 Days"].push(c);
      } else if (diff < 30 * oneDay) {
        groups["Previous 30 Days"].push(c);
      } else {
        groups["Older"].push(c);
      }
    });

    return groups;
  };

  // Filter conversations according to search box
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = c.title.toLowerCase().includes(query);
    const matchesMessages = c.messages.some(m => m.content.toLowerCase().includes(query));
    return matchesTitle || matchesMessages;
  });

  const groupedChats = groupConversations(filteredConversations);

  // Render lists of grouped chats in sidebar
  const renderSidebarChatsList = () => {
    const activeGroups = Object.keys(groupedChats).filter(
      key => groupedChats[key] && groupedChats[key].length > 0
    );

    if (activeGroups.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-brand-secondary italic">
          No matching chats found
        </div>
      );
    }

    return activeGroups.map(groupName => (
      <div key={groupName} className="space-y-1.5 mb-5">
        <span className="text-[10px] uppercase font-black text-brand-placeholder tracking-widest block px-2 mb-1">
          {groupName}
        </span>
        <div className="space-y-1">
          {groupedChats[groupName].map(c => {
            const isActive = c.id === activeChatId;
            const isEditing = editingChatId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => {
                  if (!isEditing) {
                    setActiveChatId(c.id);
                    setIsMobileSidebarOpen(false);
                  }
                }}
                className={`group relative p-3 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all border font-bold ${
                  isActive
                    ? "bg-slate-100/90 dark:bg-slate-800/80 text-brand-heading border-brand-border/60"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-brand-secondary border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-primary" : "text-brand-placeholder"}`} />
                  
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleRenameSave(c.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 w-full"
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="bg-brand-input-bg border border-brand-input-border text-brand-input-text rounded px-1.5 py-0.5 text-[11px] font-semibold w-full outline-none"
                        autoFocus
                      />
                      <button type="submit" className="p-0.5 text-brand-success hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(null);
                        }}
                        className="p-0.5 text-brand-danger hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate pr-1 select-none">{c.title}</span>
                  )}
                </div>

                {/* Switch indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-primary rounded-r" />
                )}

                {/* Dropdown menu trigger */}
                {!isEditing && (
                  <div className="relative shrink-0 flex items-center opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuChatId(activeMenuChatId === c.id ? null : c.id);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all text-brand-placeholder hover:text-brand-heading"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Chat dropup menu */}
                    {activeMenuChatId === c.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-6 z-40 w-32 bg-brand-card border border-brand-border rounded-lg shadow-xl p-1 animate-scale-up"
                      >
                        <button
                          onClick={(e) => startRename(c.id, c.title, e)}
                          className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-heading font-semibold text-[11px] rounded flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5 text-indigo-500" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => duplicateChat(c.id, e)}
                          className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-heading font-semibold text-[11px] rounded flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-500" />
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => confirmDeleteChat(c.id, e)}
                          className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-danger font-semibold text-[11px] rounded flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  const renderSidebarContent = () => {
    return (
      <div className="flex flex-col h-full bg-brand-sidebar p-4 justify-between select-none">
        <div className="space-y-5 flex-1 flex flex-col min-h-0">
          {/* Create New Chat Session Button */}
          <button
            onClick={() => createNewChat()}
            className="w-full h-11 bg-brand-primary hover:bg-brand-primary-hover active:scale-98 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 justify-center shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            New Chat Session
          </button>

          {/* Search Box */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-brand-placeholder absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-3 text-xs bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none focus:border-brand-primary font-semibold transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3.5 text-brand-placeholder hover:text-brand-heading"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Scrollable List Container */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-none space-y-4">
            {renderSidebarChatsList()}
          </div>
        </div>

        {/* Bottom Sidebar Management Panel */}
        <div className="pt-4 border-t border-brand-border space-y-2 shrink-0">
          <button
            onClick={() => setShowClearCurrentConfirm(true)}
            className="w-full h-9 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-secondary text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
          >
            Clear Current Chat
          </button>
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="w-full h-9 hover:bg-rose-50 hover:text-brand-danger dark:hover:bg-red-950/25 text-brand-secondary text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All Chats
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex gap-0 lg:gap-8 select-none animate-fade-in w-full max-w-full h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] min-h-[450px]">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden lg:flex w-72 flex-col bg-brand-sidebar border border-brand-border rounded-2xl overflow-hidden shadow-xs shrink-0">
        {renderSidebarContent()}
      </div>

      {/* ================= MOBILE/TABLET SIDEBAR DRAWER OVERLAY ================= */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[85vw] h-full bg-brand-sidebar border-r border-brand-border shadow-2xl z-10"
            >
              <div className="h-full flex flex-col justify-between">
                {renderSidebarContent()}
              </div>

              {/* Close Drawer Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute right-[-45px] top-3.5 p-2 bg-brand-sidebar border border-brand-border rounded-xl text-brand-heading shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MAIN CHAT WINDOW CONTAINER ================= */}
      <div className="flex-1 flex flex-col bg-transparent lg:bg-brand-card lg:border lg:border-brand-border lg:rounded-2xl overflow-hidden justify-between w-full max-w-full">
        {/* Chat Header */}
        <div className="px-4 py-3.5 lg:px-6 lg:py-4 border-b border-brand-border flex items-center justify-between bg-transparent lg:bg-slate-50/50 lg:dark:bg-slate-900/10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger icon for mobile / tablet triggers sidebar */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 lg:hidden text-brand-secondary hover:text-brand-heading rounded-xl border border-brand-border bg-brand-card hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary shrink-0 hidden sm:block">
              <Brain className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-brand-heading truncate">
                {activeChat ? activeChat.title : "Productivity Coach"}
              </h2>
              <p className="text-xs text-brand-secondary font-semibold truncate hidden sm:block">Generates hourly study schedules and task strategies</p>
            </div>
          </div>

          <button
            onClick={() => setShowClearCurrentConfirm(true)}
            className="p-2 text-brand-secondary hover:text-brand-danger rounded-xl transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log Area (Scrolling, handles rendering cleanly) */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto select-text scrollbar-none min-h-0">
          {activeChat && activeChat.messages.map((m) => {
            const isBot = m.role === "assistant";
            return (
              <div key={m.id} className={`flex items-start gap-3.5 ${!isBot ? "justify-end" : "justify-start"}`}>
                {isBot && (
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-brand-primary dark:bg-indigo-950/50 flex items-center justify-center text-xs font-black shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                    AI
                  </div>
                )}

                <div className={`max-w-[88%] md:max-w-[78%] space-y-2.5 ${!isBot ? "text-right" : ""}`}>
                  <div className={`text-base leading-relaxed ${
                    isBot 
                      ? "text-brand-heading font-medium text-left bg-transparent py-1" 
                      : "bg-[#4F46E5] dark:bg-[#6366F1] text-white p-4 rounded-2xl text-left inline-block shadow-sm"
                  }`}>
                    {isBot ? (
                      <MarkdownRenderer content={m.content} />
                    ) : (
                      <p className="whitespace-pre-line text-sm font-semibold">{m.content}</p>
                    )}
                  </div>

                  {/* Suggestions bubbles under Bot message */}
                  {isBot && m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 justify-start">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="px-3.5 py-1.5 bg-brand-card hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-brand-primary border border-brand-input-border rounded-xl text-xs font-bold cursor-pointer transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-brand-primary dark:bg-indigo-950/50 flex items-center justify-center text-xs font-black shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                AI
              </div>
              <div className="text-brand-secondary py-1 text-sm flex items-center gap-2.5 font-bold">
                <div className="flex gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{animationDelay: "0ms"}}></span>
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{animationDelay: "150ms"}}></span>
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{animationDelay: "300ms"}}></span>
                </div>
                Formulating optimal strategies...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ChatGPT Style Sticky Bottom Input Panel */}
        <div className="p-4 lg:p-5 border-t border-brand-border bg-transparent lg:bg-slate-50/20 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 bg-brand-card dark:bg-slate-900 border border-brand-input-border p-1.5 rounded-xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. Schedule my chemistry prep)..."
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent text-brand-input-text placeholder-brand-placeholder font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0 animate-fade-in"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
          <p className="text-[10px] text-brand-secondary text-center mt-2.5 font-bold uppercase tracking-wider">
            Powered by Gemini API. Full end-to-end strategy verification.
          </p>
        </div>
      </div>

      {/* ================= SYSTEM MODALS / OVERLAYS ================= */}
      
      {/* 1. Delete Single Chat Confirm Modal */}
      <AnimatePresence>
        {deleteConfirmChatId && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-brand-card p-6 rounded-2xl border border-brand-border shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-3 text-brand-danger">
                <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-black text-brand-heading uppercase tracking-wider">Delete Conversation?</h3>
                  <p className="text-xs text-brand-secondary mt-1 font-semibold">
                    This will permanently delete this conversation and all associated message history. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmChatId(null)}
                  className="h-10 px-4 border border-brand-border text-brand-secondary bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteChat}
                  className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Clear Current Chat Confirm Modal */}
      <AnimatePresence>
        {showClearCurrentConfirm && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-brand-card p-6 rounded-2xl border border-brand-border shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-3 text-brand-primary">
                <Brain className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-black text-brand-heading uppercase tracking-wider">Clear Current Chat?</h3>
                  <p className="text-xs text-brand-secondary mt-1 font-semibold">
                    This will empty all messages in this conversation. The conversation title will remain in your list.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearCurrentConfirm(false)}
                  className="h-10 px-4 border border-brand-border text-brand-secondary bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearCurrentChat}
                  className="h-10 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Clear Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Delete All Chats Confirm Modal */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-brand-card p-6 rounded-2xl border border-brand-border shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-3 text-brand-danger">
                <Trash2 className="w-6 h-6 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-base font-black text-brand-heading uppercase tracking-wider">Delete All Chats?</h3>
                  <p className="text-xs text-brand-secondary mt-1 font-semibold">
                    Are you absolutely sure you want to delete ALL conversations from history? This action is irreversible and will delete all stored message logs.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="h-10 px-4 border border-brand-border text-brand-secondary bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllChats}
                  className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
