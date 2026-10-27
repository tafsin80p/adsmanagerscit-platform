"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, ShieldCheck, Sparkles, X, Info } from "lucide-react";

export interface ToastData {
  type: "success" | "admin" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface AnimatedToastProps {
  toast: ToastData | null;
  onClose?: () => void;
}

export const AnimatedToast: React.FC<AnimatedToastProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setProgress(100);

    const duration = toast.duration || 4000;
    const intervalTime = 50;
    const decrement = (100 / (duration / intervalTime));

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return Math.max(0, prev - decrement);
      });
    }, intervalTime);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast, onClose]);

  if (!toast || !isVisible) return null;

  const isSuccess = toast.type === "success";
  const isAdmin = toast.type === "admin";
  const isError = toast.type === "error";

  return (
    <div
      role="alert"
      className="fixed top-5 right-4 sm:right-6 z-[100] max-w-[92vw] sm:max-w-md w-full animate-in fade-in slide-in-from-top-5 duration-300 ease-out"
    >
      <div
        className={`relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all ${
          isAdmin
            ? "bg-[#090E20]/95 border-[#3858F6]/40 shadow-[0_12px_45px_rgba(56,88,246,0.35)] ring-1 ring-[#3858F6]/30 text-white"
            : isSuccess
            ? "bg-[#0A1624]/95 border-emerald-500/35 shadow-[0_12px_45px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/25 text-white"
            : isError
            ? "bg-[#1E0B12]/95 border-rose-500/35 shadow-[0_12px_45px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/25 text-white"
            : "bg-[#0C172A]/95 border-cyan-500/35 shadow-[0_12px_45px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/25 text-white"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Glowing Icon Container */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative ${
              isAdmin
                ? "bg-[#3858F6]/20 border-[#3858F6]/40 text-[#60A5FA]"
                : isSuccess
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : isError
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
            }`}
          >
            {isAdmin && <ShieldCheck className="w-5 h-5 animate-pulse" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5" />}
            {isError && <AlertCircle className="w-5 h-5 animate-bounce" />}
            {!isAdmin && !isSuccess && !isError && <Info className="w-5 h-5" />}

            {/* Sparkle micro-badge for success */}
            {(isSuccess || isAdmin) && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center ring-2 ring-[#0A1624] shadow-xs">
                <Sparkles className="w-2 h-2 text-slate-950" />
              </span>
            )}
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black tracking-tight text-white leading-tight">
                {toast.title}
              </h4>
              {isAdmin && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-[#3858F6] text-white tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed mt-1">
              {toast.message}
            </p>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 200);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Animated Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              isAdmin
                ? "bg-gradient-to-r from-[#3858F6] to-cyan-400"
                : isSuccess
                ? "bg-gradient-to-r from-emerald-500 to-teal-300"
                : isError
                ? "bg-gradient-to-r from-rose-500 to-amber-400"
                : "bg-gradient-to-r from-cyan-500 to-blue-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
export default AnimatedToast;
