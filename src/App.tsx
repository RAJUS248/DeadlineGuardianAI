/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppProvider, useApp } from "./components/AppContext";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { CalendarPage } from "./components/CalendarPage";
import { TasksPage } from "./components/TasksPage";
import { CoachPage } from "./components/CoachPage";
import { PlannerPage } from "./components/PlannerPage";
import { GoalsPage } from "./components/GoalsPage";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { SettingsPage } from "./components/SettingsPage";
import { Onboarding } from "./components/Onboarding";
import { CelebrationPopup } from "./components/CelebrationPopup";
import { AuthPage } from "./components/AuthPage";
import { ProfilePage } from "./components/ProfilePage";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

function MainLayout() {
  const { activePage, theme, userProfile, isAuthenticated, toasts, dismissToast } = useApp();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (!userProfile?.hasCompletedOnboarding) {
    return <Onboarding />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "calendar":
        return <CalendarPage />;
      case "tasks":
        return <TasksPage />;
      case "coach":
        return <CoachPage />;
      case "planner":
        return <PlannerPage />;
      case "goals":
        return <GoalsPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "settings":
        return <SettingsPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-brand-bg text-brand-body">
      <CelebrationPopup />
      
      {/* Central Floating Toasts Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 animate-fade-in transition-all duration-300 backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500/90 border-emerald-400 text-white"
                : toast.type === "alert"
                ? "bg-rose-500/90 border-rose-400 text-white"
                : "bg-slate-900/90 border-slate-700 text-slate-100"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-white" />
            ) : toast.type === "alert" ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-white animate-pulse" />
            ) : (
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm tracking-tight">{toast.title}</p>
              <p className="text-xs mt-0.5 opacity-90 font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex min-h-screen">
        {/* Responsive Drawer & Bottom Navigation */}
        <Navigation />

        {/* Dynamic page render area with responsive, edge-to-edge safe boundaries */}
        <main className="flex-1 min-w-0 md:ml-64 px-4 py-20 md:py-12 md:px-12 max-w-7xl mx-auto pb-28 md:pb-12 w-full flex flex-col">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  React.useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Suppress cross-origin "Script error." which is typical in iframe parent/child messaging
      if (event.message === "Script error." || !event.filename) {
        event.preventDefault();
        return true;
      }
      console.warn("► Caught global window error safely:", event.message);
      return true;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.warn("► Caught unhandled rejection safely:", event.reason);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

