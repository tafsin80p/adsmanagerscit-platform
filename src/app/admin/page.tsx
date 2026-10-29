"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Sliders,
  Settings,
  Eye,
  Send,
  Building,
  Calendar,
  Layers,
  Megaphone,
  ShoppingBag,
  Zap,
  ClipboardList,
  Copy,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order, OrderStatus, getOrderCategory } from "@/types";

export default function AdminDashboardPage() {
  const {
    orders,
    payments,
    exchangeRateBDT,
    profile,
    liveMetrics,
    syncMetaMetrics,
    isSyncing,
    isLoadingOrders,
    refreshOrders,
    refreshPayments,
    setSelectedOrderForModal,
    updateOrderStatus,
  } = usePortal();

  const [dateFilter, setDateFilter] = useState("Last 7 Days");
  const [sourceTab, setSourceTab] = useState<"portal" | "facebook_page">("portal");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "budget-high" | "budget-low">("newest");
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const adminName =
    profile.role === "Specialist" || profile.name?.toLowerCase().includes("admin")
      ? profile.name
      : "Shopno IT Admin";

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshOrders(), refreshPayments()]);
      showNotification("Admin console synchronized with live database!");
    } catch {
      showNotification("Failed to refresh live data.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleApproveOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Active");
    showNotification(`Order #${orderId} approved and launched on Meta Ads!`);
  };

  const handlePauseOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Paused");
    showNotification(`Order #${orderId} paused.`);
  };

  const handleResumeOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Active");
    showNotification(`Order #${orderId} resumed on Meta Ads!`);
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Differentiate Portal Orders vs Connected Facebook Page Boosts
  const portalOrders = useMemo(
    () => orders.filter((o) => !o.isExternalBoost && o.source !== "facebook_page_boost"),
    [orders]
  );
  const pageBoosts = useMemo(
    () => orders.filter((o) => o.isExternalBoost || o.source === "facebook_page_boost"),
    [orders]
  );

  const pendingOrders = useMemo(
    () => portalOrders.filter((o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification"),
    [portalOrders]
  );

  const activeOrders = useMemo(
    () => portalOrders.filter((o) => o.status === "Active"),
    [portalOrders]
  );

  const completedOrders = useMemo(
    () => portalOrders.filter((o) => o.status === "Completed"),
    [portalOrders]
  );

  const pausedOrders = useMemo(
    () => portalOrders.filter((o) => o.status === "Paused"),
    [portalOrders]
  );

  const totalSpendUSD = useMemo(
    () => portalOrders.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0),
    [portalOrders]
  );

  const totalSpendBDT = Math.round(totalSpendUSD * (exchangeRateBDT || 150));

  const pageBoostsSpendUSD = useMemo(
    () => pageBoosts.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0),
    [pageBoosts]
  );

  // Dynamic Total Verified Reach, Impressions & Inquiries (Prevents double counting)
  const totalAudienceReach = useMemo(() => {
    const fromOrders = orders.reduce((sum, o) => sum + (o.metrics?.reach || 0), 0);
    return Math.max(fromOrders, liveMetrics?.reach || 0);
  }, [orders, liveMetrics]);

  const totalImpressions = useMemo(() => {
    const fromOrders = orders.reduce((sum, o) => sum + (o.metrics?.impressions || 0), 0);
    return Math.max(fromOrders, liveMetrics?.impressions || 0);
  }, [orders, liveMetrics]);

  const totalConversations = useMemo(() => {
    const fromOrders = orders.reduce((sum, o) => sum + (o.metrics?.conversations || 0), 0);
    return Math.max(fromOrders, liveMetrics?.messages || 0);
  }, [orders, liveMetrics]);

  // Dynamic Reach Growth Rate
  const reachGrowthPercent = useMemo(() => {
    if (liveMetrics?.reachGrowth && liveMetrics.reachGrowth > 0) {
      return liveMetrics.reachGrowth;
    }
    if (orders.length > 0 && totalAudienceReach > 0) {
      const activeReach = orders
        .filter((o) => o.status === "Active")
        .reduce((sum, o) => sum + (o.metrics?.reach || 0), 0);
      const growth = (activeReach / totalAudienceReach) * 100;
      return growth > 0 ? parseFloat(growth.toFixed(1)) : 18.4;
    }
    return 18.4;
  }, [liveMetrics, orders, totalAudienceReach]);

  // Dataset currently active in table
  const activeDataset = sourceTab === "portal" ? portalOrders : pageBoosts;

  // Status mapping for tab badges
  const statuses = ["All", "Pending", "Active", "Paused", "Completed"];
  const statusCounts = useMemo(() => {
    return {
      All: activeDataset.length,
      Pending: activeDataset.filter((o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification").length,
      Active: activeDataset.filter((o) => o.status === "Active").length,
      Paused: activeDataset.filter((o) => o.status === "Paused").length,
      Completed: activeDataset.filter((o) => o.status === "Completed").length,
    };
  }, [activeDataset]);

  // Categories
  const categories = ["All Formats", "Boost Post", "Ads Campaign", "Promotion"];

  // Filtered & Sorted Orders for Admin Console Table
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = activeDataset.filter((order) => {
      const matchesSearch =
        !query ||
        order.campaignName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.transactionId && order.transactionId.toLowerCase().includes(query)) ||
        (order.postType && order.postType.toLowerCase().includes(query)) ||
        profile.businessName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Pending"
          ? order.status === "Pending" || order.paymentStatus === "Awaiting Verification"
          : order.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All Formats" ||
        order.postType?.toLowerCase().includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "budget-high") {
        return (b.totalBudgetUSD || 0) - (a.totalBudgetUSD || 0);
      }
      if (sortBy === "budget-low") {
        return (a.totalBudgetUSD || 0) - (b.totalBudgetUSD || 0);
      }
      if (sortBy === "oldest") {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateA - dateB;
      }
      // default: newest
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });
  }, [activeDataset, searchQuery, statusFilter, categoryFilter, sortBy, profile.businessName]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All" || categoryFilter !== "All Formats";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All Formats");
    setSortBy("newest");
  };

  return (
    <AdminLayout pageTitle="Admin Operations Console">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#121826] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="space-y-6 sm:space-y-7">
        {/* Top Header Section with Live Status & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight">
                Master Operations Console
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                MongoDB Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1 flex items-center gap-2">
              <span>Client Portfolio: <strong>{profile.businessName} & Brands</strong></span>
              <span>•</span>
              <span>Agency Specialist: <strong>{adminName}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Live Refresh Trigger */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingOrders}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3858F6] ${
                  isRefreshing || isLoadingOrders ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {/* Date Selector Filter Pill */}
            <button
              onClick={() => {
                const filters = ["Last 7 Days", "This Month", "Last 30 Days", "All Time"];
                const nextIdx = (filters.indexOf(dateFilter) + 1) % filters.length;
                setDateFilter(filters[nextIdx]);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 4 Dynamic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Hero Card in Royal Blue (Total Managed Ad Spend) */}
          <div className="bg-[#3858F6] text-white p-6 rounded-[28px] shadow-xl shadow-[#3858F6]/25 flex flex-col justify-between min-h-[175px] relative overflow-hidden card-lift hover:shadow-2xl hover:shadow-[#3858F6]/30 cursor-default">
            <div className="flex items-center justify-between z-10 pointer-events-none">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/10 shadow-sm pointer-events-none">
                <Megaphone className="w-5 h-5 stroke-[2.3]" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#10B981]/25 text-[#6EE7B7] border border-white/10 flex items-center gap-1 pointer-events-none">
                +18.4% Live
              </span>
            </div>

            <div className="z-10 mt-3 pointer-events-none select-none">
              <div className="text-xs text-white/80 font-medium">Portal Managed Ad Spend</div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                ${totalSpendUSD.toFixed(2)}
              </div>
              <div className="text-[11px] text-white/70 font-medium mt-1 truncate">
                {pageBoosts.length > 0
                  ? `≈ ৳${totalSpendBDT.toLocaleString()} BDT (${portalOrders.length} Portal Orders) • Page: $${pageBoostsSpendUSD.toFixed(2)}`
                  : `≈ ৳${totalSpendBDT.toLocaleString()} BDT (${portalOrders.length} Portal Orders)`}
              </div>
            </div>

            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Total Client Orders */}
          <Link
            href="/admin/orders"
            className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[175px] card-lift hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#F5F7FB] text-slate-700 flex items-center justify-center border border-slate-100 group-hover:bg-[#EEF2FF] group-hover:text-[#3858F6] transition-colors">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#10B981]">
                {portalOrders.length} Placed
              </span>
            </div>

            <div className="mt-3 select-none">
              <div className="text-xs text-[#8A94A6] font-medium flex items-center justify-between">
                <span>Total Client Orders</span>
                <span className="text-[#3858F6] text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                  View All →
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight mt-0.5">
                {portalOrders.length} Orders
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1 truncate">
                {portalOrders.length > 0 || pageBoosts.length > 0
                  ? `${activeOrders.length} Running Live • ${pendingOrders.length} In Queue${pageBoosts.length > 0 ? ` • (${pageBoosts.length} FB Page Boosts)` : ""}`
                  : "0 Active Campaigns • No Orders Placed"}
              </div>
            </div>
          </Link>

          {/* Card 3: Pending Approvals Queue */}
          <Link
            href="/admin/pending"
            className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[175px] card-lift hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center border border-amber-100 group-hover:bg-[#FEF3C7] transition-colors">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  pendingOrders.length > 0
                    ? "bg-[#FEF3C7] text-[#D97706]"
                    : "bg-[#EAF8F1] text-[#10B981]"
                }`}
              >
                {pendingOrders.length > 0 ? "Action Required" : "All Clear"}
              </span>
            </div>

            <div className="mt-3 select-none">
              <div className="text-xs text-[#8A94A6] font-medium flex items-center justify-between">
                <span>Pending Approvals Queue</span>
                <span className="text-[#D97706] text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                  Open Queue →
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight mt-0.5">
                {pendingOrders.length} Orders
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1 truncate">
                {pendingOrders.length > 0
                  ? "Click to review and launch on Meta"
                  : "All client campaigns launched"}
              </div>
            </div>
          </Link>

          {/* Card 4: Verified Meta Reach (Dynamic Calculation & Quick Sync) */}
          <Link
            href="/admin/meta-integration"
            className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[175px] card-lift hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#F5F7FB] text-slate-700 flex items-center justify-center border border-slate-100 group-hover:bg-[#EEF2FF] group-hover:text-[#3858F6] transition-colors">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#10B981] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  +{reachGrowthPercent}% Reach
                </span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await syncMetaMetrics();
                      showNotification("Synced live performance metrics from Meta!");
                    } catch {
                      showNotification("Failed to sync Meta metrics.");
                    }
                  }}
                  disabled={isSyncing}
                  title="Sync live reach & metrics from Meta"
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-[#3858F6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#3858F6]" : ""}`} />
                </button>
              </div>
            </div>

            <div className="mt-3 select-none">
              <div className="text-xs text-[#8A94A6] font-medium flex items-center justify-between">
                <span>Verified Meta Reach</span>
                <span className="text-[#3858F6] text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                  Meta Hub →
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalAudienceReach >= 1000
                  ? `${(totalAudienceReach / 1000).toFixed(1)}K`
                  : totalAudienceReach.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1 truncate">
                {totalConversations > 0 ? `${totalConversations}+ Inquiries` : "0 Inquiries"} • {totalImpressions > 0 ? `${(totalImpressions / 1000).toFixed(1)}K Views` : "Across client ads"}
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Operations Shortcuts Navigation Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/pending"
            className="p-5 rounded-[24px] bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-amber-200/80 hover:border-amber-300 shadow-xs flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#121826]">
                  Pending Approvals ({pendingOrders.length})
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Verify bKash & Nagad TRX proofs
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/admin/orders"
            className="p-5 rounded-[24px] bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 hover:border-indigo-300 shadow-xs flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#3858F6] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#121826]">
                  All Client Orders ({portalOrders.length})
                </h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Master campaign table & status control
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-700 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/admin/rates"
            className="p-5 rounded-[24px] bg-gradient-to-r from-[#F8FAFC] to-[#EEF2F6] border border-slate-200/80 hover:border-slate-300 shadow-xs flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#121826]">
                  Exchange Rate & Fees
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  USD rate (৳{exchangeRateBDT}) & cashout fees
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Priority Pending Approval Preview (If any exist) */}
        {pendingOrders.length > 0 && (
          <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center border border-amber-200">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#121826] text-base">
                    Orders Awaiting Specialist Verification ({pendingOrders.length})
                  </h3>
                  <p className="text-xs text-[#8A94A6]">
                    Immediate verification required before Meta ad delivery begins.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/pending"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-amber-200 rounded-full text-xs font-bold transition-colors"
              >
                <span>Open Dedicated Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {pendingOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={(e) => handleCopy(order.id, e)}
                          className="text-xs font-mono font-bold text-[#3858F6] bg-[#EEF2FF] px-2 py-0.5 rounded-md hover:underline inline-flex items-center gap-1"
                        >
                          <span>#{order.id}</span>
                          {copiedId === order.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                        {getOrderCategory(order.postType) === "Boost" && (
                          <span className="text-[10px] font-black text-[#2563EB] bg-[#EEF2FF] border border-[#BFDBFE] px-2 py-0.5 rounded-full">
                            🚀 Boost
                          </span>
                        )}
                        {getOrderCategory(order.postType) === "Ads" && (
                          <span className="text-[10px] font-black text-[#7C3AED] bg-[#FAF5FF] border border-[#E9D5FF] px-2 py-0.5 rounded-full">
                            📢 Ads
                          </span>
                        )}
                        {getOrderCategory(order.postType) === "Promote" && (
                          <span className="text-[10px] font-black text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                            ⭐ Promote
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {order.paymentStatus}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#121826] mt-2 truncate">
                      {order.campaignName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Client: <strong>{profile.businessName}</strong>
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-bold text-slate-800">{order.paymentMethod || "bKash"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Trx ID:</span>
                        <button
                          onClick={(e) => order.transactionId && handleCopy(order.transactionId, e)}
                          className="font-mono font-bold text-[#3858F6] hover:underline inline-flex items-center gap-1"
                        >
                          <span>{order.transactionId || "Pending"}</span>
                          {copiedId === order.transactionId && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount:</span>
                        <span className="font-bold text-[#10B981]">
                          ${order.totalBudgetUSD.toFixed(2)} (৳{order.paidAmountBDT || Math.round(order.totalBudgetUSD * exchangeRateBDT)} BDT)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrderForModal(order)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleApproveOrder(order.id)}
                      className="flex-1 py-2 px-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Launch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Client Campaigns Table with Search, Filter & Live Controls */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden space-y-4">
          <div className="p-6 sm:p-7 border-b border-[#E9EDF4] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-[#121826] text-base sm:text-lg">
                  Master Client Campaign Operations
                </h3>
                {/* Segmented dataset switcher */}
                <div className="flex items-center gap-1.5 bg-[#F6F8FC] p-1 rounded-xl border border-slate-200 ml-2">
                  <button
                    onClick={() => { setSourceTab("portal"); setStatusFilter("All"); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      sourceTab === "portal"
                        ? "bg-[#3858F6] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Portal Orders ({portalOrders.length})
                  </button>
                  <button
                    onClick={() => { setSourceTab("facebook_page"); setStatusFilter("All"); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      sourceTab === "facebook_page"
                        ? "bg-[#3858F6] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    FB Page Boosts ({pageBoosts.length})
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#8A94A6] mt-1">
                {sourceTab === "portal"
                  ? "Real-time control panel for orders placed directly via this web application."
                  : "Boost campaigns synced directly from Meta Ads Manager for the client's Facebook page."}
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3858F6] rounded-xl text-xs font-bold transition-colors self-start lg:self-auto"
            >
              <span>Dedicated Table View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Filter, Search & Status Bar */}
          <div className="px-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaign, Order ID, TRX ID, client..."
                  className="w-full bg-[#F6F8FC] focus:bg-white text-xs font-medium text-[#121826] pl-10 pr-9 py-2.5 rounded-xl border border-transparent focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter & Sort */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#F6F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF4]">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#121826] focus:outline-none cursor-pointer pr-1"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#F6F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF4]">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-[#121826] focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="budget-high">Budget: High to Low</option>
                    <option value="budget-low">Budget: Low to High</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-[#3858F6] hover:text-[#2542D9] px-2.5 py-1.5 hover:bg-[#EEF2FF] rounded-xl transition-all"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3 no-scrollbar">
              {statuses.map((s) => {
                const count = (statusCounts as any)[s] || 0;
                const isActive = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/20"
                        : "bg-[#F6F8FC] text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    <span>{s}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFD] text-[#8A94A6] uppercase tracking-wider font-bold border-y border-[#E9EDF4]">
                <tr>
                  <th className="py-3.5 px-6">Campaign & Order ID</th>
                  <th className="py-3.5 px-4">Client / Page</th>
                  <th className="py-3.5 px-4">Daily Budget</th>
                  <th className="py-3.5 px-4">Total USD</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Quick Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3F8] font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">
                          {sourceTab === "portal"
                            ? "No Portal Orders Found (0 In-App Orders)"
                            : "No campaigns match the selected filters"}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {sourceTab === "portal"
                            ? "No clients have placed an in-app boost order yet. When a client orders, it will appear here."
                            : "No results found in connected Facebook Page boosts."}
                        </p>
                        {sourceTab === "portal" && pageBoosts.length > 0 && (
                          <button
                            onClick={() => { setSourceTab("facebook_page"); setStatusFilter("All"); }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#3858F6] hover:underline pt-1 cursor-pointer"
                          >
                            <span>View Connected FB Page Boosts ({pageBoosts.length}) →</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F9FAFC] transition-colors">
                      {/* Campaign Title & ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs">
                            <Image
                              src={order.thumbnail || "/images/winter-collection.jpg"}
                              alt={order.campaignName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#121826] text-sm truncate max-w-xs">
                              {order.campaignName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <button
                                onClick={(e) => handleCopy(order.id, e)}
                                className="font-mono font-bold text-[#3858F6] hover:underline inline-flex items-center gap-1"
                              >
                                <span>#{order.id}</span>
                                {copiedId === order.id && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                              </button>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-[#8A94A6]">{order.postType}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#121826]">{profile.businessName}</div>
                        <div className="text-[11px] text-[#8A94A6]">{profile.connectedPage.name}</div>
                      </td>

                      {/* Daily Budget */}
                      <td className="py-4 px-4 font-bold text-[#121826]">
                        ${order.dailyBudgetUSD.toFixed(2)}/day
                      </td>

                      {/* Total USD */}
                      <td className="py-4 px-4 font-black text-[#3858F6]">
                        ${order.totalBudgetUSD.toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-4">
                        <StatusBadge status={order.paymentStatus} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Quick Action Controls */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForModal(order)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#E2E8F0] text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>

                          {order.status === "Pending" && (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Approve and activate campaign"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {order.status === "Active" && (
                            <button
                              onClick={() => handlePauseOrder(order.id)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Pause campaign delivery"
                            >
                              <Pause className="w-3 h-3" />
                              <span>Pause</span>
                            </button>
                          )}

                          {order.status === "Paused" && (
                            <button
                              onClick={() => handleResumeOrder(order.id)}
                              className="px-2.5 py-1.5 bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Resume campaign"
                            >
                              <Play className="w-3 h-3" />
                              <span>Resume</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
