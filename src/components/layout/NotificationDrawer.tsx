"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Bell,
  CheckCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  BkashLogo,
  NagadLogo,
  CityBankLogo,
  BracBankLogo,
  DbblLogo,
} from "@/components/ui/BankLogos";
import { usePortal } from "@/context/PortalContext";
import { NotificationItem } from "@/types";

interface NotificationDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  isAdmin?: boolean;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  isAdmin: propIsAdmin,
}) => {
  const pathname = usePathname();
  const isAdmin =
    propIsAdmin !== undefined
      ? propIsAdmin
      : (pathname?.startsWith("/admin") ?? false);

  const {
    orders,
    setSelectedOrderForModal,
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    clientNotifications,
    adminNotifications,
    clientUnreadCount,
    adminUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = usePortal();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isNotificationDrawerOpen;
  const onClose = propOnClose || (() => setIsNotificationDrawerOpen(false));

  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "payment" | "boost" | "insight">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const notificationList = isAdmin ? adminNotifications : clientNotifications;
  const unreadCount = isAdmin ? adminUnreadCount : clientUnreadCount;

  const markAllAsRead = () => {
    markAllNotificationsAsRead(isAdmin);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id, isAdmin);

    // If linked to an order, open the order details modal
    if (item.orderId) {
      const matchedOrder = orders.find((o) => o.id === item.orderId);
      if (matchedOrder) {
        setSelectedOrderForModal(matchedOrder);
        onClose();
      }
    }
  };

  const filteredNotifications = notificationList.filter((item) => {
    if (filter === "all") return true;
    return item.category === filter;
  });

  // Render provider logo with matching branding container
  const renderProviderIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "bkash":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#FFF0F5] border border-[#E2136E]/20 flex items-center justify-center p-2 shrink-0 shadow-xs">
            <BkashLogo className="w-7 h-7" alt="bKash" />
          </div>
        );
      case "citybank":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#F0F7FF] border border-[#005BAC]/20 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <CityBankLogo className="w-7 h-7" alt="City Bank" />
          </div>
        );
      case "nagad":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#FFF5ED] border border-[#E31E24]/20 flex items-center justify-center p-2 shrink-0 shadow-xs">
            <NagadLogo className="w-7 h-7" alt="Nagad" />
          </div>
        );
      case "brac":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#F4FBF7] border border-[#006A4E]/20 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <BracBankLogo className="w-7 h-7" alt="BRAC Bank" />
          </div>
        );
      case "dbbl":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#F6F5FC] border border-[#582D82]/20 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <DbblLogo className="w-7 h-7" alt="Dutch-Bangla Bank" />
          </div>
        );
      case "meta":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] border border-[#3858F6]/20 flex items-center justify-center text-[#3858F6] shrink-0 shadow-xs">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
              aria-hidden="true"
            >
              <path d="M12 10.3c-1.3-1.6-3.2-2.3-5.2-2.3-3.8 0-6.8 3-6.8 6.7 0 3.7 3 6.7 6.8 6.7 2.1 0 4-0.8 5.3-2.3 1.3 1.5 3.2 2.3 5.3 2.3 3.8 0 6.8-3 6.8-6.7 0-3.7-3-6.7-6.8-6.7-2.1 0-4 0.7-5.4 2.3zm-5.2 8.7c-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3c1.7 0 3.1 0.9 3.8 2.3-0.7 1.4-2.1 2.3-3.8 2.3zm10.4 0c-1.7 0-3.1-0.9-3.8-2.3 0.7-1.4 2.1-2.3 3.8-2.3 2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3z" />
            </svg>
          </div>
        );
      case "whatsapp":
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#E8FAF0] border border-[#25D366]/25 flex items-center justify-center text-[#25D366] shrink-0 shadow-xs">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
        );
      case "system":
        return (
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      case "tip":
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#FFF6E7] border border-[#F59E0B]/20 flex items-center justify-center text-[#D97706] shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-backdrop-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
        <div className="w-screen max-w-md h-full pointer-events-auto bg-white shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-drawer-slide-in">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-[#F0F3F7] bg-white sticky top-0 z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-[#EEF2FF] text-[#3858F6]"}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#121826] tracking-tight">
                      {isAdmin ? "Admin Notifications" : "Notifications"}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444] text-white">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8A94A6] font-medium mt-0.5">
                    {isAdmin
                      ? "Live campaign approvals, TrxIDs & agency alerts"
                      : "Live payment updates & Meta boost alerts"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all duration-200 hover:rotate-90 cursor-pointer active:scale-90"
                  aria-label="Close notification panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-header: Filters & Mark all read */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { key: "all", label: "All" },
                  { key: "payment", label: "Payments" },
                  { key: "boost", label: "Boosts" },
                  { key: "insight", label: "Insights" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 ${
                      filter === tab.key
                        ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                        : "bg-[#F5F7FB] text-[#717D96] hover:text-[#121826] hover:bg-[#EEF2F8]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3858F6] hover:underline shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body: Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0F3F7] p-2">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#121826]">No notifications found</h4>
                <p className="text-xs text-slate-400">
                  {isAdmin
                    ? "You are all caught up! There are no pending approvals or alerts right now."
                    : "You are all caught up! There are no active alerts right now."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer flex gap-3.5 group my-1.5 relative border hover:translate-x-1 hover:shadow-xs active:scale-[0.99] ${
                    n.isRead
                      ? "bg-white hover:bg-[#F9FAFC] border-slate-100"
                      : "bg-[#EEF4FF]/75 hover:bg-[#E5EEFF] border-[#C7D9FD]/70"
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3858F6] absolute top-4 right-4 ring-2 ring-white animate-pulse" />
                  )}

                  {/* Provider Logo Container */}
                  {renderProviderIcon(n.type)}

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs sm:text-sm font-bold leading-snug group-hover:text-[#3858F6] transition-colors ${n.isRead ? "text-[#121826]" : "text-[#0F172A] font-extrabold"}`}>
                        {n.title}
                      </h4>
                      {n.statusBadge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.statusBadge.bg} ${n.statusBadge.textColor}`}
                        >
                          {n.statusBadge.text}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      {n.description}
                    </p>

                    {/* Metadata Pill Row */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8A94A6] font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{n.time}</span>
                      </span>

                      {n.amountBDT && (
                        <span className="font-bold text-[#121826] bg-[#F1F4F9] px-2 py-0.5 rounded-md">
                          ৳{n.amountBDT.toLocaleString()} BDT
                        </span>
                      )}

                      {n.amountUSD && !n.amountBDT && (
                        <span className="font-bold text-[#121826] bg-[#F1F4F9] px-2 py-0.5 rounded-md">
                          ${n.amountUSD.toLocaleString()} USD
                        </span>
                      )}

                      {n.orderId && (
                        <span className="font-mono text-[#3858F6] font-bold">
                          #{n.orderId}
                        </span>
                      )}

                      {n.trxId && (
                        <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          Trx: {n.trxId}
                        </span>
                      )}
                    </div>

                    {/* Quick Action Hint */}
                    {n.orderId && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3858F6] group-hover:underline">
                          <span>View Order Details</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-[#F0F3F7] bg-white space-y-2 sticky bottom-0">
            <div className="grid grid-cols-2 gap-2">
              {isAdmin ? (
                <>
                  <Link
                    href="/admin/payments"
                    onClick={onClose}
                    className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-center text-xs font-bold text-slate-700 transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                  >
                    <span>Verify Payments</span>
                  </Link>
                  <Link
                    href="/admin/orders"
                    onClick={onClose}
                    className="py-2.5 px-3 rounded-xl bg-[#3858F6] hover:bg-[#2542D9] text-center text-xs font-bold text-white shadow-md shadow-[#3858F6]/20 transition-all active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>Admin Orders</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/payment-history"
                    onClick={onClose}
                    className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-center text-xs font-bold text-slate-700 transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                  >
                    <span>Payment History</span>
                  </Link>
                  <Link
                    href="/my-orders"
                    onClick={onClose}
                    className="py-2.5 px-3 rounded-xl bg-[#3858F6] hover:bg-[#2542D9] text-center text-xs font-bold text-white shadow-md shadow-[#3858F6]/20 transition-all active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>All Orders</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
