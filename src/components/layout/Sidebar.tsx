"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Wallet,
  TrendingUp,
  User,
  Headphones,
  X,
  ShieldCheck,
  ChevronRight,
  Flame,
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const { orders, profile, setIsSupportModalOpen } = usePortal();

  // Client isolation: Scope orders to logged-in client account
  const clientOrders = profile?.email
    ? orders.filter((o) => {
        if (o.clientEmail && o.clientEmail.toLowerCase() === profile.email.toLowerCase()) return true;
        if (
          profile.connectedPage?.name &&
          o.facebookPageName &&
          o.facebookPageName.toLowerCase() === profile.connectedPage.name.toLowerCase()
        ) {
          return true;
        }
        if (profile.connectedPage?.id && o.facebookPageId && o.facebookPageId === profile.connectedPage.id) {
          return true;
        }
        if (
          (profile.email === "minmartbd@gmail.com" || profile.email === "tafsin@fashionhubbd.com") &&
          (!o.clientEmail || o.facebookPageName?.toLowerCase().includes("min mart"))
        ) {
          return true;
        }
        return false;
      })
    : orders;

  const portalOrders = clientOrders.filter((o) => !o.isExternalBoost && o.source !== "facebook_page_boost");
  const portalOrdersCount = portalOrders.length;
  const allBoostsCount = clientOrders.length;

  const navSections: NavSection[] = [
    {
      label: "MAIN MENU",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
        },
        {
          name: "All Boost",
          href: "/all-boosts",
          icon: Flame,
          badge: { text: String(allBoostsCount), color: "bg-[#EEF2FF] text-[#3858F6]" },
        },
        {
          name: "Ads Performance",
          href: "/performance",
          icon: TrendingUp,
          isLive: true,
        },
        {
          name: "My Orders",
          href: "/my-orders",
          icon: ClipboardList,
          badge:
            portalOrdersCount > 0
              ? { text: String(portalOrdersCount), color: "bg-[#EEF2FF] text-[#3858F6]" }
              : undefined,
        },
        {
          name: "Create Order",
          href: "/create-order",
          icon: PlusCircle,
          badge: { text: "New", color: "bg-[#EEF2FF] text-[#3858F6]" },
        },
      ],
    },
    {
      label: "BILLING & ACCOUNT",
      items: [
        {
          name: "Payment History",
          href: "/payment-history",
          icon: Wallet,
        },
        {
          name: "Account Profile",
          href: "/profile",
          icon: User,
        },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between bg-white text-[#121826] border-r border-[#E8ECF2] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="overflow-y-auto px-4 py-5 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1.5 pt-1 pb-3.5 border-b border-[#F0F3F7]">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group flex-1">
            {/* Shopno Career IT Brand Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0B101B] border border-slate-200/80 shadow-md group-hover:scale-105 transition-all duration-200 shrink-0 flex items-center justify-center p-0.5">
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
                <span className="text-[8px] font-black bg-[#3858F6] text-white px-1.5 py-0.5 rounded-md tracking-wider uppercase shrink-0 whitespace-nowrap shadow-xs">
                  Ads Manager
                </span>
              </div>
              <div className="text-[10px] text-[#717D96] font-medium tracking-tight whitespace-nowrap truncate mt-0.5">
                Client Growth Portal
              </div>
            </div>
          </Link>

          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
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
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
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

      {/* Ad Specialist Support Card */}
      <div className="p-4 pt-2">
        <div className="bg-[#12151D] text-white p-5 rounded-3xl relative overflow-hidden shadow-xl border border-white/5 space-y-3.5">
          {/* Subtle glow circle */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#3858F6]/25 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 pointer-events-none">
              <Headphones className="w-4 h-4 text-[#60A5FA]" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-[#60A5FA] bg-[#3858F6]/20 px-2 py-0.5 rounded-full">
              SUPPORT
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Need Ad Guidance?
            </h4>
            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed font-normal">
              Talk directly with certified Meta Ad specialists
            </p>
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                setIsSupportModalOpen(true);
                if (onMobileClose) onMobileClose();
              }}
              className="w-full py-2.5 px-3 bg-[#3858F6] hover:bg-[#2B49E6] text-white text-xs font-bold rounded-2xl shadow-lg shadow-[#3858F6]/30 transition-transform active:scale-95 text-center block cursor-pointer"
            >
              Contact Specialist
            </button>
          </div>
        </div>
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
