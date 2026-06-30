import React, { useState } from "react";
import { useApp } from "./AppContext";
import {
  Monitor,
  Sun,
  Moon,
  Bell,
  Calendar,
  Sparkles,
  Shield,
  Globe,
  Download,
  Keyboard,
  Info,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  ChevronRight,
  Activity
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { 
    userProfile, 
    setUserProfile, 
    theme, 
    toggleTheme, 
    addActivity,
    setActivePage,
    tasks,
    habits,
    goals,
    googleCalConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncNow,
    lastSyncTime,
    defaultReminderOption,
    setDefaultReminderOption,
    defaultCalendarName,
    setDefaultCalendarName,
    syncFrequencyMinutes,
    setSyncFrequencyMinutes,
  } = useApp();

  const [emailNotif, setEmailNotif] = useState(userProfile?.notificationPreferences?.email ?? true);
  const [pushNotif, setPushNotif] = useState(userProfile?.notificationPreferences?.push ?? true);
  const [smsNotif, setSmsNotif] = useState(userProfile?.notificationPreferences?.sms ?? false);

  const [outlookCalConnected, setOutlookCalConnected] = useState(false);

  const [githubConnected, setGithubConnected] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);

  const [aiTone, setAiTone] = useState<"Professional" | "Empathetic" | "Stern" | "Yoda">("Professional");
  const [shieldSensitivity, setShieldSensitivity] = useState<"High" | "Medium" | "Relaxed">("High");
  const [autoBuffer, setAutoBuffer] = useState(true);

  const [biometricShield, setBiometricShield] = useState(false);
  const [diagnosticTelemetry, setDiagnosticTelemetry] = useState(true);

  const [language, setLanguage] = useState("English");
  const [saveToast, setSaveToast] = useState("");

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(""), 3000);
  };

  const saveAppSettings = () => {
    const updatedProfile = {
      ...userProfile,
      notificationPreferences: {
        email: emailNotif,
        push: pushNotif,
        sms: smsNotif
      }
    };
    setUserProfile(updatedProfile);
    addActivity("Application settings saved successfully", "success");
    triggerToast("Application settings updated successfully!");
  };

  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          appSignature: "Deadline Guardian Premium",
          user: {
            name: userProfile?.name,
            email: userProfile?.email,
            mode: userProfile?.productivityMode,
            role: userProfile?.role
          },
          workspaceState: {
            tasksCount: tasks.length,
            habitsCount: habits.length,
            goalsCount: goals.length,
            tasks,
            habits,
            goals
          }
        }, null, 2)
      );
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `guardian_workspace_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      addActivity("Exported workspace archive package", "system");
      triggerToast("Data export initiated! Check your downloads.");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to compile workspace export.");
    }
  };

  return (
    <div className="space-y-8 select-none w-full max-w-2xl mx-auto pb-16 animate-fade-in">
      
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-brand-primary text-white rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in font-bold text-xs uppercase tracking-wider">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {saveToast}
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => setActivePage("dashboard")}
          className="group flex items-center gap-2 text-xs font-black text-brand-primary hover:text-brand-primary-hover uppercase tracking-widest cursor-pointer transition-all hover:-translate-x-0.5"
        >
          <span className="text-sm font-bold">←</span> Back to Dashboard
        </button>
      </div>

      {/* Title Header */}
      <div className="pb-4 border-b border-brand-border">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-heading leading-tight">
          Settings
        </h1>
        <p className="text-xs md:text-sm text-brand-secondary font-semibold mt-1">
          Customize notification preferences, calendar feeds, AI models, and local backup exports.
        </p>
      </div>

      {/* ================= ACCOUNT INTEGRATION ROW ================= */}
      <div 
        onClick={() => setActivePage("profile")}
        className="flex items-center justify-between p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-brand-border/40 rounded-xl cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-all"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-brand-primary font-bold flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-indigo-900/40">
            {userProfile?.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-brand-heading truncate">
              {userProfile?.name || "Raju"}
            </h4>
            <p className="text-[11px] text-brand-secondary font-semibold truncate leading-normal">
              {userProfile?.productivityMode || "Professional"} Mode • {userProfile?.role || "Developer"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-brand-primary shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Profile</span>
          <ChevronRight className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="space-y-8">

        {/* ================= DISPLAY & APPEARANCE ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Display & Theme</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* Toggle Theme Row */}
            <div 
              onClick={toggleTheme}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/55 dark:hover:bg-slate-800/15 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/25 text-amber-500 shrink-0">
                  {theme === "light" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Appearance Mode</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Active: {theme === "light" ? "Light Canvas" : "Cosmic Obsidian"}</p>
                </div>
              </div>
              <div className="flex items-center text-brand-secondary">
                <span className="text-xs font-bold uppercase mr-1.5">{theme === "light" ? "Light" : "Dark"}</span>
                <ChevronRight className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= AI COACH TUNING ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">AI Coach & Scheduler</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* Tone Selector */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/25 text-brand-primary shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">AI Coach Personality</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Tune response communication style</p>
                </div>
              </div>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as any)}
                className="h-10 px-2.5 bg-brand-bg border border-brand-border rounded-lg text-brand-heading font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="Professional">Professional</option>
                <option value="Empathetic">Empathetic</option>
                <option value="Stern">Stern</option>
                <option value="Yoda">Yoda</option>
              </select>
            </div>

            {/* Shield sensitivity */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/25 text-brand-danger shrink-0">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Mitigation Shield Sensitivity</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Procrastination mitigation levels</p>
                </div>
              </div>
              <div className="flex items-center bg-brand-bg rounded-lg p-0.5 border border-brand-border shrink-0">
                {(["High", "Medium", "Relaxed"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setShieldSensitivity(lvl)}
                    className={`h-7 px-2.5 text-[9.5px] rounded-md font-extrabold cursor-pointer transition-all ${
                      shieldSensitivity === lvl ? "bg-brand-primary text-white" : "text-brand-secondary hover:text-brand-heading"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Buffer Checkbox */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setAutoBuffer(!autoBuffer)}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/25 text-purple-600 dark:text-purple-400 shrink-0">
                  <Monitor className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Proactive Focus Buffer</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Automatically inject 15-minute intervals</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoBuffer}
                onChange={() => {}} // toggled via parent div click
                className="w-4.5 h-4.5 rounded border-brand-border text-brand-primary focus:ring-0 cursor-pointer pointer-events-none accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* ================= NOTIFICATIONS ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Guard Notifications</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* Email */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setEmailNotif(!emailNotif)}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/25 text-blue-500 shrink-0">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Weekly Performance Digest</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Receive diagnostic reports via email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={() => {}}
                className="w-4.5 h-4.5 rounded border-brand-border text-brand-primary focus:ring-0 cursor-pointer pointer-events-none accent-indigo-600"
              />
            </div>

            {/* Push */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setPushNotif(!pushNotif)}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 text-emerald-500 shrink-0">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Push Shield Alerts</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Real-time alerts for impending deadlines</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pushNotif}
                onChange={() => {}}
                className="w-4.5 h-4.5 rounded border-brand-border text-brand-primary focus:ring-0 cursor-pointer pointer-events-none accent-indigo-600"
              />
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setSmsNotif(!smsNotif)}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/25 text-amber-500 shrink-0">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">SMS Emergency Alerts</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Urgent SMS reminders for critical deadlines</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsNotif}
                onChange={() => {}}
                className="w-4.5 h-4.5 rounded border-brand-border text-brand-primary focus:ring-0 cursor-pointer pointer-events-none accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* ================= CALENDAR SYNC ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Calendar Feeds</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* Google Cal */}
            <div className="flex flex-col p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/25 text-blue-500 shrink-0 font-mono font-black text-xs h-9 w-9 flex items-center justify-center">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Google Calendar Sync</h4>
                    <p className="text-[10px] text-brand-secondary font-semibold">
                      {googleCalConnected ? `Bidirectional feed connected • Synced: ${lastSyncTime}` : "Not configured"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (googleCalConnected) {
                      disconnectGoogleCalendar();
                    } else {
                      try {
                        const { googleSignIn } = await import("../lib/firebaseAuth");
                        const res = await googleSignIn();
                        if (res?.accessToken) {
                          connectGoogleCalendar(res.accessToken);
                        }
                      } catch (err) {
                        console.error("Failed Google Calendar login on SettingsPage", err);
                      }
                    }
                  }}
                  className={`h-8 px-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                    googleCalConnected ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-brand-primary text-white hover:bg-brand-primary-hover"
                  }`}
                >
                  {googleCalConnected ? "Disconnect" : "Connect"}
                </button>
              </div>

              {googleCalConnected && (
                <div className="pt-3 border-t border-brand-border/30 space-y-4 animate-fade-in">
                  {/* Action Sync Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-secondary">Sync Trigger</span>
                    <button
                      onClick={() => syncNow()}
                      className="h-8 px-4 bg-brand-bg hover:bg-slate-50 dark:hover:bg-slate-800 border border-brand-border text-brand-heading text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Sync Now
                    </button>
                  </div>

                  {/* Target Calendar */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-brand-secondary block">Target Calendar Name</span>
                      <span className="text-[9px] text-brand-placeholder leading-none block mt-0.5">Where events are inserted</span>
                    </div>
                    <input
                      type="text"
                      value={defaultCalendarName}
                      onChange={(e) => setDefaultCalendarName(e.target.value)}
                      className="h-9 px-2.5 w-40 bg-brand-bg border border-brand-border rounded-lg text-brand-heading font-semibold text-xs focus:outline-none"
                    />
                  </div>

                  {/* Reminder Options */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-brand-secondary block">Default Event Reminders</span>
                      <span className="text-[9px] text-brand-placeholder leading-none block mt-0.5">Google Calendar alert triggers</span>
                    </div>
                    <select
                      value={defaultReminderOption}
                      onChange={(e) => setDefaultReminderOption(e.target.value)}
                      className="h-9 px-2.5 bg-brand-bg border border-brand-border rounded-lg text-brand-heading font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="none">No reminder</option>
                      <option value="0_min">At event time</option>
                      <option value="5_min">5 minutes before</option>
                      <option value="15_min">15 minutes before</option>
                      <option value="30_min">30 minutes before</option>
                      <option value="60_min">1 hour before</option>
                      <option value="1440_min">1 day before</option>
                    </select>
                  </div>

                  {/* Background Polling Frequency */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-brand-secondary block">Background Poll Frequency</span>
                      <span className="text-[9px] text-brand-placeholder leading-none block mt-0.5">How often auto-sync triggers</span>
                    </div>
                    <select
                      value={syncFrequencyMinutes}
                      onChange={(e) => setSyncFrequencyMinutes(parseInt(e.target.value, 10))}
                      className="h-9 px-2.5 bg-brand-bg border border-brand-border rounded-lg text-brand-heading font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="1">Every 1 minute</option>
                      <option value="5">Every 5 minutes</option>
                      <option value="15">Every 15 minutes</option>
                      <option value="30">Every 30 minutes</option>
                      <option value="60">Every 1 hour</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Outlook Cal */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/25 text-sky-500 shrink-0 font-mono font-black text-xs h-9 w-9 flex items-center justify-center">
                  O
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Outlook Calendar Feed</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">{outlookCalConnected ? "Outlook feed active" : "Integration disabled"}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOutlookCalConnected(!outlookCalConnected);
                  triggerToast(outlookCalConnected ? "Outlook Calendar disconnected." : "Outlook Calendar synced!");
                }}
                className={`h-8 px-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                  outlookCalConnected ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-brand-primary text-white hover:bg-brand-primary-hover"
                }`}
              >
                {outlookCalConnected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        </div>

        {/* ================= INTEGRATIONS ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Developer Services</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* GitHub */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-heading shrink-0 font-mono font-black text-xs h-9 w-9 flex items-center justify-center">
                  Git
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">GitHub Repository Webhook</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Log commits as completed tasks</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setGithubConnected(!githubConnected);
                  triggerToast(githubConnected ? "GitHub webhook disabled." : "GitHub integrated successfully!");
                }}
                className={`h-8 px-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                  githubConnected ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-brand-primary text-white hover:bg-brand-primary-hover"
                }`}
              >
                {githubConnected ? "Connected" : "Integrate"}
              </button>
            </div>

            {/* Notion */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shrink-0 font-mono font-black text-xs h-9 w-9 flex items-center justify-center">
                  N
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Notion Personal Workspace</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Syndicate active board databases</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotionConnected(!notionConnected);
                  triggerToast(notionConnected ? "Notion database unsynced." : "Notion sync authorized!");
                }}
                className={`h-8 px-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                  notionConnected ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-brand-primary text-white hover:bg-brand-primary-hover"
                }`}
              >
                {notionConnected ? "Connected" : "Integrate"}
              </button>
            </div>
          </div>
        </div>

        {/* ================= PRIVACY ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Privacy & Safety</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* Device Lock */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setBiometricShield(!biometricShield)}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-brand-primary shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Require Device Passcode</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Strict security authentication overrides</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={biometricShield}
                onChange={() => {}}
                className="w-4.5 h-4.5 rounded border-brand-border text-brand-primary focus:ring-0 cursor-pointer pointer-events-none accent-indigo-600"
              />
            </div>

            {/* Telemetry */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setDiagnosticTelemetry(!diagnosticTelemetry)}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-brand-primary shrink-0">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Share Workspace Diagnostics</h4>
                  <p className="text-[10px] text-brand-secondary font-semibold">Transmit system metrics to analytics server</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={diagnosticTelemetry}
                onChange={() => {}}
                className="w-4.5 h-4.5 rounded border-brand-border text-brand-primary focus:ring-0 cursor-pointer pointer-events-none accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* ================= DATA EXPORT ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Backup & Archives</h3>
          <div className="border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10 p-4">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/25 text-brand-primary shrink-0">
                <Download className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-extrabold text-brand-heading">Workspace Backup package</h4>
                <p className="text-[10px] text-brand-secondary font-semibold">Compile active tasks, habits, and goals</p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              className="w-full h-11 border border-brand-primary/20 hover:border-brand-primary bg-indigo-500/10 hover:bg-indigo-500/15 text-brand-primary font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export JSON Archive
            </button>
          </div>
        </div>

        {/* ================= INFO & SYSTEMS ================= */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">About Deadline Guardian</h3>
          <div className="border border-brand-border/40 rounded-xl bg-brand-card dark:bg-slate-900/10 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold text-brand-secondary">
              <div>
                <p className="text-[10px] text-brand-secondary font-extrabold uppercase">Version</p>
                <p className="text-brand-heading mt-0.5 font-extrabold">v2.8.5-stable</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-secondary font-extrabold uppercase">Core Framework</p>
                <p className="text-brand-heading mt-0.5 font-extrabold">React 19 & Vite</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-secondary font-extrabold uppercase">Predictive Engine</p>
                <p className="text-brand-heading mt-0.5 font-extrabold">Gemini 3.5 Model</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-secondary font-extrabold uppercase">Active Plan</p>
                <p className="text-brand-primary mt-0.5 font-black uppercase tracking-wider">Enterprise Pro</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Save Settings Button */}
      <div className="pt-4 pb-8 flex justify-end">
        <button
          onClick={saveAppSettings}
          className="w-full sm:w-auto h-12 px-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          Save Settings
        </button>
      </div>

    </div>
  );
};
