import React, { useState } from "react";
import { useApp } from "./AppContext";
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  GraduationCap,
  Briefcase,
  Building,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";

export const AuthPage: React.FC = () => {
  const { login, register, theme, connectGoogleCalendar } = useApp();
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register fields
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("SDE Aspirant & CS Student");
  const [registerMode, setRegisterMode] = useState<"Student" | "Job Seeker" | "Professional" | "Entrepreneur">("Student");
  
  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  // Global error / loading states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email validation regex
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (!validateEmail(loginEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (loginPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      // Log in with email, parse Name from Email or default
      const displayName = loginEmail.split("@")[0];
      const capitalized = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      await login(loginEmail, capitalized);
    } catch (err) {
      setError("Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!registerName || !registerEmail || !registerPassword || !registerRole) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (!validateEmail(registerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await register(registerEmail, registerName, registerRole, registerMode);
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!forgotEmail) {
      setError("Please enter your email address.");
      return;
    }
    
    if (!validateEmail(forgotEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotSuccess(true);
    }, 800);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const { googleSignIn } = await import("../lib/firebaseAuth");
      const res = await googleSignIn();
      if (res && res.user) {
        const email = res.user.email || "googleuser@example.com";
        const displayName = res.user.displayName || email.split("@")[0] || "Google User";
        await login(email, displayName);
        
        if (res.accessToken) {
          try {
            await connectGoogleCalendar(res.accessToken);
          } catch (calErr) {
            console.error("Failed to connect Google Calendar on sign-in", calErr);
          }
        }
      } else {
        throw new Error("No user returned from Google Sign-In");
      }
    } catch (err: any) {
      console.error("Google Sign-In failed", err);
      setError(err?.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id: "Student" as const, title: "Student", icon: GraduationCap, desc: "Academic tracks & study blocks" },
    { id: "Job Seeker" as const, title: "Job Seeker", icon: Briefcase, desc: "Interviews & SDE placement" },
    { id: "Professional" as const, title: "Professional", icon: Building, desc: "Client deliveries & balance" },
    { id: "Entrepreneur" as const, title: "Entrepreneur", icon: TrendingUp, desc: "MRR traction & roadmaps" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-12 relative overflow-hidden">
      {/* Decorative ambient background spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-success/10 rounded-full blur-3xl -z-10 animate-pulse delay-75"></div>

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-primary border border-brand-primary/20 mb-4 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-heading font-sans">
            Deadline Guardian
          </h1>
          <p className="text-sm text-brand-secondary font-medium mt-1">
            Premium Productivity & Workload Safeguarding
          </p>
        </div>

        {/* Card Body */}
        <motion.div 
          layout
          className="bg-brand-card p-8 rounded-2xl border border-brand-border shadow-xl backdrop-blur-sm"
        >
          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 text-brand-danger text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {view === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brand-heading mb-1">Welcome back</h2>
                <p className="text-sm text-brand-secondary">Sign in to your productivity workspace</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-heading">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/60" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-12 pl-12 pr-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-brand-heading">Password</label>
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); }}
                      className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/60" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-base rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-brand-border"></div>
                <span className="flex-shrink mx-4 text-xs text-brand-secondary font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-brand-border"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 text-brand-body border-[1.5px] border-brand-input-border font-semibold text-base rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {/* Clean inline SVG for Google Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.564-1.87 4.59-6.887 4.59-4.327 0-7.859-3.585-7.859-8s3.532-8 7.859-8c2.46 0 4.104 1.025 5.045 1.926l3.227-3.1C18.28 1.84 15.538 1 12.24 1 5.966 1 1 5.966 1 12.24s4.966 11.24 11.24 11.24c6.544 0 10.89-4.603 10.89-11.085 0-.746-.08-1.312-.178-1.875h-10.71z"/>
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-brand-secondary font-medium">
                New to Deadline Guardian?{" "}
                <button
                  type="button"
                  onClick={() => { setView("register"); setError(""); }}
                  className="font-bold text-brand-primary hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brand-heading mb-1">Create an account</h2>
                <p className="text-sm text-brand-secondary">Tailor your personal performance shield</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-heading">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/60" />
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-12 pl-12 pr-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-heading">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/60" />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-12 pl-12 pr-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-heading">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/60" />
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-heading">Professional Role</label>
                  <input
                    type="text"
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                    placeholder="e.g. SDE Aspirant, Project Manager"
                    className="w-full h-12 px-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-heading">Productivity Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {modes.map((m) => {
                      const IconComponent = m.icon;
                      const isSelected = registerMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setRegisterMode(m.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-brand-primary text-brand-heading" 
                              : "bg-brand-bg/40 border-brand-border hover:border-brand-primary/50 text-brand-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent className={`w-4.5 h-4.5 ${isSelected ? 'text-brand-primary' : ''}`} />
                            <span className="text-sm font-bold truncate">{m.title}</span>
                          </div>
                          <p className="text-[10px] leading-tight text-brand-secondary truncate">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-base rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-brand-secondary font-medium">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setView("login"); setError(""); }}
                  className="font-bold text-brand-primary hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {view === "forgot" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brand-heading mb-1">Reset password</h2>
                <p className="text-sm text-brand-secondary">We'll email you a link to secure your account</p>
              </div>

              {forgotSuccess ? (
                <div className="space-y-6 text-center py-4">
                  <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand-success mb-2">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-brand-heading text-lg">Check your email</h3>
                    <p className="text-sm text-brand-secondary max-w-xs mx-auto">
                      A recovery link has been sent to <strong className="text-brand-heading font-semibold">{forgotEmail}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setView("login"); setForgotSuccess(false); setForgotEmail(""); setError(""); }}
                    className="w-full h-12 border border-brand-input-border text-brand-secondary bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold rounded-xl cursor-pointer transition-all"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-brand-heading">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/60" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-12 pl-12 pr-4 bg-brand-input-bg border-[1.5px] border-brand-input-border rounded-xl text-brand-input-text placeholder-brand-placeholder focus:outline-none text-base focus:border-brand-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-base rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Send Recovery Link <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setView("login"); setError(""); }}
                    className="w-full h-12 border border-brand-input-border text-brand-secondary bg-brand-card hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold rounded-xl cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
