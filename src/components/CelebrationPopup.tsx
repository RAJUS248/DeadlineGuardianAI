import React from "react";
import { useApp } from "./AppContext";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Award, Star, Zap, Flame, Sparkles, X } from "lucide-react";

export const CelebrationPopup: React.FC = () => {
  const { celebration, dismissCelebration } = useApp();

  if (!celebration || !celebration.show) return null;

  const renderBadgeIcon = (iconName?: string) => {
    switch (iconName) {
      case "Shield":
        return <Award className="w-16 h-16 text-cyan-500" id="badge-shield" />;
      case "Brain":
        return <Sparkles className="w-16 h-16 text-indigo-500" id="badge-brain" />;
      case "Flame":
        return <Flame className="w-16 h-16 text-rose-500 animate-pulse" id="badge-flame" />;
      case "Trophy":
        return <Trophy className="w-16 h-16 text-amber-500" id="badge-trophy" />;
      default:
        return <Star className="w-16 h-16 text-indigo-500" id="badge-star" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" id="celebration-overlay">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md overflow-hidden bg-brand-card border border-brand-border rounded-2xl shadow-xl p-8 text-center"
          id="celebration-modal"
        >
          {/* Top subtle visual strip */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-primary" />
          
          <button
            onClick={dismissCelebration}
            className="absolute top-5 right-5 p-2 text-brand-placeholder hover:text-brand-heading rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            id="celebration-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Visual Badge Header */}
          <div className="flex justify-center mb-6 mt-3">
            <div className="relative p-5 bg-slate-50 dark:bg-slate-850 rounded-full border border-brand-border">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.15 }}
              >
                {celebration.badge ? renderBadgeIcon(celebration.badge) : (
                  <Trophy className="w-16 h-16 text-amber-500" id="celebration-trophy-fallback" />
                )}
              </motion.div>
            </div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-bold tracking-tight text-brand-heading mb-3"
            id="celebration-title"
          >
            {celebration.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-brand-secondary text-base mb-8 leading-relaxed font-semibold px-2"
            id="celebration-message"
          >
            {celebration.message}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={dismissCelebration}
            className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            id="celebration-dismiss-btn"
          >
            Claim Rewards & Continue
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
