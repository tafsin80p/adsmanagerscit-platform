"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { AnimatedToast, ToastData } from "@/components/ui/AnimatedToast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = usePortal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      const msg = "Please enter your admin email address.";
      setError(msg);
      setToast({
        type: "error",
        title: "Required Field Missing",
        message: msg,
        duration: 4000,
      });
      return;
    }
    if (!password) {
      const msg = "Please enter your password.";
      setError(msg);
      setToast({
        type: "error",
        title: "Required Field Missing",
        message: msg,
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await login({
        email: email.trim(),
        password,
        accountType: "specialist",
      });

      if (!res.success) {
        setIsLoading(false);
        const errMsg = res.error || "Authentication failed. Access restricted to authorized admins.";
        setError(errMsg);
        setToast({
          type: "error",
          title: "Access Denied",
          message: errMsg,
          duration: 4500,
        });
        return;
      }

      setIsLoading(false);
      setToast({
        type: "admin",
        title: "Admin Access Granted 🛡️",
        message: "Authorized Specialist session verified. Redirecting to Operations Console...",
        duration: 3500,
      });

      try {
        sessionStorage.setItem(
          "scit_auth_toast",
          JSON.stringify({
            type: "admin",
            title: "🛡️ Admin Operations Active",
            message: "Authorized Specialist console verified. Live Meta API and database connected.",
            duration: 4000,
          })
        );
      } catch {}

      setTimeout(() => {
        router.push(res.redirectUrl || "/admin");
      }, 900);
    } catch (err: unknown) {
      const e = err as Error;
      setIsLoading(false);
      const errMsg = e.message || "An unexpected error occurred. Please try again.";
      setError(errMsg);
      setToast({
        type: "error",
        title: "Authentication Error",
        message: errMsg,
        duration: 4500,
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] px-4 py-8 text-slate-800 relative">
      {/* Animated Toast Notification */}
      <AnimatedToast toast={toast} onClose={() => setToast(null)} />

      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 sm:p-9 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-[#0B101B] p-0.5 flex items-center justify-center">
              <Image
                src="/images/shopno-it.jpg"
                alt="Shopno Career IT Logo"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-[14px]"
                priority
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-[#121826] tracking-tight">
              SHOPNO Career IT
            </h1>
            <span className="text-[10px] font-extrabold bg-[#3858F6] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Authorized operations and Meta Ads management console
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Clean Admin Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shopnocareerit.com"
                required
                className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#3858F6] focus:ring-[#3858F6] border-slate-300"
              />
              <span>Remember session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-md shadow-[#3858F6]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Access Operations Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Minimal Switcher to Client Login */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Client Account?{" "}
            <Link
              href="/login"
              className="text-[#3858F6] hover:underline font-bold"
            >
              Client Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
