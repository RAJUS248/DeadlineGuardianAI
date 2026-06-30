import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { 
  User, 
  Mail, 
  Briefcase, 
  Settings, 
  ShieldCheck, 
  Calendar, 
  Bell, 
  Monitor, 
  Edit3, 
  Save, 
  LogOut, 
  Lock, 
  Check, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const ProfilePage: React.FC = () => {
  const { userProfile, setUserProfile, theme, toggleTheme, logout, addActivity, setActivePage } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState("");
  
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftMode, setDraftMode] = useState<"Student" | "Job Seeker" | "Professional" | "Entrepreneur">("Student");
  const [draftTheme, setDraftTheme] = useState<"dark" | "light">("dark");
  const [draftNotifications, setDraftNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  useEffect(() => {
    setDraftName(userProfile.name || "Raju");
    setDraftEmail(userProfile.email || "rajubaradur24@gmail.com");
    setDraftRole(userProfile.role || "SDE Aspirant & CS Student");
    setDraftMode(userProfile.productivityMode || "Student");
    setDraftTheme(theme);
    setDraftNotifications(userProfile.notificationPreferences || {
      email: true,
      push: true,
      sms: false
    });
  }, [userProfile, theme, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
    setError("");
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError("");
  };

  const validateInputs = () => {
    if (!draftName.trim()) return "Name cannot be empty.";
    if (!draftEmail.trim()) return "Email cannot be empty.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(draftEmail)) return "Please enter a valid email address.";
    if (!draftRole.trim()) return "Role cannot be empty.";
    return "";
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setShowConfirmModal(true);
  };

  const confirmSave = () => {
    setShowConfirmModal(false);
    const isModeChanged = draftMode !== userProfile.productivityMode;

    if (isModeChanged) {
      const updatedProfile = {
        ...userProfile,
        name: draftName,
        email: draftEmail,
        role: draftRole,
        productivityMode: draftMode,
        hasCompletedOnboarding: false,
        notificationPreferences: draftNotifications,
      };
      setUserProfile(updatedProfile);
      setIsEditing(false);
      addActivity(`Launched onboarding wizard to reconfigure workspace for ${draftMode} mode.`, "system");
    } else {
      const updatedProfile = {
        ...userProfile,
        name: draftName,
        email: draftEmail,
        role: draftRole,
        notificationPreferences: draftNotifications,
      };
      setUserProfile(updatedProfile);
      if (draftTheme !== theme) {
        toggleTheme();
      }
      setIsEditing(false);
      addActivity("Successfully updated profile details", "success");
    }
  };

  const initials = (draftName || "R").substring(0, 2).toUpperCase();

  return (
    <div className="space-y-8 select-none w-full max-w-2xl mx-auto pb-16 animate-fade-in">
      
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => setActivePage("settings")}
          className="group flex items-center gap-2 text-xs font-black text-brand-primary hover:text-brand-primary-hover uppercase tracking-widest cursor-pointer transition-all hover:-translate-x-0.5"
        >
          <span className="text-sm font-bold">←</span> Back to Settings
        </button>
      </div>

      {/* Title block */}
      <div className="pb-4 border-b border-brand-border">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-heading leading-tight">
          Profile & Account
        </h1>
        <p className="text-xs md:text-sm text-brand-secondary font-semibold mt-1">
          Google Account style dashboard representing your identity, status, and system integrations.
        </p>
      </div>

      {/* ================= GOOGLE ACCOUNT STYLE AVATAR & HEADER ================= */}
      <div className="flex flex-col items-center text-center space-y-4 py-6 bg-transparent">
        <div className="relative group">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-650 text-white font-extrabold text-3xl md:text-4xl flex items-center justify-center shadow-lg relative overflow-hidden">
            {initials}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Auto Avatar
              </div>
            )}
          </div>
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-brand-success border-4 border-brand-bg rounded-full" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-brand-heading leading-tight">
            {userProfile.name || "Raju"}
          </h2>
          <p className="text-xs md:text-sm text-brand-secondary font-bold">
            {userProfile.email || "rajubaradur24@gmail.com"}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-brand-primary font-black pt-1">
            {userProfile.role || "SDE Aspirant & CS Student"}
          </p>
        </div>

        <div className="flex items-center gap-2 justify-center pt-1.5">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary border border-brand-primary/10 uppercase tracking-wider">
            {userProfile.productivityMode || "Student"} Mode
          </span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand-success border border-brand-success/10 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> {userProfile.accountStatus || "Active"}
          </span>
        </div>
      </div>

      {/* ================= GOOGLE ACCOUNT FLOW DETAILS ================= */}
      <form onSubmit={handleSaveClick} className="space-y-8">
        {error && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-brand-danger text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section: Personal Info (No boxes, row list) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder">Personal Information</h3>
            
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEditClick}
                className="h-8 px-3.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900/40 text-brand-primary border border-brand-primary/10 font-black text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Info
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="h-8 px-3 border border-brand-border text-brand-secondary text-[10px] uppercase tracking-wider font-bold rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-[10px] uppercase tracking-wider font-black rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10">
            {/* Full Name Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-xs font-bold text-brand-secondary sm:w-1/3">Display Name</span>
              <div className="w-full sm:w-2/3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-bg disabled:bg-transparent border border-brand-input-border disabled:border-transparent rounded-lg text-xs font-semibold text-brand-input-text focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-xs font-bold text-brand-secondary sm:w-1/3">Email Address</span>
              <div className="w-full sm:w-2/3">
                <input
                  type="email"
                  disabled={!isEditing}
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-bg disabled:bg-transparent border border-brand-input-border disabled:border-transparent rounded-lg text-xs font-semibold text-brand-input-text focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Professional Role Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-xs font-bold text-brand-secondary sm:w-1/3">Professional Role</span>
              <div className="w-full sm:w-2/3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-bg disabled:bg-transparent border border-brand-input-border disabled:border-transparent rounded-lg text-xs font-semibold text-brand-input-text focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Productivity Mode Selection Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-xs font-bold text-brand-secondary sm:w-1/3">Workspace Target</span>
              <div className="w-full sm:w-2/3">
                <select
                  disabled={!isEditing}
                  value={draftMode}
                  onChange={(e) => setDraftMode(e.target.value as any)}
                  className="h-10 px-3 bg-brand-bg disabled:bg-transparent border border-brand-input-border disabled:border-transparent rounded-lg text-xs font-bold text-brand-input-text focus:outline-none cursor-pointer w-full"
                >
                  <option value="Student">Student Track</option>
                  <option value="Job Seeker">Job Seeker Track</option>
                  <option value="Professional">Professional Track</option>
                  <option value="Entrepreneur">Entrepreneur Track</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Account Metadata Details */}
        <div className="space-y-3.5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-placeholder px-1">Diagnostics</h3>
          <div className="divide-y divide-brand-border/40 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-card dark:bg-slate-900/10 text-xs">
            {/* Created At */}
            <div className="flex items-center justify-between p-4">
              <span className="font-bold text-brand-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" /> Created
              </span>
              <span className="text-brand-heading font-extrabold">
                {userProfile.accountCreationDate || "June 23, 2026"}
              </span>
            </div>

            {/* Security Audit status */}
            <div className="flex items-center justify-between p-4">
              <span className="font-bold text-brand-secondary flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-primary" /> Security Baseline
              </span>
              <span className="text-brand-success font-black uppercase tracking-wider flex items-center gap-1">
                <Check className="w-4 h-4" /> Secure
              </span>
            </div>
          </div>
        </div>

        {/* Section: Save / Sign Out buttons (Large mobile-friendly touch buttons) */}
        <div className="space-y-3 pt-4">
          <button
            onClick={logout}
            type="button"
            className="w-full h-12 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Account
          </button>
        </div>
      </form>

      {/* Confirmation Modal overlay (Reconfigures onboarding or saves info) */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-brand-card p-6 rounded-2xl border border-brand-border shadow-2xl space-y-6 animate-scale-up"
            >
              <div className="flex items-center gap-3 text-brand-primary">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-brand-primary/25 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-heading uppercase tracking-wider">
                    {draftMode !== userProfile.productivityMode ? "Transform Workspace Mode?" : "Save Details?"}
                  </h3>
                  <p className="text-xs text-brand-secondary mt-0.5 font-bold">
                    Verify account configuration changes
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2.5 text-xs">
                <p className="text-brand-secondary font-bold">New credentials:</p>
                <div className="grid grid-cols-2 gap-2 font-semibold">
                  <div>
                    <span className="text-brand-placeholder uppercase text-[9px] block">Name</span>
                    <p className="text-brand-heading font-extrabold truncate mt-0.5">{draftName}</p>
                  </div>
                  <div>
                    <span className="text-brand-placeholder uppercase text-[9px] block">Role</span>
                    <p className="text-brand-heading font-extrabold truncate mt-0.5">{draftRole}</p>
                  </div>
                  <div>
                    <span className="text-brand-placeholder uppercase text-[9px] block">Workspace Mode</span>
                    <p className="text-brand-primary font-black mt-0.5">{draftMode}</p>
                  </div>
                  <div>
                    <span className="text-brand-placeholder uppercase text-[9px] block">Email</span>
                    <p className="text-brand-heading font-extrabold truncate mt-0.5">{draftEmail}</p>
                  </div>
                </div>
              </div>

              {draftMode !== userProfile.productivityMode && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-[10px] text-brand-danger leading-relaxed font-bold uppercase tracking-wider">
                  ⚠️ Swapping Productivity modes triggers the workspace onboarding questionnaire to completely re-align active targets.
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="h-11 px-5 border border-brand-border text-brand-secondary bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSave}
                  className="h-11 px-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  {draftMode !== userProfile.productivityMode ? "Confirm & Re-onboard" : "Confirm Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
