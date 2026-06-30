import React, { useState } from "react";
import { useApp } from "./AppContext";
import {
  LayoutDashboard,
  CheckSquare,
  Brain,
  Target,
  LineChart,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  Calendar,
  User,
  Bell,
} from "lucide-react";

export const Navigation: React.FC = () => {
  const { activePage, setActivePage, theme, toggleTheme, userProfile } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Complete menu items list
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "coach", label: "AI Coach", icon: Brain, badge: "AI" },
    { id: "planner", label: "AI Planner", icon: Sparkles },
    { id: "goals", label: "Goals & Habits", icon: Target },
    { id: "analytics", label: "Analytics", icon: LineChart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Specific 6 mobile navigation items requested by user
  const mobileMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "coach", label: "Coach", icon: Brain },
    { id: "planner", label: "Planner", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Map of page titles for the mobile header
  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard": return "Dashboard";
      case "calendar": return "Calendar";
      case "tasks": return "AI Tasks";
      case "coach": return "AI Coach";
      case "planner": return "Daily Plan";
      case "goals": return "Goals & Habits";
      case "analytics": return "Performance";
      case "settings": return "Settings";
      case "profile": return "My Profile";
      default: return "Deadline Guardian";
    }
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:flex w-64 flex-col border-r border-brand-border bg-brand-sidebar">
        {/* LOGO FRAME */}
        <div className="flex h-20 items-center px-6 gap-3 border-b border-brand-border">
          <div className="flex p-2.5 rounded-xl bg-brand-primary text-white shadow-md">
            <Target className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-brand-heading text-base leading-none">
              Guardian AI
            </div>
            <div className="text-[10px] text-brand-primary font-bold tracking-wider uppercase mt-1">
              PROD CONSOLE
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActivePage(item.id)}
                className={`flex w-full items-center justify-between px-4 h-11 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer relative group ${
                  isActive
                    ? "bg-brand-primary text-white shadow-sm shadow-indigo-500/10"
                    : "text-brand-secondary hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-brand-heading"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-brand-placeholder group-hover:text-brand-primary"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold tracking-wider rounded-md ${isActive ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PROFILE FOOTER */}
        <div className="p-5 border-t border-brand-border bg-brand-bg/50">
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={() => setActivePage("profile")}
              className="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/60 p-2 rounded-xl transition-all duration-150 flex-1 min-w-0"
              title="View Profile Settings"
            >
              <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-sm border-2 border-white/10">
                {(userProfile?.name || "R").substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-brand-heading truncate">
                  {userProfile?.name || "Raju"}
                </div>
                <div className="text-[10px] text-brand-secondary font-bold truncate mt-0.5 leading-none">
                  {userProfile?.role || "Developer"}
                </div>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              id="desktop-theme-toggle"
              className="p-2 rounded-xl border border-brand-input-border hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-secondary hover:text-brand-heading cursor-pointer shrink-0 transition-all active:scale-95"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </div>
      </aside>

      {/* ================= COMPACT MOBILE HEADER (60-70px) ================= */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden flex h-[62px] items-center justify-between border-b border-brand-border bg-brand-sidebar/95 backdrop-blur-md px-4 select-none">
        {/* Brand logo & compact title */}
        <div className="flex items-center gap-2.5">
          <div className="flex p-2 rounded-xl bg-brand-primary text-white shadow-sm">
            <Target className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-tight text-brand-heading text-sm uppercase">
            {getPageTitle()}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            id="mobile-theme-toggle"
            className="p-2.5 rounded-xl text-brand-secondary hover:text-brand-heading transition-transform active:scale-90"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-500" />}
          </button>

          {/* User Profile shortcut */}
          <button
            onClick={() => setActivePage("profile")}
            className="w-8 h-8 rounded-full bg-brand-primary text-white font-extrabold text-xs flex items-center justify-center border border-brand-border shadow-inner"
          >
            {(userProfile?.name || "R").substring(0, 1).toUpperCase()}
          </button>

          {/* More menu drawer trigger (for Goals & Analytics not on bottom nav) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            className="p-2 rounded-xl text-brand-secondary hover:text-brand-heading transition-transform active:scale-90"
          >
            {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION (6 FIXED ITEMS) ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-brand-sidebar/95 border-t border-brand-border px-1.5 pb-safe pt-2.5 backdrop-blur-md select-none">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative active:scale-95 cursor-pointer h-12 min-w-[50px] ${
                  isActive ? "text-brand-primary" : "text-brand-secondary"
                }`}
              >
                {/* Active Indicator Backdrop */}
                {isActive && (
                  <span className="absolute inset-x-2 top-0 h-1 bg-brand-primary rounded-full animate-pulse" />
                )}
                
                <Icon className={`w-5.5 h-5.5 transition-all ${isActive ? "scale-110 text-brand-primary" : "text-brand-placeholder hover:text-brand-secondary"}`} />
                <span className="text-[10px] font-bold mt-1.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MOBILE MORE MENU DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-35 md:hidden bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
          <div className="fixed inset-y-0 right-0 w-64 bg-brand-sidebar p-6 pt-20 flex flex-col justify-between border-l border-brand-border select-none animate-fade-in shadow-2xl">
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-3">
                <h3 className="text-xs font-bold text-brand-placeholder tracking-widest uppercase">Guardian Resources</h3>
              </div>
              
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 h-12 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-brand-primary text-white shadow-sm"
                          : "text-brand-secondary hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className="w-4.5 h-4.5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-brand-primary/10 text-brand-primary">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-brand-border bg-brand-bg/40 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center font-extrabold text-white text-xs shrink-0">
                {(userProfile?.name || "R").substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-bold text-brand-heading truncate">{userProfile?.name || "Raju"}</div>
                <div className="text-[10px] text-brand-secondary truncate font-bold uppercase">{userProfile?.role || "Developer"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
