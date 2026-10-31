"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
  UploadCloud,
  LogOut,
  Bell,
  Globe,
  Share2,
  Check,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { AnimatedToast, ToastData } from "@/components/ui/AnimatedToast";

export default function AdminProfilePage() {
  const { profile, updateProfile, logout } = usePortal();

  // Top Tabs
  const [activeTab, setActiveTab] = useState<"info" | "security" | "agency">("info");

  // Profile Information Form State
  const [name, setName] = useState(profile.name || "Shopno IT Admin");
  const [email, setEmail] = useState(profile.email || "admin@shopnocareerit.com");
  const [phone, setPhone] = useState(profile.phone || "+880 1800-112233");
  const [businessName, setBusinessName] = useState(profile.businessName || "Shopno Career IT");
  const [avatar, setAvatar] = useState(profile.avatar || "/images/shopno-it.jpg");
  const [currency, setCurrency] = useState<"USD" | "BDT">(profile.currency || "USD");
  const [notifications, setNotifications] = useState({
    email: profile.notifications?.email ?? true,
    sms: profile.notifications?.sms ?? true,
    whatsapp: profile.notifications?.whatsapp ?? true,
  });

  // Agency Facebook Page Info
  const [agencyPage, setAgencyPage] = useState({
    name: profile.connectedPage?.name || "Shopno Career IT",
    id: profile.connectedPage?.id || "FB-SHOPNO-IT",
    followers: profile.connectedPage?.followers || "50K followers",
    category: profile.connectedPage?.category || "Information Technology Company",
    verified: profile.connectedPage?.verified ?? true,
    avatar: profile.connectedPage?.avatar || "/images/shopno-it.jpg",
  });

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email Update Form State (Dedicated in Security Tab)
  const [securityEmail, setSecurityEmail] = useState(profile.email || "admin@shopnocareerit.com");
  const [emailConfirmPassword, setEmailConfirmPassword] = useState("");
  const [showEmailConfirmPassword, setShowEmailConfirmPassword] = useState(false);

  // Feedback, Upload & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with portal context when loaded
  useEffect(() => {
    if (profile.name) setName(profile.name);
    if (profile.email) {
      setEmail(profile.email);
      setSecurityEmail(profile.email);
    }
    if (profile.phone) setPhone(profile.phone);
    if (profile.businessName) setBusinessName(profile.businessName);
    if (profile.avatar) setAvatar(profile.avatar);
    if (profile.currency) setCurrency(profile.currency);
    if (profile.notifications) setNotifications(profile.notifications);
    if (profile.connectedPage) {
      setAgencyPage({
        name: profile.connectedPage.name || "Shopno Career IT",
        id: profile.connectedPage.id || "FB-SHOPNO-IT",
        followers: profile.connectedPage.followers || "50K followers",
        category: profile.connectedPage.category || "Information Technology Company",
        verified: profile.connectedPage.verified ?? true,
        avatar: profile.connectedPage.avatar || profile.avatar || "/images/shopno-it.jpg",
      });
    }
  }, [profile]);

  // Fetch latest data from database
  const handleRefreshProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success && data.admin) {
        const u = data.admin;
        setName(u.name || "");
        setEmail(u.email || "");
        setSecurityEmail(u.email || "");
        setPhone(u.phone || "");
        setBusinessName(u.businessName || "");
        setAvatar(u.avatar || "/images/shopno-it.jpg");
        if (u.currency) setCurrency(u.currency);
        if (u.notifications) setNotifications(u.notifications);
        if (u.connectedPage) setAgencyPage((prev) => ({ ...prev, ...u.connectedPage }));

        updateProfile({
          name: u.name,
          email: u.email,
          phone: u.phone,
          businessName: u.businessName,
          avatar: u.avatar,
          currency: u.currency,
          notifications: u.notifications,
        });

        setToast({
          type: "admin",
          title: "Profile Refreshed",
          message: "Loaded latest administrator details from MongoDB Atlas.",
          duration: 3500,
        });
      }
    } catch {
      setToast({
        type: "error",
        title: "Refresh Failed",
        message: "Could not fetch profile from database.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar Image Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "admin_avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setAvatar(data.url);
        // Also update immediately in backend
        await fetch("/api/admin/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: data.url }),
        });
        updateProfile({ avatar: data.url });

        setToast({
          type: "admin",
          title: "Avatar Updated! 📸",
          message: "New administrator profile photo uploaded and saved successfully.",
          duration: 3500,
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: unknown) {
      const e = err as Error;
      setToast({
        type: "error",
        title: "Upload Error",
        message: e.message || "Failed to upload image. Please try again.",
        duration: 4500,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save General Profile Info (Name, Email, Phone, Business, Currency, Notifications)
  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({
        type: "error",
        title: "Validation Error",
        message: "Admin name cannot be empty.",
        duration: 4000,
      });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setToast({
        type: "error",
        title: "Validation Error",
        message: "Please enter a valid email address.",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        avatar: avatar.trim(),
        currency,
        notifications,
      };

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local PortalContext state
      updateProfile({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        businessName: payload.businessName,
        avatar: payload.avatar,
        currency: payload.currency,
        notifications: payload.notifications,
      });
      setSecurityEmail(payload.email);

      setToast({
        type: "admin",
        title: "Profile Saved Successfully! 🛡️",
        message: data.emailChanged
          ? "Admin information and email updated! Active session token refreshed."
          : "Administrator profile details updated in MongoDB Atlas.",
        duration: 4000,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setToast({
        type: "error",
        title: "Update Failed",
        message: e.message || "Could not save profile changes.",
        duration: 4500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setToast({
        type: "error",
        title: "Missing Current Password",
        message: "Please enter your current password to proceed.",
        duration: 4000,
      });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setToast({
        type: "error",
        title: "Invalid New Password",
        message: "New password must be at least 6 characters long.",
        duration: 4000,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({
        type: "error",
        title: "Passwords Do Not Match",
        message: "New password and confirmation password do not match.",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setToast({
        type: "admin",
        title: "Password Changed! 🔐",
        message: "Admin password successfully updated in MongoDB database.",
        duration: 4500,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setToast({
        type: "error",
        title: "Password Change Failed",
        message: e.message || "Could not update password.",
        duration: 4500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated Change Admin Login Email (Security Tab)
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = securityEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setToast({
        type: "error",
        title: "Invalid Email",
        message: "Please provide a valid email address.",
        duration: 4000,
      });
      return;
    }

    if (cleanEmail === profile.email?.toLowerCase()) {
      setToast({
        type: "info",
        title: "No Change Detected",
        message: "The entered email is already your current admin email address.",
        duration: 3500,
      });
      return;
    }

    if (!emailConfirmPassword) {
      setToast({
        type: "error",
        title: "Security Verification Required",
        message: "Please enter your admin password to authorize changing your primary login email.",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          currentPassword: emailConfirmPassword,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update email");
      }

      setEmail(cleanEmail);
      setEmailConfirmPassword("");
      updateProfile({ email: cleanEmail });

      setToast({
        type: "admin",
        title: "Login Email Updated! ✉️",
        message: `Admin email successfully updated to ${cleanEmail}. Your session has been refreshed.`,
        duration: 4500,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setToast({
        type: "error",
        title: "Email Change Failed",
        message: e.message || "Could not update login email.",
        duration: 4500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save Agency Facebook Asset Details
  const handleSaveAgencyPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectedPage: agencyPage,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update agency page");
      }

      updateProfile({ connectedPage: agencyPage });

      setToast({
        type: "admin",
        title: "Agency Page Saved! 🌐",
        message: "Connected agency Facebook brand assets synchronized.",
        duration: 3500,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setToast({
        type: "error",
        title: "Save Failed",
        message: e.message || "Could not update agency page details.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adminInitials =
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <AdminLayout pageTitle="Admin Profile & Security">
      {/* Toast Feedback */}
      <AnimatedToast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6 sm:space-y-7 max-w-[1400px] mx-auto pb-10">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight">
                Admin Profile & Security
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3858F6]/10 text-[#3858F6] border border-[#3858F6]/20">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3858F6]" />
                Super Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Manage your administrator identity, update login email & password, and configure system preferences.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefreshProfile}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#3858F6] ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Profile</span>
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3858F6] rounded-xl text-xs font-bold transition-all"
            >
              <span>Back to Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="bg-white p-2 rounded-2xl border border-[#E9EDF4] shadow-xs flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "info"
                ? "bg-[#3858F6] text-white shadow-md shadow-[#3858F6]/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>General Information</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "security"
                ? "bg-[#3858F6] text-white shadow-md shadow-[#3858F6]/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === "security"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab("agency")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "agency"
                ? "bg-[#3858F6] text-white shadow-md shadow-[#3858F6]/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Agency & Brand Profile</span>
          </button>
        </div>

        {/* Main Grid: Left Identity Sidebar + Right Active Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: Admin Identity Badge & Quick Overview       */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center relative overflow-hidden">
              {/* Subtle top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#3858F6] via-indigo-500 to-purple-600" />

              {/* Avatar with Upload Trigger */}
              <div className="relative w-28 h-28 mx-auto mt-2 mb-4 group">
                <div className="w-full h-full rounded-3xl overflow-hidden ring-4 ring-slate-100 shadow-xl bg-slate-900 flex items-center justify-center">
                  {avatar && (avatar.startsWith("http") || avatar.startsWith("/")) ? (
                    <Image
                      src={avatar}
                      alt={name}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black bg-gradient-to-br from-[#3858F6] to-purple-600">
                      {adminInitials}
                    </div>
                  )}
                </div>

                {/* Upload Hover Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Upload profile picture"
                  className="absolute bottom-1 right-1 p-2 rounded-2xl bg-[#3858F6] hover:bg-[#2542D9] text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              {/* Name & Titles */}
              <h2 className="text-xl font-black text-[#121826] tracking-tight">{name}</h2>
              <p className="text-xs font-semibold text-[#3858F6] mt-0.5">{businessName}</p>

              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                  Super Admin
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Session
                </span>
              </div>

              {/* Details List */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Login Email
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-[170px]" title={email}>
                    {email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Contact Phone
                  </span>
                  <span className="font-bold text-slate-800">{phone || "Not set"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Base Currency
                  </span>
                  <span className="font-bold text-[#3858F6] bg-blue-50 px-2 py-0.5 rounded-md">
                    {currency}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Session Type
                  </span>
                  <span className="font-bold text-emerald-700">Encrypted httpOnly</span>
                </div>
              </div>
            </div>

            {/* Quick Security Status Box */}
            <div className="bg-[#12151D] text-white p-6 rounded-[28px] shadow-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                    <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Security Checklist</h4>
                    <p className="text-[10px] text-white/50">Admin Privilege Status</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Protected
                </span>
              </div>

              <div className="space-y-2 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>MongoDB Atlas User Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PBKDF2 SHA-512 Password Salt Hashing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Role-Based Middleware Gatekeeper Active</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className="text-xs text-[#60A5FA] hover:text-white font-bold transition-colors cursor-pointer"
                >
                  Change Password →
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    window.location.href = "/admin/login";
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT CONTENT: Active Tab View                            */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* ----------------------------------------------------- */}
            {/* TAB 1: General Profile Information                   */}
            {/* ----------------------------------------------------- */}
            {activeTab === "info" && (
              <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
                <div>
                  <h3 className="text-lg font-black text-[#121826] tracking-tight">
                    Administrator Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your display name, official agency contact, and system notification preferences.
                  </p>
                </div>

                <form onSubmit={handleSaveGeneralInfo} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Administrator Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Shopno IT Admin"
                          required
                          className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Login Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Admin Email (Login Credential)
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
                          className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Official Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+880 1800-112233"
                          className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Business / Agency Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Agency Business Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Building className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Shopno Career IT"
                          className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Profile Image URL Input (Fallback to file upload) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Profile Avatar Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://... or /images/shopno-it.jpg"
                        className="flex-1 bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload File</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct image link or upload files up to 10MB (Cloudinary supported).
                    </p>
                  </div>

                  {/* Currency Preference */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Default Reporting Currency
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          currency === "USD"
                            ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                            : "bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-white"
                        }`}
                      >
                        <span>USD ($)</span>
                        {currency === "USD" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("BDT")}
                        className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          currency === "BDT"
                            ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                            : "bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-white"
                        }`}
                      >
                        <span>BDT (৳)</span>
                        {currency === "BDT" && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#3858F6]" />
                      <span>Admin Operations Notification Channels</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-[#F8FAFC] flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={(e) =>
                            setNotifications({ ...notifications, email: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#3858F6] focus:ring-[#3858F6] border-slate-300"
                        />
                        <div className="text-xs font-bold text-slate-800">Email Alerts</div>
                      </label>

                      <label className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-[#F8FAFC] flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.sms}
                          onChange={(e) =>
                            setNotifications({ ...notifications, sms: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#3858F6] focus:ring-[#3858F6] border-slate-300"
                        />
                        <div className="text-xs font-bold text-slate-800">SMS Notices</div>
                      </label>

                      <label className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-[#F8FAFC] flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.whatsapp}
                          onChange={(e) =>
                            setNotifications({ ...notifications, whatsapp: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#3858F6] focus:ring-[#3858F6] border-slate-300"
                        />
                        <div className="text-xs font-bold text-slate-800">WhatsApp Alert</div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-md shadow-[#3858F6]/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Profile Information</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB 2: Password & Credentials Security                */}
            {/* ----------------------------------------------------- */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Card A: Change Password */}
                <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-[#121826] tracking-tight">
                          Change Admin Password
                        </h3>
                        <span className="text-[10px] font-extrabold bg-[#3858F6]/10 text-[#3858F6] px-2 py-0.5 rounded-full uppercase">
                          Encrypted
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Update your master administrator password. Password is securely hashed using PBKDF2 SHA-512 before storage.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          required
                          className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password"
                            required
                            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Tip */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800">Password Requirements:</div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            newPassword.length >= 6 ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        <span>Minimum 6 characters in length</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            newPassword && confirmPassword && newPassword === confirmPassword
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        />
                        <span>Both passwords must match exactly</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#121826] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Update Admin Password</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Card B: Change Admin Login Email Address */}
                <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-[#121826] tracking-tight">
                        Change Primary Login Email
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your admin email is required to access the operations console. Changing this will update your login credentials.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#3858F6] flex items-center justify-center shrink-0 border border-blue-200">
                      <Mail className="w-5 h-5" />
                    </div>
                  </div>

                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Admin Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          New Administrator Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            value={securityEmail}
                            onChange={(e) => setSecurityEmail(e.target.value)}
                            placeholder="admin@shopnocareerit.com"
                            required
                            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Admin Password Confirmation */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Authorize with Admin Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showEmailConfirmPassword ? "text" : "password"}
                            value={emailConfirmPassword}
                            onChange={(e) => setEmailConfirmPassword(e.target.value)}
                            placeholder="Enter password to confirm"
                            required
                            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailConfirmPassword(!showEmailConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showEmailConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Note: Once changed, your browser session token will be updated automatically. You will need to use this new email on future logins at <code>/admin/login</code>.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating Email...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Update Admin Login Email</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB 3: Agency & Meta Brand Assets                     */}
            {/* ----------------------------------------------------- */}
            {activeTab === "agency" && (
              <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
                <div>
                  <h3 className="text-lg font-black text-[#121826] tracking-tight">
                    Agency & Meta Brand Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your primary agency Facebook Page asset information shown across client notifications and campaign headers.
                  </p>
                </div>

                <form onSubmit={handleSaveAgencyPage} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Agency Page Name
                      </label>
                      <input
                        type="text"
                        value={agencyPage.name}
                        onChange={(e) => setAgencyPage({ ...agencyPage, name: e.target.value })}
                        placeholder="Shopno Career IT"
                        required
                        className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Facebook Page ID
                      </label>
                      <input
                        type="text"
                        value={agencyPage.id}
                        onChange={(e) => setAgencyPage({ ...agencyPage, id: e.target.value })}
                        placeholder="FB-SHOPNO-IT"
                        required
                        className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Industry / Category
                      </label>
                      <input
                        type="text"
                        value={agencyPage.category}
                        onChange={(e) => setAgencyPage({ ...agencyPage, category: e.target.value })}
                        placeholder="Information Technology Company"
                        className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Public Followers / Audience Display
                      </label>
                      <input
                        type="text"
                        value={agencyPage.followers}
                        onChange={(e) => setAgencyPage({ ...agencyPage, followers: e.target.value })}
                        placeholder="50K followers"
                        className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-semibold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Agency Page Logo URL
                    </label>
                    <input
                      type="text"
                      value={agencyPage.avatar}
                      onChange={(e) => setAgencyPage({ ...agencyPage, avatar: e.target.value })}
                      placeholder="/images/shopno-it.jpg"
                      className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3858F6] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Agency Assets</span>
                    </button>

                    <Link
                      href="/admin/meta-integration"
                      className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                      <Share2 className="w-4 h-4 text-[#0866FF]" />
                      <span>Configure Meta Marketing API →</span>
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

