"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  User,
  Building,
  Phone,
  Globe,
  Layers,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { AnimatedToast, ToastData } from "@/components/ui/AnimatedToast";

function ClientLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = usePortal();

  // Mode: "login" or "register"
  const [mode, setMode] = useState<"login" | "register">("login");

  // Sign In State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regName, setRegName] = useState("");
  const [regBusinessName, setRegBusinessName] = useState("");
  const [regPageName, setRegPageName] = useState("");
  const [regPageUrl, setRegPageUrl] = useState("");
  const [regCategory, setRegCategory] = useState("Shopping & Retail");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (searchParams.get("mode") === "register" || searchParams.get("tab") === "register") {
      setMode("register");
    }
  }, [searchParams]);

  // Handle Sign In Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginEmail.trim()) {
      const msg = "Please enter your registered email address.";
      setError(msg);
      setToast({
        type: "error",
        title: "Required Field Missing",
        message: msg,
        duration: 4000,
      });
      return;
    }
    if (!loginPassword) {
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
        email: loginEmail.trim(),
        password: loginPassword,
        accountType: "client",
      });

      if (!res.success) {
        setIsLoading(false);
        const errMsg = res.error || "Authentication failed. Please check your credentials.";
        setError(errMsg);
        setToast({
          type: "error",
          title: "Sign In Failed",
          message: errMsg,
          duration: 4500,
        });
        return;
      }

      setIsLoading(false);
      setToast({
        type: "success",
        title: "Signed In Successfully! 🎉",
        message: "Welcome back! Redirecting you to your client dashboard...",
        duration: 3500,
      });

      try {
        sessionStorage.setItem(
          "scit_auth_toast",
          JSON.stringify({
            type: "success",
            title: "Welcome Back! 🚀",
            message: "Signed in successfully. Your campaigns and live metrics are synced.",
            duration: 4000,
          })
        );
      } catch {}

      setTimeout(() => {
        router.push(res.redirectUrl || "/");
      }, 900);
    } catch (err: unknown) {
      const e = err as Error;
      setIsLoading(false);
      const errMsg = e.message || "An unexpected error occurred. Please try again.";
      setError(errMsg);
      setToast({
        type: "error",
        title: "Sign In Error",
        message: errMsg,
        duration: 4500,
      });
    }
  };

  // Handle Create Account Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      const msg = "Please enter your full name.";
      setError(msg);
      setToast({
        type: "error",
        title: "Required Field Missing",
        message: msg,
        duration: 4000,
      });
      return;
    }
    if (!regEmail.trim()) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      setToast({
        type: "error",
        title: "Required Field Missing",
        message: msg,
        duration: 4000,
      });
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setError(msg);
      setToast({
        type: "error",
        title: "Invalid Password",
        message: msg,
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          businessName: regPageName.trim() || regBusinessName.trim() || `${regName.trim()}'s Business`,
          facebookPageName: regPageName.trim() || regBusinessName.trim(),
          facebookPageUrl: regPageUrl.trim(),
          pageCategory: regCategory,
          phone: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: "client",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        const errMsg = data.error || "Failed to create account. Please try again.";
        setError(errMsg);
        setToast({
          type: "error",
          title: "Account Creation Failed",
          message: errMsg,
          duration: 4500,
        });
        return;
      }

      setSuccessMsg("Account created successfully! Logging you in...");

      // Automatically log the user in immediately
      const loginRes = await login({
        email: regEmail.trim(),
        password: regPassword,
        accountType: "client",
      });

      setIsLoading(false);

      if (loginRes.success) {
        setToast({
          type: "success",
          title: "Account Created Successfully! 🚀",
          message: `Welcome aboard, ${regName.trim()}! Preparing your Meta Ads workspace...`,
          duration: 3500,
        });

        try {
          sessionStorage.setItem(
            "scit_auth_toast",
            JSON.stringify({
              type: "success",
              title: "Welcome to Shopno IT Meta Ads! 🎉",
              message: `Account activated for ${regName.trim()}. Launch your first boost campaign now.`,
              duration: 4500,
            })
          );
        } catch {}

        setTimeout(() => {
          router.push(loginRes.redirectUrl || "/");
        }, 1100);
      } else {
        // Fallback: switch to login mode with prefilled email
        setLoginEmail(regEmail.trim());
        setMode("login");
        setSuccessMsg("Account created! Please sign in with your password.");
        setToast({
          type: "success",
          title: "Account Created! 🎉",
          message: "Please sign in with your password to access your dashboard.",
          duration: 4000,
        });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setIsLoading(false);
      const errMsg = e.message || "An unexpected error occurred during registration.";
      setError(errMsg);
      setToast({
        type: "error",
        title: "Registration Error",
        message: errMsg,
        duration: 4500,
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] px-4 py-10 text-slate-800 relative">
      {/* Animated Toast Notification */}
      <AnimatedToast toast={toast} onClose={() => setToast(null)} />

      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 sm:p-9 space-y-6">
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
              SHOPNO CAREER IT
            </h1>
            <span className="text-[10px] font-extrabold bg-[#0866FF] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Client Area
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {mode === "login"
              ? "Sign in to track your Facebook & Instagram boost campaigns"
              : "Register your business to start boosting ads with Shopno IT"}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-semibold">{successMsg}</div>
          </div>
        )}

        {/* MODE 1: SIGN IN FORM */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
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
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0866FF] focus:ring-[#0866FF] border-slate-300"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Switch to Register */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-[#0866FF] hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-center">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#3858F6] transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-50"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Admin / Specialist Login →</span>
                </Link>
              </div>
            </div>
          </form>
        ) : (
          /* MODE 2: CREATE ACCOUNT FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Tanvir Hasan"
                  required
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Facebook Page / Brand Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0866FF]">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={regPageName}
                  onChange={(e) => setRegPageName(e.target.value)}
                  placeholder="e.g. Min Mart BD, Aarong Silk, Style Zone"
                  required
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Facebook Page Link or Page ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={regPageUrl}
                  onChange={(e) => setRegPageUrl(e.target.value)}
                  placeholder="e.g. https://facebook.com/yourpagename"
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Page Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Layers className="w-4 h-4" />
                </div>
                <select
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value)}
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Shopping & Retail">Shopping & Retail / E-commerce</option>
                  <option value="Clothing & Apparel">Clothing & Fashion</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                  <option value="Food & Restaurant">Food & Restaurant</option>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Digital Agency & Services">Digital Agency & Services</option>
                  <option value="Health & Medical">Health & Medical</option>
                  <option value="Other Business">Other Business</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone / WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. 01712-345678"
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@business.com"
                  required
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password * (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showRegPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={6}
                  required
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Client Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Switch to Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-[#0866FF] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-xs text-slate-400">Loading...</div>}>
      <ClientLoginContent />
    </Suspense>
  );
}
