"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  LogOut,
  Sliders,
  User,
  Users,
  ShieldCheck,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMobileMenuToggle,
  pageTitle = "Admin Operations Console",
}) => {
  const router = useRouter();
  const {
    profile,
    isSyncing,
    syncMetaMetrics,
    setIsNotificationDrawerOpen,
    adminUnreadCount,
    logout,
  } = usePortal();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const todayFormatted = "Tuesday, October 20th 2026";

  const adminName =
    profile.role === "Specialist" || profile.name?.toLowerCase().includes("admin")
      ? profile.name
      : "Shopno IT Admin";

  const adminEmail =
    profile.role === "Specialist" || profile.email?.toLowerCase().includes("admin")
      ? profile.email
      : "admin@shopnocareerit.com";

  const adminInitials =
    adminName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-xs border-b border-[#E8ECF2] sticky top-0 z-20 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 will-change-transform [transform:translateZ(0)]">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus:outline-none shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-[#121826] tracking-tight truncate">
              {pageTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121826] text-white text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Meta Partner v21.0
            </span>
          </div>
          <p className="text-xs text-[#8A94A6] font-medium hidden sm:block truncate mt-0.5">
            Admin: {adminName} • {todayFormatted}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Sync Meta API Button */}
        <button
          onClick={syncMetaMetrics}
          disabled={isSyncing}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-full text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#3858F6] ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync Live API"}</span>
        </button>

        {/* View Client Portal Pill */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3858F6] border border-[#C7D2FE] rounded-full text-xs font-bold transition-all shadow-xs"
        >
          <span>Client View</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Notification Bell Pill */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-[#F5F7FB] hover:bg-[#EEF2F6] border border-[#E8ECF2] flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
          aria-label="View notifications"
          title={`${adminUnreadCount} unread notifications`}
        >
          <Bell className="w-4 h-4" />
          {adminUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75 duration-200">
              {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
            </span>
          )}
        </button>

        {/* Admin Profile Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {adminInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#121826] leading-tight">
                {adminName}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                Super Admin
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block group-hover:text-slate-600" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E7ECF3] py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-[#E7ECF3]">
                <div className="text-xs font-bold text-[#172033]">{adminName}</div>
                <div className="text-[11px] text-slate-500 truncate">{adminEmail}</div>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] hover:text-[#3858F6]"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Admin Profile & Security
                </Link>
                <Link
                  href="/"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] hover:text-[#3858F6]"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  View Client Portal
                </Link>
                <Link
                  href="/admin/clients"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] hover:text-[#3858F6]"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  Manage Users & Clients
                </Link>
                <Link
                  href="/admin/rates"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] hover:text-[#3858F6]"
                >
                  <Sliders className="w-4 h-4 text-slate-400" />
                  Exchange Rate & Fees
                </Link>
              </div>

              <div className="border-t border-[#E7ECF3] pt-1 mt-1">
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    router.push("/admin/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#DC4545] hover:bg-red-50 text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
