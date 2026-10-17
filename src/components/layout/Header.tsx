"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  User,
  CreditCard,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, pageTitle = "Dashboard" }) => {
  const router = useRouter();
  const { profile, setIsSupportModalOpen } = usePortal();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/my-orders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const notifications = [
    {
      id: 1,
      title: "Ad Boost Active",
      message: "Order #AD-1001 'Winter Collection' is running and delivering impressions.",
      time: "1 hour ago",
      icon: CheckCircle2,
      color: "text-[#12A875] bg-[#E8F8F2]",
      read: false,
    },
    {
      id: 2,
      title: "Payment Under Verification",
      message: "bKash TRX #BK99P8088 for order #AD-1005 is being verified by admin.",
      time: "4 hours ago",
      icon: Clock,
      color: "text-[#D97706] bg-[#FFF4E5]",
      read: false,
    },
    {
      id: 3,
      title: "Weekly Performance Ready",
      message: "Your ads generated 140+ high intent WhatsApp messages this week.",
      time: "2 days ago",
      icon: Sparkles,
      color: "text-[#0866FF] bg-[#EBF2FF]",
      read: true,
    },
  ];

  return (
    <header className="h-16 md:h-20 bg-white border-b border-[#E7ECF3] sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 md:gap-6 flex-1 max-w-xl">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your orders, campaigns..."
            className="w-full bg-[#F6F8FC] hover:bg-[#F0F3F9] focus:bg-white text-xs md:text-sm text-[#172033] placeholder:text-slate-400 pl-10 pr-4 py-2 md:py-2.5 rounded-xl border border-transparent focus:border-[#0866FF] focus:outline-none transition-all shadow-xs"
          />
        </form>

        <span className="sm:hidden text-sm font-semibold text-[#172033] truncate">
          {pageTitle}
        </span>
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="relative p-2 text-slate-500 hover:text-[#0866FF] hover:bg-[#F6F8FC] rounded-xl transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC4545] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E7ECF3] py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-[#E7ECF3] flex items-center justify-between">
                <span className="font-semibold text-sm text-[#172033]">Notifications</span>
                <span className="text-[11px] font-medium text-[#0866FF] bg-[#EBF2FF] px-2 py-0.5 rounded-full">
                  Recent Activity
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="p-3.5 hover:bg-[#F6F8FC] transition-colors flex gap-3 text-left cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#172033] flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t border-[#E7ECF3] text-center">
                <Link
                  href="/my-orders"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-[#0866FF] hover:underline"
                >
                  View all order updates &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 md:pr-2.5 rounded-xl hover:bg-[#F6F8FC] transition-colors text-left focus:outline-none group"
            aria-label="User menu"
          >
            <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden ring-2 ring-[#0866FF]/20 group-hover:ring-[#0866FF] transition-all bg-slate-200 shrink-0">
              <Image
                src={profile.avatar}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs md:text-sm font-semibold text-[#172033] leading-snug group-hover:text-[#0866FF] transition-colors">
                {profile.name}
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-none">
                {profile.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E7ECF3] py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-[#E7ECF3]">
                <div className="text-xs font-semibold text-[#172033]">{profile.businessName}</div>
                <div className="text-[11px] text-slate-500 truncate">{profile.email}</div>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC] hover:text-[#0866FF] transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Account Profile
                </Link>
                <Link
                  href="/payment-history"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC] hover:text-[#0866FF] transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  Payment History
                </Link>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsSupportModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC] hover:text-[#0866FF] transition-colors text-left"
                >
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  Contact Support
                </button>
              </div>

              <div className="border-t border-[#E7ECF3] pt-1 mt-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    alert("Session simulation: In production this cleanly clears the authenticated session.");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#DC4545] hover:bg-red-50 transition-colors text-left"
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
