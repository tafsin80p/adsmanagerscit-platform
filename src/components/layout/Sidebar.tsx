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
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const { setIsSupportModalOpen } = usePortal();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Create Order", href: "/create-order", icon: PlusCircle },
    { name: "My Orders", href: "/my-orders", icon: ClipboardList },
    { name: "Payment History", href: "/payment-history", icon: Wallet },
    { name: "Ads Performance", href: "/performance", icon: TrendingUp },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between bg-[#0B1730] text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#1A294A]">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Meta Infinity Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0866FF] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#0866FF]/20 group-hover:scale-105 transition-transform duration-200">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white fill-current"
                aria-hidden="true"
              >
                <path d="M12 10.3c-1.3-1.6-3.2-2.3-5.2-2.3-3.8 0-6.8 3-6.8 6.7 0 3.7 3 6.7 6.8 6.7 2.1 0 4-0.8 5.3-2.3 1.3 1.5 3.2 2.3 5.3 2.3 3.8 0 6.8-3 6.8-6.7 0-3.7-3-6.7-6.8-6.7-2.1 0-4 0.7-5.4 2.3zm-5.2 8.7c-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3c1.7 0 3.1 0.9 3.8 2.3-0.7 1.4-2.1 2.3-3.8 2.3zm10.4 0c-1.7 0-3.1-0.9-3.8-2.3 0.7-1.4 2.1-2.3 3.8-2.3 2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-tight flex items-center gap-1.5">
                Meta Ads
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-wide">
                Client Portal
              </div>
            </div>
          </Link>

          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
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
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#0866FF] text-white shadow-md shadow-[#0866FF]/25 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-[#12213D]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                  strokeWidth={isActive ? 2.3 : 1.9}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Support Section */}
      <div className="p-4 border-t border-[#1A294A]">
        <button
          onClick={() => {
            setIsSupportModalOpen(true);
            if (onMobileClose) onMobileClose();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#12213D] transition-colors group text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-[#12213D] group-hover:bg-[#1E3054] flex items-center justify-center transition-colors">
            <Headphones className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0866FF] transition-colors" />
          </div>
          <div>
            <div className="font-semibold text-slate-300 group-hover:text-white">
              Need Help?
            </div>
            <div className="text-[11px] text-slate-400">Contact Support</div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (240px) */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 fixed inset-y-0 left-0 z-30 shadow-sm border-r border-[#162544]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
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
