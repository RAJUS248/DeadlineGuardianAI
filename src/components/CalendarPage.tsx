import React, { useState } from "react";
import { useApp } from "./AppContext";
import { CalendarEvent } from "../types";
import {
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  ListTodo,
  CheckCircle2,
} from "lucide-react";

const getLocalDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const CalendarPage: React.FC = () => {
  const {
    tasks,
    goals,
    habits,
    events,
    addEvent,
    deleteEvent,
    addActivity,
    googleCalConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncNow,
    lastSyncTime,
  } = useApp();

  // Initialize with the real exact local current date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");

  // AI Scheduling status
  const [isGenerating, setIsGenerating] = useState(false);

  // New Event Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<CalendarEvent["type"]>("meeting");
  const [eventTime, setEventTime] = useState("10:00");
  const [eventDate, setEventDate] = useState(getLocalDateISO(new Date()));

  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (view === "month") {
      nextDate.setMonth(currentDate.getMonth() - 1);
    } else if (view === "week") {
      nextDate.setDate(currentDate.getDate() - 7);
    } else {
      nextDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (view === "month") {
      nextDate.setMonth(currentDate.getMonth() + 1);
    } else if (view === "week") {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = `${eventDate}T${eventTime}:00`;
    const endISO = `${eventDate}T${String(parseInt(eventTime.split(":")[0] || "10") + 1).padStart(2, "0")}:00`;

    addEvent(title.trim(), startISO, endISO, eventType, "medium", "Created manually via Calendar Planner");
    addActivity(`Scheduled event: "${title.trim()}"`, "info");

    setTitle("");
    setIsModalOpen(false);
  };

  const handleAISchedule = () => {
    setIsGenerating(true);
    setTimeout(() => {
      addEvent(
        "[AI Focus] Deep Coding Routine",
        "2026-06-24T14:00:00",
        "2026-06-24T16:00:00",
        "ai_activity",
        "high",
        "Auto generated focus segment based on task weight."
      );
      addEvent(
        "[AI Focus] Essay Literature Review",
        "2026-06-25T10:00:00",
        "2026-06-25T11:30:00",
        "ai_activity",
        "medium",
        "Auto generated focus segment."
      );
      addActivity("Guardian AI auto-scheduled 2 optimal focus blocks!", "success");
      setIsGenerating(false);
    }, 1200);
  };

  // Dynamic aggregation: Unified array of calendar items (custom events, tasks, goals)
  const allItems: any[] = [...events];

  tasks.forEach((t) => {
    if (!t.deadline) return;
    allItems.push({
      id: `task-${t.id}`,
      title: `${t.title}`,
      start: t.deadline,
      type: "task",
      completed: t.completed,
      priority: t.priority
    });
  });

  goals.forEach((g) => {
    if (!g.targetDate) return;
    allItems.push({
      id: `goal-${g.id}`,
      title: `${g.title}`,
      start: `${g.targetDate}T09:00:00`,
      type: "project_milestone",
      completed: g.completed,
      priority: g.priority
    });
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const dayNameFormatted = currentDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const getItemBadgeStyle = (type: string, priority?: string) => {
    if (type === "task") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/40";
    }
    if (type === "project_milestone") {
      return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-900/40";
    }
    if (type === "ai_activity") {
      return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/40";
    }
    return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/25 dark:text-indigo-400 dark:border-indigo-900/40";
  };

  // Filter events for the selected day in Month View
  const selectedDayISO = getLocalDateISO(selectedDate);
  const selectedDayEvents = allItems.filter(item => item.start && item.start.split("T")[0] === selectedDayISO);

  return (
    <div className="space-y-6 select-none w-full max-w-full overflow-x-hidden animate-fade-in">
      
      {/* ================= PAGE HEADER & DESCRIPTION ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-6 border-b border-brand-border">
        <div className="space-y-1 md:space-y-2.5">
          <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-brand-primary">
            Schedule Hub
          </p>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-brand-heading leading-none">
            Time & Agenda
          </h1>
          <p className="text-sm md:text-base text-brand-secondary font-semibold">
            Cohesive calendar mapping deadlines, customized events, and optimal AI focus sessions.
          </p>
        </div>

        {/* Action Controls - 48px height touch targets */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleAISchedule}
            disabled={isGenerating}
            className="flex-1 lg:flex-none h-11 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/45 text-brand-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-900/30"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Scheduling..." : "AI Schedule"}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 lg:flex-none h-11 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Connection Status Banner */}
      {!googleCalConnected ? (
        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in ${
          lastSyncTime === "Expired" 
            ? "bg-red-50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/20" 
            : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              lastSyncTime === "Expired"
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
            }`}>
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-brand-heading">
                {lastSyncTime === "Expired" ? "Google Calendar Session Expired" : "Connect Google Calendar"}
              </h4>
              <p className="text-[11px] text-brand-secondary font-medium mt-0.5">
                {lastSyncTime === "Expired"
                  ? "Your authorization session has expired. Reconnect to resume bidirectional real-time sync."
                  : "Sync deadlines, schedules, reminders, and AI planner sessions bidirectionally."}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const { googleSignIn } = await import("../lib/firebaseAuth");
                const res = await googleSignIn();
                if (res?.accessToken) {
                  connectGoogleCalendar(res.accessToken);
                }
              } catch (e) {
                console.error("Sign in failed:", e);
              }
            }}
            className="w-full sm:w-auto h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shrink-0 shadow-sm"
          >
            {lastSyncTime === "Expired" ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-brand-heading">Google Calendar Connected</h4>
              <p className="text-[11px] text-brand-secondary font-medium mt-0.5">Bidirectional real-time schedule feed active. Last synced: {lastSyncTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={syncNow}
              className="flex-1 sm:flex-none h-9 px-4 bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-800 border border-brand-border text-brand-heading text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              Sync Now
            </button>
            <button
              onClick={disconnectGoogleCalendar}
              className="flex-1 sm:flex-none h-9 px-4 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* ================= CALENDAR VIEW CONTAINER ================= */}
      <div className="bg-transparent lg:bg-brand-card lg:border lg:border-brand-border lg:rounded-2xl lg:shadow-sm overflow-hidden w-full">
        
        {/* Navigation Header */}
        <div className="py-4 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent lg:bg-slate-50/50 lg:dark:bg-slate-900/10">
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <h2 className="text-lg md:text-xl font-extrabold text-brand-heading">
              {view === "day" ? dayNameFormatted : monthName}
            </h2>
            <div className="flex items-center border border-brand-border rounded-xl overflow-hidden bg-brand-card shadow-xs">
              <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-secondary cursor-pointer border-r border-brand-border transition-colors">
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-secondary cursor-pointer transition-colors">
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Segmented control for Views */}
          <div className="flex bg-brand-bg p-1 rounded-xl self-start sm:self-auto border border-brand-border overflow-x-auto max-w-full">
            {(["month", "week", "day", "agenda"] as const).map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => setView(viewOption)}
                className={`h-8 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
                  view === viewOption ? "bg-brand-card text-brand-heading shadow-xs border border-brand-border/40" : "text-brand-secondary hover:text-brand-heading"
                }`}
              >
                {viewOption}
              </button>
            ))}
          </div>
        </div>

        {/* ================= MONTH VIEW (Google Calendar Mobile Style: Dots + Day Agenda below) ================= */}
        {view === "month" && (
          <div className="py-4 space-y-6">
            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-[10px] font-black text-brand-placeholder uppercase tracking-widest px-1">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-1 bg-brand-border/10 rounded-2xl overflow-hidden border border-brand-border/40 p-1">
              {daysArray.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="bg-transparent min-h-[50px] md:min-h-[80px]" />;
                }

                const dayISO = getLocalDateISO(day);
                const dayEvents = allItems.filter(item => item.start && item.start.split("T")[0] === dayISO);
                const isSelected = selectedDate.toDateString() === day.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={dayISO}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[50px] md:min-h-[80px] p-1 flex flex-col items-center justify-between rounded-xl transition-all border border-transparent cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500/30" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <span className={`text-xs md:text-sm font-black flex w-7 h-7 items-center justify-center rounded-full shrink-0 ${
                      isToday 
                        ? "bg-brand-primary text-white shadow-xs" 
                        : isSelected 
                          ? "text-brand-primary font-black" 
                          : "text-brand-heading"
                    }`}>
                      {day.getDate()}
                    </span>

                    {/* Dot indicators for agenda items */}
                    <div className="flex gap-1 justify-center items-center h-4 w-full">
                      {dayEvents.slice(0, 3).map((ev, evIdx) => {
                        let dotColor = "bg-indigo-500";
                        if (ev.type === "task") dotColor = "bg-emerald-500";
                        if (ev.type === "project_milestone") dotColor = "bg-rose-500";
                        if (ev.type === "ai_activity") dotColor = "bg-purple-500";
                        return (
                          <span 
                            key={evIdx} 
                            className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                          />
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[7px] font-black text-brand-placeholder leading-none">+</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Google Calendar Selected Day Agenda section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-brand-border pb-2 px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-placeholder">
                  Agenda for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                </h4>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-brand-primary px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  {selectedDayEvents.length} Item{selectedDayEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-6 text-xs text-brand-secondary italic font-semibold">
                    No items scheduled for this date.
                  </div>
                ) : (
                  selectedDayEvents.map((ev, evIdx) => (
                    <div
                      key={`${ev.id}-${evIdx}`}
                      className="p-3.5 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-brand-border/60 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-extrabold text-brand-heading truncate">{ev.title}</p>
                        {ev.start && (
                          <p className="text-[10px] text-brand-secondary mt-1 flex items-center gap-1 font-bold uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-brand-primary" />
                            {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <span className={`text-[9px] px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider border shrink-0 ${getItemBadgeStyle(ev.type, ev.priority)}`}>
                        {ev.type === "ai_activity" ? "AI Focus" : ev.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= WEEK VIEW (7-Day Stacked Agenda Blocks) ================= */}
        {view === "week" && (
          <div className="py-4 space-y-5">
            <h3 className="text-xs font-black uppercase text-brand-placeholder tracking-widest px-1">Weekly Agenda Stacks</h3>
            <div className="divide-y divide-brand-border border-t border-b border-brand-border/40">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const targetDay = new Date(currentDate);
                targetDay.setDate(currentDate.getDate() + offset);
                const dayISO = getLocalDateISO(targetDay);
                const dayEvents = allItems.filter(item => item.start && item.start.split("T")[0] === dayISO);

                return (
                  <div key={dayISO} className="py-4 flex flex-col md:flex-row gap-3 md:gap-6 items-start hover:bg-slate-50/20 dark:hover:bg-slate-850/10 transition-colors">
                    <div className="w-full md:w-28 shrink-0 flex items-baseline md:flex-col gap-2">
                      <span className="text-[10px] md:text-xs uppercase text-brand-placeholder font-black tracking-widest">
                        {targetDay.toLocaleDateString([], { weekday: "short" })}
                      </span>
                      <span className="text-sm md:text-base font-black text-brand-heading">
                        {targetDay.toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {dayEvents.length === 0 ? (
                        <span className="text-xs text-brand-secondary italic font-semibold block py-1">No items scheduled</span>
                      ) : (
                        dayEvents.map((ev, evIdx) => (
                          <div
                            key={`${ev.id}-${evIdx}`}
                            className="p-3 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-brand-border/50 flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs md:text-sm font-extrabold text-brand-heading truncate">{ev.title}</p>
                              {ev.start && (
                                <p className="text-[10px] text-brand-secondary font-bold mt-1 flex items-center gap-1 uppercase">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                            <span className="text-[8px] uppercase font-black text-brand-secondary bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-brand-border/40">{ev.type}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= DAY VIEW (Hour segments) ================= */}
        {view === "day" && (
          <div className="py-4 space-y-4">
            <h3 className="text-xs font-black uppercase text-brand-placeholder tracking-widest px-1">Day Segment Blocks</h3>
            
            <div className="border border-brand-border rounded-xl overflow-hidden divide-y divide-brand-border">
              {(() => {
                const dayISO = getLocalDateISO(currentDate);
                const dayEvents = allItems.filter(item => item.start && item.start.split("T")[0] === dayISO);

                const hours = Array.from({ length: 13 }, (_, i) => i + 8);

                return (
                  <div className="bg-brand-card">
                    {hours.map((hour) => {
                      const hourStr = `${String(hour).padStart(2, "0")}:00`;
                      const eventsInHour = dayEvents.filter(ev => {
                        if (!ev.start) return false;
                        const evHour = new Date(ev.start).getHours();
                        return evHour === hour;
                      });

                      return (
                        <div key={hour} className="flex min-h-[50px] group hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                          <div className="w-16 px-2.5 py-3.5 border-r border-brand-border flex justify-end items-start shrink-0">
                            <span className="text-[9px] font-black font-mono text-brand-placeholder tracking-wider">{hourStr}</span>
                          </div>
                          
                          <div className="flex-1 p-1.5 space-y-1 flex flex-col justify-center">
                            {eventsInHour.length === 0 ? (
                              <span className="text-[9px] text-brand-placeholder/40 italic font-bold hidden group-hover:block pl-2">Free slot</span>
                            ) : (
                              eventsInHour.map((ev, evIdx) => (
                                <div
                                  key={`${ev.id}-${evIdx}`}
                                  className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-brand-border flex items-center justify-between"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-extrabold text-brand-heading truncate">{ev.title}</p>
                                  </div>
                                  <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest border ${getItemBadgeStyle(ev.type, ev.priority)}`}>
                                    {ev.type}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================= AGENDA VIEW ================= */}
        {view === "agenda" && (
          <div className="py-4 space-y-4">
            <h3 className="text-xs font-black uppercase text-brand-placeholder tracking-widest px-1">Booked Custom Schedule List</h3>
            <div className="space-y-2.5">
              {allItems.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <ListTodo className="w-8 h-8 text-brand-placeholder mb-2" />
                  <p className="text-xs text-brand-secondary italic font-semibold">No schedule items booked.</p>
                </div>
              ) : (
                allItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-brand-border rounded-xl flex items-center justify-between hover:border-brand-primary/40 transition-all"
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <p className="text-sm font-extrabold text-brand-heading truncate">{item.title}</p>
                      <p className="text-[10px] text-brand-secondary mt-1 flex items-center gap-1.5 font-bold uppercase">
                        <Clock className="w-3.5 h-3.5 text-brand-primary" />
                        {item.start ? new Date(item.start).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}
                      </p>
                    </div>
                    {item.type === "meeting" && (
                      <button
                        onClick={() => deleteEvent(item.id)}
                        className="p-2 text-brand-placeholder hover:text-brand-danger cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors shrink-0"
                        title="Delete meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ================= EVENT MODAL (48px targets) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-brand-card p-6 rounded-2xl border border-brand-border shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
              <h4 className="text-base font-black text-brand-heading uppercase tracking-wider">
                Schedule Custom Event
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-brand-secondary hover:text-brand-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-brand-placeholder uppercase tracking-widest mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sync with team lead"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-brand-placeholder uppercase tracking-widest mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    className="w-full h-11 px-2.5 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm font-bold cursor-pointer"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="work_block">Work Block</option>
                    <option value="personal">Personal</option>
                    <option value="ai_activity">AI Recommendation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand-placeholder uppercase tracking-widest mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full h-11 px-2.5 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-placeholder uppercase tracking-widest mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full h-11 px-2.5 bg-brand-input-bg border border-brand-input-border rounded-xl text-brand-input-text focus:outline-none text-sm font-bold cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-4 border border-brand-border bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-secondary text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
