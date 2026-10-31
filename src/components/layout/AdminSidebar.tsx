"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Wallet,
  Sliders,
  Users,
  ShieldCheck,
  ExternalLink,
  LogOut,
  X,
  ChevronRight,
  Headphones,
  CheckCircle2,
  TrendingUp,
  Share2,
  CreditCard,
  User,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: { text: string; color: string };
  isLive?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const { profile, orders, payments, logout } = usePortal();

  const adminName =
    profile.role === "Specialist" || profile.name?.toLowerCase().includes("admin")
      ? profile.name
      : "Shopno IT Admin";

  // Scope genuine portal orders placed through this software vs external page boosts
  const portalOrders = orders.filter((o) => !o.isExternalBoost && o.source !== "facebook_page_boost");
  const pageBoosts = orders.filter((o) => o.isExternalBoost || o.source === "facebook_page_boost");

  const pendingCount = portalOrders.filter(
    (o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification"
  ).length;
  const activeCount = portalOrders.filter((o) => o.status === "Active").length;
  const totalCount = portalOrders.length;
  const reviewPaymentsCount = payments.filter((p) => p.status === "Under Review").length;

  const navSections: NavSection[] = [
    {
      label: "ADMIN OPERATIONS",
      items: [
        {
          name: "Admin Console",
          href: "/admin",
          icon: LayoutDashboard,
          isLive: true,
        },
        {
          name: "Pending Approvals",
          href: "/admin/pending",
          icon: Clock,
          badge:
            pendingCount > 0
              ? { text: String(pendingCount), color: "bg-[#FEF3C7] text-[#D97706]" }
              : undefined,
        },
        {
          name: "All Client Orders",
          href: "/admin/orders",
          icon: ClipboardList,
          badge:
            totalCount > 0
              ? { text: String(totalCount), color: "bg-[#EEF2F6] text-slate-700" }
              : undefined,
        },
        {
          name: "Payment Audit",
          href: "/admin/payments",
          icon: Wallet,
          badge:
            reviewPaymentsCount > 0
              ? { text: String(reviewPaymentsCount), color: "bg-[#FEF3C7] text-[#D97706]" }
              : undefined,
        },
      ],
    },
    {
      label: "SPECIALIST TOOLS",
      items: [
        {
          name: "Payment Accounts",
          href: "/admin/rates",
          icon: CreditCard,
        },
        {
          name: "Users & Clients",
          href: "/admin/clients",
          icon: Users,
          badge: { text: "Manage", color: "bg-[#EEF2FF] text-[#3858F6]" },
        },
        {
          name: "Meta Ads Manager",
          href: "/admin/meta-integration",
          icon: Share2,
          badge: { text: "API", color: "bg-[#0866FF]/10 text-[#0866FF]" },
        },
        {
          name: "Admin Profile",
          href: "/admin/profile",
          icon: User,
          badge: { text: "Security", color: "bg-[#EAF8F1] text-[#10B981]" },
        },
      ],
    },
    {
      label: "PORTAL SWITCH",
      items: [
        {
          name: "View Client Portal",
          href: "/",
          icon: ExternalLink,
          badge: { text: "Live", color: "bg-[#EEF2FF] text-[#3858F6]" },
        },
        {
          name: "Sign Out",
          href: "/admin/login",
          icon: LogOut,
        },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between bg-white text-[#121826] border-r border-[#E8ECF2] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="overflow-y-auto px-4 py-5 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1.5 pt-1 pb-3.5 border-b border-[#F0F3F7]">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0 group flex-1">
            {/* Shopno Career IT Brand Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0B101B] border border-slate-800 shadow-md shadow-cyan-500/10 group-hover:scale-105 transition-all duration-200 shrink-0 flex items-center justify-center p-0.5">
              <Image
                src="/images/shopno-it.jpg"
                alt="Shopno Career IT Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[#121826] font-black text-sm tracking-tight whitespace-nowrap">
                  SHOPNO IT
                </span>
                <span className="text-[8px] font-black bg-[#121826] text-white px-1.5 py-0.5 rounded-md tracking-wider uppercase shrink-0 whitespace-nowrap shadow-xs">
                  ADMIN
                </span>
              </div>
              <div className="text-[10px] text-[#717D96] font-medium tracking-tight whitespace-nowrap truncate mt-0.5">
                Operations Console
              </div>
            </div>
          </Link>

          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="px-3 text-[11px] font-bold text-[#8C98A9] tracking-wider uppercase">
                {section.label}
              </div>
              <nav className="space-y-1.5" aria-label={section.label}>
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        onMobileClose?.();
                        if (item.href === "/admin/login") {
                          logout();
                        }
                      }}
                      className={`group flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#3858F6] text-white shadow-lg shadow-[#3858F6]/25 font-bold"
                          : "text-[#64748B] hover:text-[#121826] hover:bg-[#F4F6FA]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-[#3858F6]"
                          }`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className="tracking-tight truncate">{item.name}</span>
                      </div>

                      {/* Right Badges */}
                      {(item.isLive || item.badge) && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {item.isLive && (
                            <span
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap shrink-0 ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-[#EAF8F1] text-[#10B981]"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? "bg-white" : "bg-[#10B981] animate-pulse"
                                }`}
                              />
                              Live
                            </span>
                          )}

                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap shrink-0 min-w-[20px] text-center ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : item.badge.color
                              }`}
                            >
                              {item.badge.text}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Specialist Profile Card */}
      <div className="p-4 pt-2">
        <Link
          href="/admin/profile"
          onClick={onMobileClose}
          className="block bg-[#12151D] hover:bg-[#181C26] transition-colors text-white p-5 rounded-3xl relative overflow-hidden shadow-xl border border-white/5 space-y-3.5 group cursor-pointer"
        >
          {/* Subtle glow circle */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#3858F6]/25 rounded-full blur-xl pointer-events-none group-hover:bg-[#3858F6]/35 transition-all" />

          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 pointer-events-none">
              <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-[#60A5FA] bg-[#3858F6]/20 px-2 py-0.5 rounded-full">
              SUPER ADMIN
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#60A5FA] transition-colors">
                {adminName}
              </h4>
              <span className="text-[10px] text-white/50 group-hover:text-white transition-colors">Edit →</span>
            </div>
            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed font-normal">
              Meta Certified Media Buyer & Agency Strategy Lead
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API v21.0 Connected
            </span>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (260px) */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 fixed inset-y-0 left-0 z-30 shadow-xs border-r border-[#E7ECF3] bg-white">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
