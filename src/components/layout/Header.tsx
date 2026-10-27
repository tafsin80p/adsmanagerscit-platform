"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  TrendingUp,
  ExternalLink,
  User,
  CreditCard,
  LogOut,
  MessageCircle,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  X,
  Flame,
  Sparkles,
  Command,
  CornerDownLeft,
  Calendar,
  Layers,
  ChevronRight,
  ShoppingBag,
  Building,
  Smartphone,
  Wallet,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order, PaymentTransaction } from "@/types";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  pageTitle = "Dashboard",
}) => {
  const router = useRouter();
  const {
    orders,
    payments,
    profile,
    setSelectedOrderForModal,
    setIsSupportModalOpen,
    setIsNotificationDrawerOpen,
    clientUnreadCount,
    logout,
  } = usePortal();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Dynamic date string
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, []);

  // Client isolation: Scope orders to logged-in client account
  const clientOrders = useMemo(() => {
    if (!profile?.email) return orders;
    const isMinMartAccount =
      profile.email === "minmartbd@gmail.com" ||
      profile.email === "tafsin@fashionhubbd.com" ||
      profile.name?.toLowerCase().includes("min mart") ||
      profile.connectedPage?.name?.toLowerCase().includes("min mart");

    return orders.filter((o: Order) => {
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
      if (isMinMartAccount && (!o.clientEmail || o.facebookPageName?.toLowerCase().includes("min mart"))) {
        return true;
      }
      return false;
    });
  }, [orders, profile?.email, profile?.name, profile?.connectedPage]);

  // Client isolation: Scope payments to this client
  const clientPayments = useMemo(() => {
    const orderIdSet = new Set(clientOrders.map((o) => o.id));
    return payments.filter((p: PaymentTransaction) => {
      return orderIdSet.has(p.orderId) || !profile?.email;
    });
  }, [payments, clientOrders, profile?.email]);

  // Quick Action Shortcuts definition
  const quickActions = useMemo(
    () => [
      {
        id: "create-boost",
        title: "Create Boost Order",
        subtitle: "Launch a new Facebook campaign",
        href: "/create-order",
        icon: PlusCircle,
        color: "text-[#3858F6] bg-[#EEF2FF]",
        keywords: ["create", "boost", "new", "ad", "order", "campaign", "launch"],
      },
      {
        id: "my-orders",
        title: "My Orders & Campaigns",
        subtitle: "Track order status, delivery, and spend",
        href: "/my-orders",
        icon: Layers,
        color: "text-emerald-600 bg-emerald-50",
        keywords: ["orders", "my", "campaigns", "boosts", "running", "all"],
      },
      {
        id: "billing",
        title: "Payment History & Receipts",
        subtitle: "View audit receipts and TrxID vouchers",
        href: "/payment-history",
        icon: CreditCard,
        color: "text-amber-600 bg-amber-50",
        keywords: ["payment", "billing", "history", "trx", "receipt", "voucher", "bkash", "nagad", "bank"],
      },
      {
        id: "all-boost",
        title: "Facebook Page All Boosts",
        subtitle: "Direct boosts on connected FB page",
        href: "/all-boosts",
        icon: Flame,
        color: "text-rose-600 bg-rose-50",
        keywords: ["all", "boost", "page", "facebook", "posts"],
      },
      {
        id: "support",
        title: "Contact Meta Specialist",
        subtitle: "Direct WhatsApp & Priority Support",
        action: () => setIsSupportModalOpen(true),
        icon: MessageCircle,
        color: "text-indigo-600 bg-indigo-50",
        keywords: ["help", "support", "contact", "specialist", "call", "whatsapp", "problem"],
      },
      {
        id: "profile",
        title: "Account Profile & Settings",
        subtitle: "Business credentials and preferences",
        href: "/profile",
        icon: User,
        color: "text-slate-600 bg-slate-100",
        keywords: ["profile", "account", "settings", "password", "email", "business"],
      },
    ],
    [setIsSupportModalOpen]
  );

  // Live Filtering Logic
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchedOrders = useMemo(() => {
    if (!trimmedQuery) return [];
    return clientOrders
      .filter((o) => {
        return (
          o.campaignName.toLowerCase().includes(trimmedQuery) ||
          o.id.toLowerCase().includes(trimmedQuery) ||
          (o.transactionId && o.transactionId.toLowerCase().includes(trimmedQuery)) ||
          (o.paymentMethod && o.paymentMethod.toLowerCase().includes(trimmedQuery)) ||
          (o.postType && o.postType.toLowerCase().includes(trimmedQuery)) ||
          (o.platform && o.platform.toLowerCase().includes(trimmedQuery)) ||
          (o.objective && o.objective.toLowerCase().includes(trimmedQuery)) ||
          (o.status && o.status.toLowerCase().includes(trimmedQuery)) ||
          (o.notes && o.notes.some((n) => n.toLowerCase().includes(trimmedQuery))) ||
          (o.items && o.items.some((it) => it.name.toLowerCase().includes(trimmedQuery) || it.postUrl.toLowerCase().includes(trimmedQuery)))
        );
      })
      .slice(0, 4);
  }, [clientOrders, trimmedQuery]);

  const matchedPayments = useMemo(() => {
    if (!trimmedQuery) return [];
    return clientPayments
      .filter((p) => {
        return (
          p.transactionId.toLowerCase().includes(trimmedQuery) ||
          p.campaignName.toLowerCase().includes(trimmedQuery) ||
          p.method.toLowerCase().includes(trimmedQuery) ||
          p.orderId.toLowerCase().includes(trimmedQuery) ||
          (p.senderNumber && p.senderNumber.toLowerCase().includes(trimmedQuery))
        );
      })
      .slice(0, 3);
  }, [clientPayments, trimmedQuery]);

  const matchedActions = useMemo(() => {
    if (!trimmedQuery) return [];
    return quickActions.filter((a) => {
      return (
        a.title.toLowerCase().includes(trimmedQuery) ||
        a.subtitle.toLowerCase().includes(trimmedQuery) ||
        a.keywords.some((k) => k.includes(trimmedQuery))
      );
    });
  }, [quickActions, trimmedQuery]);

  const hasAnyMatches =
    matchedOrders.length > 0 || matchedPayments.length > 0 || matchedActions.length > 0;

  // Handle Search Submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      setIsMobileSearchOpen(false);
      router.push(`/my-orders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsDropdownOpen(true);
        if (window.innerWidth < 640) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          searchInputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus mobile input on mobile search open
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchOpen]);

  return (
    <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-xs border-b border-[#E8ECF2] sticky top-0 z-20 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 will-change-transform [transform:translateZ(0)]">
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-white z-40 px-3.5 flex items-center gap-2 sm:hidden animate-in fade-in slide-in-from-top-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[#3858F6] absolute left-3 pointer-events-none" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit();
              }}
              placeholder="Search orders, campaigns, TRX..."
              className="w-full bg-[#F6F8FC] text-xs text-[#121826] pl-9 pr-8 py-2.5 rounded-xl border border-[#3858F6] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchOpen(false);
              setIsDropdownOpen(false);
            }}
            className="text-xs font-bold text-slate-600 px-2 py-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Left: Mobile hamburger & DealDeck Page Title + Date */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus:outline-none shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-[#121826] tracking-tight truncate">
            {pageTitle === "Dashboard" ? "Client Dashboard" : pageTitle}
          </h1>
          <p className="text-xs text-[#8A94A6] font-medium hidden sm:block truncate mt-0.5">
            {profile.businessName} • {todayFormatted}
          </p>
        </div>
      </div>

      {/* Center/Right: Functional Command Search Bar with Live Spotlight Dropdown */}
      <div
        ref={searchContainerRef}
        className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-2 hidden sm:block"
      >
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none transition-colors peer-focus:text-[#3858F6]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            placeholder="Search campaigns, orders (#1001), TrxID..."
            className="w-full bg-[#F6F8FC] hover:bg-[#F0F3F9] focus:bg-white text-xs sm:text-sm text-[#121826] pl-9.5 pr-18 py-2 sm:py-2.5 rounded-full border border-slate-200/80 focus:border-[#3858F6] focus:ring-4 focus:ring-[#3858F6]/10 shadow-2xs transition-all placeholder:text-slate-400 peer outline-none"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="pointer-events-auto p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                title="Clear query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                <Command className="w-3 h-3" />
                <span>K</span>
              </span>
            )}
          </div>
        </form>

        {/* Live Search Spotlight Dropdown */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in-50 zoom-in-98 duration-150 divide-y divide-slate-100 max-h-[75vh] flex flex-col">
            {/* Quick Filter Tags Header */}
            <div className="px-3.5 py-2.5 bg-[#FAFBFD] flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3858F6]" />
                {trimmedQuery ? "Search Results" : "Quick Navigation & Search"}
              </span>
              <div className="flex items-center gap-1.5">
                {["Active", "Pending", "bKash", "Bank"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      setIsDropdownOpen(true);
                      searchInputRef.current?.focus();
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      trimmedQuery === tag.toLowerCase()
                        ? "bg-[#3858F6] text-white"
                        : "bg-white hover:bg-slate-200 border border-slate-200 text-slate-600"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Body */}
            <div className="overflow-y-auto p-2 space-y-3 flex-1">
              {/* When User is Typing */}
              {trimmedQuery ? (
                hasAnyMatches ? (
                  <>
                    {/* Matching Campaigns & Orders */}
                    {matchedOrders.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#8A94A6] uppercase tracking-wider flex items-center justify-between">
                          <span>Campaigns & Orders</span>
                          <span className="text-[#3858F6] font-bold">{matchedOrders.length} found</span>
                        </div>
                        {matchedOrders.map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => {
                              setSelectedOrderForModal(order);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full p-2 hover:bg-[#F4F7FC] rounded-xl transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                                <Image
                                  src={order.thumbnail || "/images/winter-collection.jpg"}
                                  alt={order.campaignName}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 group-hover:text-[#3858F6] transition-colors truncate">
                                  {order.campaignName}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono font-bold text-slate-700">#{order.id}</span>
                                  <span>•</span>
                                  <span>${order.totalBudgetUSD.toFixed(2)} USD</span>
                                  <span>•</span>
                                  <span>{order.postType}</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <StatusBadge status={order.status} />
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3858F6] transition-colors" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matching Payment Transactions */}
                    {matchedPayments.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#8A94A6] uppercase tracking-wider flex items-center justify-between">
                          <span>Payment Transactions</span>
                          <span className="text-[#10B981] font-bold">{matchedPayments.length} found</span>
                        </div>
                        {matchedPayments.map((payment) => {
                          const relatedOrder = clientOrders.find((o) => o.id === payment.orderId);
                          return (
                            <button
                              key={payment.id}
                              type="button"
                              onClick={() => {
                                if (relatedOrder) {
                                  setSelectedOrderForModal(relatedOrder);
                                } else {
                                  router.push("/payment-history");
                                }
                                setIsDropdownOpen(false);
                              }}
                              className="w-full p-2 hover:bg-[#F4F7FC] rounded-xl transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                  {payment.method === "bKash" || payment.method === "Nagad" ? (
                                    <Smartphone className="w-4 h-4" />
                                  ) : (
                                    <Building className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#3858F6] transition-colors flex items-center gap-2">
                                    <span className="font-mono">{payment.transactionId}</span>
                                    <span className="text-[10px] font-normal text-slate-500">
                                      via {payment.method}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                    Order #{payment.orderId} • {payment.campaignName}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-xs font-black text-slate-900">
                                  ৳{(payment.amountBDT || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600">
                                  {payment.status}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Matching Quick Actions */}
                    {matchedActions.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#8A94A6] uppercase tracking-wider">
                          Quick Actions
                        </div>
                        {matchedActions.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => {
                                setIsDropdownOpen(false);
                                if (action.action) action.action();
                                else if (action.href) router.push(action.href);
                              }}
                              className="w-full p-2 hover:bg-[#F4F7FC] rounded-xl transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#3858F6] transition-colors">
                                    {action.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {action.subtitle}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3858F6] transition-colors shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      No matching records found for &ldquo;{searchQuery}&rdquo;
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Try searching with Order ID (e.g. #1001), Campaign name, TrxID, or payment method.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push("/create-order");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3858F6] text-white rounded-xl text-xs font-bold hover:bg-[#2542D9] transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create New Boost Order</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Initial State: Recent Campaigns & Common Shortcuts */
                <div className="space-y-3">
                  {/* Recent Campaigns (Top 3) */}
                  {clientOrders.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#8A94A6] uppercase tracking-wider flex items-center justify-between">
                        <span>Recent Campaigns</span>
                        <Link
                          href="/my-orders"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-[#3858F6] hover:underline normal-case text-[11px] font-bold"
                        >
                          View all ({clientOrders.length})
                        </Link>
                      </div>
                      {clientOrders.slice(0, 3).map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrderForModal(order);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full p-2 hover:bg-[#F4F7FC] rounded-xl transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                              <Image
                                src={order.thumbnail || "/images/winter-collection.jpg"}
                                alt={order.campaignName}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-[#3858F6] transition-colors truncate">
                                {order.campaignName}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-slate-600">#{order.id}</span>
                                <span>•</span>
                                <span>${order.totalBudgetUSD.toFixed(2)} USD</span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={order.status} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Shortcuts */}
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#8A94A6] uppercase tracking-wider">
                      Popular Shortcuts
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickActions.slice(0, 4).map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              if (action.action) action.action();
                              else if (action.href) router.push(action.href);
                            }}
                            className="p-2 hover:bg-[#F4F7FC] rounded-xl transition-colors flex items-center gap-2 text-left cursor-pointer group border border-slate-100"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-slate-900 group-hover:text-[#3858F6] transition-colors truncate">
                                {action.title}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar: Enter to View all in My Orders */}
            <div className="px-3.5 py-2.5 bg-[#F8FAFD] flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="text-[#3858F6] hover:text-[#2542D9] font-bold flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <span>View all matching orders in My Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-600 shadow-2xs">
                  Enter ↵
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Mobile Search Trigger, Notification Pill, User Profile Pill */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Mobile Search Button Trigger */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] shadow-sm flex items-center justify-center text-slate-600 hover:text-[#3858F6] transition-all cursor-pointer"
          title="Search orders"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* DealDeck Circular Notification Bell */}
        <div>
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] shadow-sm flex items-center justify-center text-slate-600 hover:text-[#3858F6] hover:border-[#3858F6]/30 transition-all cursor-pointer relative"
            aria-label="Open notifications drawer"
            title={`${clientUnreadCount} unread notifications`}
          >
            <Bell className="w-4 h-4" />
            {clientUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75 duration-200">
                {clientUnreadCount > 9 ? "9+" : clientUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* DealDeck User Profile Chip */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-slate-100/60 transition-colors text-left focus:outline-none group cursor-pointer"
            aria-label="User menu"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#3858F6]/20 group-hover:ring-[#3858F6] transition-all bg-slate-200 shrink-0">
              <Image
                src={profile.connectedPage?.avatar || profile.avatar || "/images/avatar.jpg"}
                alt={profile.name}
                fill
                unoptimized={true}
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs sm:text-sm font-bold text-[#121826] leading-tight group-hover:text-[#3858F6] transition-colors">
                {profile.name}
              </div>
              <div className="text-[10px] text-[#8A94A6] font-medium leading-tight mt-0.5">
                {profile.businessName}
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
                <Link
                  href="/admin"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC] hover:text-[#3858F6] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Admin Console
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
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#DC4545] hover:bg-red-50 transition-colors text-left cursor-pointer"
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
