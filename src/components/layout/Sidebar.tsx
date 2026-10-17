"use client";

import React from "react";
import Link from "next/link";
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
  Sparkles,
  ShieldCheck,
  ChevronRight,
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

  const activeOrdersCount = orders.filter((o) => o.status === "Active").length;
  const totalOrdersCount = orders.length;

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
          name: "Create Order",
          href: "/create-order",
          icon: PlusCircle,
          badge: { text: "New", color: "bg-[#EBF2FF] text-[#0866FF]" },
        },
        {
          name: "My Orders",
          href: "/my-orders",
          icon: ClipboardList,
          badge: { text: String(totalOrdersCount), color: "bg-slate-100 text-slate-700" },
        },
      ],
    },
    {
      label: "ANALYTICS & BILLING",
      items: [
        {
          name: "Payment History",
          href: "/payment-history",
          icon: Wallet,
        },
        {
          name: "Ads Performance",
          href: "/performance",
          icon: TrendingUp,
          isLive: true,
        },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        {
          name: "Profile",
          href: "/profile",
          icon: User,
        },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between bg-white text-[#172033] border-r border-[#E7ECF3]">
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#E7ECF3] bg-white">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Meta Infinity Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0866FF] to-[#0052CC] flex items-center justify-center shadow-md shadow-[#0866FF]/20 group-hover:scale-105 transition-all duration-200">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white fill-current"
                aria-hidden="true"
              >
                <path d="M12 10.3c-1.3-1.6-3.2-2.3-5.2-2.3-3.8 0-6.8 3-6.8 6.7 0 3.7 3 6.7 6.8 6.7 2.1 0 4-0.8 5.3-2.3 1.3 1.5 3.2 2.3 5.3 2.3 3.8 0 6.8-3 6.8-6.7 0-3.7-3-6.7-6.8-6.7-2.1 0-4 0.7-5.4 2.3zm-5.2 8.7c-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3c1.7 0 3.1 0.9 3.8 2.3-0.7 1.4-2.1 2.3-3.8 2.3zm10.4 0c-1.7 0-3.1-0.9-3.8-2.3 0.7-1.4 2.1-2.3 3.8-2.3 2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#172033] font-bold text-base tracking-tight">
                  Meta Ads
                </span>
                <span className="text-[10px] font-bold bg-[#EBF2FF] text-[#0866FF] px-1.5 py-0.5 rounded-md">
                  PORTAL
                </span>
              </div>
              <div className="text-[11px] text-[#667085] font-medium tracking-wide">
                Client Dashboard
              </div>
            </div>
          </Link>

          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {section.label}
              </div>
              <nav className="space-y-1" aria-label={section.label}>
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
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-[#0866FF] text-white shadow-sm shadow-[#0866FF]/25 font-bold"
                          : "text-[#667085] hover:text-[#172033] hover:bg-[#F6F8FC]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-[#0866FF]"
                          }`}
                          strokeWidth={isActive ? 2.4 : 1.9}
                        />
                        <span>{item.name}</span>
                      </div>

                      {/* Right Badges */}
                      <div className="flex items-center gap-1.5">
                        {item.isLive && (
                          <span
                            className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-[#E8F8F2] text-[#12A875]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-white" : "bg-[#12A875] animate-pulse"
                              }`}
                            />
                            Live
                          </span>
                        )}

                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                              isActive
                                ? "bg-white/20 text-white"
                                : item.badge.color
                            }`}
                          >
                            {item.badge.text}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Quick Account Status Mini-Card */}
          <div className="p-3.5 rounded-2xl bg-[#F6F8FC] border border-[#E7ECF3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#172033] flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#12A875] animate-pulse" />
                {profile.businessName}
              </span>
              <span className="text-[10px] font-bold text-[#0866FF] bg-[#EBF2FF] px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#667085]">
              <span>Active Ad Sets</span>
              <span className="font-bold text-[#172033]">{activeOrdersCount} Running</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Support Section */}
      <div className="p-4 border-t border-[#E7ECF3] bg-white">
        <button
          onClick={() => {
            setIsSupportModalOpen(true);
            if (onMobileClose) onMobileClose();
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FC] hover:bg-[#EEF3FB] border border-[#E7ECF3] transition-all group text-left shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E7ECF3] group-hover:border-[#0866FF]/30 flex items-center justify-center text-[#0866FF] shadow-2xs transition-colors">
              <Headphones className="w-4 h-4 text-[#0866FF]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172033] group-hover:text-[#0866FF] transition-colors">
                Need Help?
              </div>
              <div className="text-[11px] text-[#667085]">Ad Specialist Support</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (240px) */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 fixed inset-y-0 left-0 z-30 shadow-xs border-r border-[#E7ECF3] bg-white">
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
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
