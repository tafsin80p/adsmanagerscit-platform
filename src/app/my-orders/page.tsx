"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  PlusCircle,
  ExternalLink,
  Repeat,
  MoreVertical,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Eye,
  RefreshCw,
  ShoppingBag,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Filter,
  X,
  Layers,
  TrendingUp,
  MessageSquare,
  Info,
  Flame,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderStatus, Order } from "@/types";

function MyOrdersContent() {
  const searchParams = useSearchParams();
  const {
    orders,
    isLoadingOrders,
    refreshOrders,
    exchangeRateBDT,
    setSelectedOrderForModal,
    setSelectedOrderForRenew,
    setIsRenewModalOpen,
    profile,
  } = usePortal();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Sync search and status filter from URL search params
  useEffect(() => {
    const q = searchParams?.get("search");
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
    const s = searchParams?.get("status");
    if (s && ["All", "Active", "Pending", "Confirmed", "Paused", "Completed", "Rejected"].includes(s)) {
      setStatusFilter(s);
    }
  }, [searchParams]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "budget-high" | "budget-low" | "name">("newest");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status List
  const statuses = ["All", "Active", "Pending", "Confirmed", "Paused", "Completed", "Rejected"];

  // Category List
  const categories = ["All", "Boost Post", "Ads Campaign", "Promotion"];

  // Client Isolation: Scope orders to this logged in client account
  const clientOrders = useMemo(() => {
    if (!profile?.email) return [];
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

  // Genuine Portal Orders (orders placed through this portal / agency web app)
  const portalOrders = useMemo(() => {
    return clientOrders.filter((o: Order) => !o.isExternalBoost && o.source !== "facebook_page_boost");
  }, [clientOrders]);

  // External direct page boosts (for cross-link to All Boost)
  const pageBoosts = useMemo(() => {
    return clientOrders.filter((o: Order) => o.isExternalBoost || o.source === "facebook_page_boost");
  }, [clientOrders]);

  // Active dataset for My Orders is strictly genuine portal orders!
  const activeDataset: Order[] = portalOrders;

  // Real-time KPI Counts from active dataset
  const totalOrdersCount = activeDataset.length;
  const activeOrdersCount = useMemo(() => activeDataset.filter((o) => o.status === "Active").length, [activeDataset]);
  const pendingOrdersCount = useMemo(() => activeDataset.filter((o) => o.status === "Pending").length, [activeDataset]);
  const completedOrdersCount = useMemo(() => activeDataset.filter((o) => o.status === "Completed").length, [activeDataset]);

  // Total Spent calculations
  const totalSpentUSD = useMemo(() => {
    return activeDataset
      .filter((o) => o.status === "Active" || o.status === "Completed" || o.status === "Paused")
      .reduce((sum, o) => sum + (o.metrics?.spendUSD !== undefined && o.metrics.spendUSD > 0 ? o.metrics.spendUSD : (o.totalBudgetUSD || 0)), 0);
  }, [activeDataset]);

  const totalSpentBDT = Math.round(totalSpentUSD * (exchangeRateBDT || 150));

  // Count by status mapping for dynamic tab badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: activeDataset.length };
    statuses.forEach((s) => {
      if (s !== "All") {
        counts[s] = activeDataset.filter((o) => o.status === s).length;
      }
    });
    return counts;
  }, [activeDataset, statuses]);

  // Handle Refresh Click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Copy Order ID
  const handleCopyOrderId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = activeDataset.filter((order) => {
      const matchesSearch =
        !query ||
        order.campaignName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.transactionId && order.transactionId.toLowerCase().includes(query)) ||
        (order.postType && order.postType.toLowerCase().includes(query)) ||
        (order.paymentMethod && order.paymentMethod.toLowerCase().includes(query));

      const matchesStatus = statusFilter === "All" || order.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        order.postType?.toLowerCase().includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "budget-high") {
        return (b.totalBudgetUSD || 0) - (a.totalBudgetUSD || 0);
      }
      if (sortBy === "budget-low") {
        return (a.totalBudgetUSD || 0) - (b.totalBudgetUSD || 0);
      }
      if (sortBy === "name") {
        return a.campaignName.localeCompare(b.campaignName);
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
  }, [activeDataset, searchQuery, statusFilter, categoryFilter, sortBy]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All" || categoryFilter !== "All";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setSortBy("newest");
  };

  return (
    <DashboardLayout pageTitle="My Orders">
      <div className="space-y-6 sm:space-y-7">
        {/* Page Top Header with Live Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight">
                My Orders & Campaigns
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Real-time monitoring, live payment verification, and performance tracking of all your Meta advertising orders.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Live Refresh Trigger */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingOrders}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh orders from database"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3858F6] ${
                  isRefreshing || isLoadingOrders ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Create New Order Button */}
            <Link
              href="/create-order"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-md shadow-[#3858F6]/25 transition-all hover:scale-102 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.4]" />
              <span>Create New Boost</span>
            </Link>
          </div>
        </div>

        {/* Connected Page Direct Boosts Notice */}
        {pageBoosts.length > 0 && (
          <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#121826]">
                  Looking for your previous Facebook Page Boosts?
                </div>
                <div className="text-[11px] text-[#8A94A6] mt-0.5">
                  Your connected page <b>{profile.connectedPage?.name || "MIN Mart BD"}</b> has {pageBoosts.length} campaigns tracked directly in <b>All Boost</b>.
                </div>
              </div>
            </div>
            <Link
              href="/all-boosts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#3858F6] shadow-2xs transition-all shrink-0 hover:border-[#3858F6]"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>View All {pageBoosts.length} Boosts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 4 Dynamic KPI Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Orders */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#3858F6]">
                {totalOrdersCount} Total
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs text-[#8A94A6] font-medium">Total Orders Placed</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalOrdersCount} Campaigns
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-0.5 truncate">
                {activeOrdersCount} Running • {pendingOrdersCount} Awaiting
              </div>
            </div>
          </div>

          {/* Card 2: Active Running Campaigns */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF8F1] text-[#10B981] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                Delivering
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs text-[#8A94A6] font-medium">Active Meta Ads</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {activeOrdersCount} Active
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-0.5 truncate">
                Audience actively receiving impressions
              </div>
            </div>
          </div>

          {/* Card 3: Pending Verification */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#D97706] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF7ED] text-[#D97706]">
                {pendingOrdersCount} Pending
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs text-[#8A94A6] font-medium">Pending Review</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {pendingOrdersCount} Orders
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-0.5 truncate">
                Specialist checking payment TRX & creatives
              </div>
            </div>
          </div>

          {/* Card 4: Total Ad Spend */}
          <div className="bg-[#3858F6] text-white p-5 rounded-[24px] shadow-lg shadow-[#3858F6]/25 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div className="flex items-center justify-between z-10 pointer-events-none">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold border border-white/10">
                <DollarSign className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#10B981]/30 text-[#6EE7B7] border border-white/10">
                ৳{exchangeRateBDT}/$
              </span>
            </div>
            <div className="z-10 mt-2.5 select-none">
              <div className="text-xs text-white/80 font-medium">Total Spend (USD)</div>
              <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                ${totalSpentUSD.toFixed(2)}
              </div>
              <div className="text-[11px] text-white/70 font-medium mt-0.5 truncate">
                ≈ ৳{totalSpentBDT.toLocaleString()} BDT Total Budget
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Filter, Search & Status Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          {/* Top row: Search input + Category Filter + Sort Dropdown */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID (#BOOST-1001), campaign name, TRX..."
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

            {/* Controls on the Right: Type Filter + Sort Selector */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF4]">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#121826] focus:outline-none cursor-pointer pr-1"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === "All" ? "All Formats" : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF4]">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-[#121826] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="newest">Newest Placed</option>
                  <option value="oldest">Oldest Placed</option>
                  <option value="budget-high">Budget: High to Low</option>
                  <option value="budget-low">Budget: Low to High</option>
                  <option value="name">Campaign Name (A-Z)</option>
                </select>
              </div>

              {/* Reset Button */}
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

          {/* Status Tabs with Dynamic Live Count Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3 no-scrollbar">
            {statuses.map((s) => {
              const count = statusCounts[s] || 0;
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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

        {/* Dynamic Orders List / Table */}
        {isLoadingOrders && orders.length === 0 ? (
          /* Loading Skeleton */
          <div className="bg-white rounded-[24px] border border-[#E9EDF4] p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-36 h-3.5 bg-slate-200 rounded" />
                    <div className="w-24 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-slate-200 rounded" />
                <div className="w-16 h-6 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          portalOrders.length === 0 && !hasActiveFilters ? (
            /* Dedicated Empty State for Portal Orders */
            <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-10 sm:p-14 text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
              <div className="w-16 h-16 rounded-3xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center mx-auto shadow-sm">
                <ShoppingBag className="w-8 h-8 stroke-[2]" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-[#121826] tracking-tight">
                  No In-App Orders Yet (0 Orders)
                </h3>
                <p className="text-xs sm:text-sm text-[#8A94A6] leading-relaxed">
                  You have not placed any new boost orders through this portal yet. You can view your Facebook page boosts on the <b>All Boosts</b> page or launch a new campaign below.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/create-order"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-md shadow-[#3858F6]/25 transition-all hover:scale-102"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.4]" />
                  <span>+ Order New Boost</span>
                </Link>
                {pageBoosts.length > 0 && (
                  <Link
                    href="/all-boosts"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F6F8FC] hover:bg-[#EEF2F8] text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
                  >
                    <Flame className="w-4 h-4 text-[#3858F6]" />
                    <span>View Connected Page Boosts ({pageBoosts.length})</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Empty Search / Filter State */
            <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-12 text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
              <div className="w-14 h-14 rounded-2xl bg-[#F6F8FC] text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#121826]">
                  {activeDataset.length === 0 ? "No boost orders found" : "No orders match your filters"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {activeDataset.length === 0
                    ? "Launch your first Facebook or Instagram post boost with 0% service charge."
                    : "Try clearing search keywords or choosing a different status filter to view orders."}
                </p>
              </div>
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#3858F6] text-white text-xs font-bold rounded-xl hover:bg-[#2542D9] transition-all cursor-pointer"
                >
                  Reset all filters
                </button>
              ) : (
                <Link
                  href="/create-order"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3858F6] text-white text-xs font-bold rounded-xl hover:bg-[#2542D9] shadow-md shadow-[#3858F6]/25 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Your First Boost</span>
                </Link>
              )}
            </div>
          )
        ) : (
          /* Orders Table & Cards */
          <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E9EDF4] bg-[#F8FAFD] text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    <th className="py-4 px-6">Campaign & Order ID</th>
                    <th className="py-4 px-4">Date Placed</th>
                    <th className="py-4 px-4">Daily Budget</th>
                    <th className="py-4 px-4">Total USD</th>
                    <th className="py-4 px-4">Payment</th>
                    <th className="py-4 px-4">Ad Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F3F8] text-xs">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F9FAFC] transition-colors group cursor-default"
                    >
                      {/* Campaign & Thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-xs">
                            <Image
                              src={order.thumbnail || "/images/winter-collection.jpg"}
                              alt={order.campaignName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#121826] group-hover:text-[#3858F6] transition-colors truncate max-w-xs">
                              {order.campaignName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {/* Source Badge */}
                              {order.isExternalBoost || order.source === "facebook_page_boost" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                  <Zap className="w-2.5 h-2.5" />
                                  FB Page Direct
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                                  <ShoppingBag className="w-2.5 h-2.5" />
                                  Portal Order
                                </span>
                              )}

                              {/* Copyable Order ID Pill */}
                              <button
                                onClick={(e) => handleCopyOrderId(order.id, e)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#3858F6] hover:bg-[#EEF2FF] px-1.5 py-0.5 rounded transition-colors"
                                title="Click to copy Order ID"
                              >
                                <span>#{order.id}</span>
                                {copiedId === order.id ? (
                                  <Check className="w-3 h-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-[#3858F6]" />
                                )}
                              </button>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-[#8A94A6] font-medium">
                                {order.postType}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                {order.objective}
                              </span>
                            </div>
                            {order.metrics && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 flex-wrap">
                                <span className="bg-[#EBF2FF] text-[#0866FF] px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-[#0866FF]" />
                                  {order.metrics.reach.toLocaleString()} Reach
                                </span>
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                  {order.metrics.impressions.toLocaleString()} Views
                                </span>
                                {order.metrics.conversations > 0 && (
                                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                                    {order.metrics.conversations} Msgs
                                  </span>
                                )}
                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">
                                  ${order.metrics.spendUSD.toFixed(1)} Spent
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-[#8A94A6] font-medium">
                        {order.createdAt}
                      </td>

                      {/* Daily Budget */}
                      <td className="py-4 px-4 font-bold text-[#121826]">
                        ${order.dailyBudgetUSD.toFixed(2)}/day
                      </td>

                      {/* Total Budget */}
                      <td className="py-4 px-4 font-black text-[#3858F6]">
                        <div>${order.totalBudgetUSD.toFixed(2)}</div>
                        {order.paidAmountBDT ? (
                          <div className="text-[10px] text-[#8A94A6] font-medium">
                            ৳{order.paidAmountBDT.toLocaleString()}
                          </div>
                        ) : null}
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <StatusBadge status={order.paymentStatus} size="sm" />
                          <div className="text-[10px] text-[#8A94A6] font-medium">
                            {order.isExternalBoost || order.source === "facebook_page_boost"
                              ? "Meta Ad Account"
                              : order.paymentMethod
                              ? `via ${order.paymentMethod}`
                              : "Portal Direct"}
                          </div>
                        </div>
                      </td>

                      {/* Ad Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() => setSelectedOrderForModal(order)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-700 font-bold rounded-xl shadow-2xs hover:border-[#3858F6]/40 transition-all cursor-pointer text-xs"
                          >
                            View
                          </button>

                          {order.isEligibleForRenew && (
                            <button
                              onClick={() => {
                                setSelectedOrderForRenew(order);
                                setIsRenewModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-[#3858F6] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-xl font-bold transition-colors cursor-pointer text-xs inline-flex items-center gap-1"
                              title="Renew this boost campaign"
                            >
                              <Repeat className="w-3 h-3" />
                              <span>Renew</span>
                            </button>
                          )}

                          {/* Dropdown Menu Toggle */}
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === order.id ? null : order.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === order.id && (
                            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-[#E9EDF4] py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                              <button
                                onClick={() => {
                                  setSelectedOrderForModal(order);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] hover:text-[#3858F6] flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  handleCopyOrderId(order.id, e);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] flex items-center gap-2"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Order ID</span>
                              </button>

                              {order.postUrl && (
                                <a
                                  href={order.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setActiveMenuId(null)}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F6F8FC] flex items-center justify-between"
                                >
                                  <span>Open on Meta</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              )}

                              {order.isEligibleForRenew && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForRenew(order);
                                    setIsRenewModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-[#3858F6] hover:bg-[#EEF2FF] flex items-center gap-2"
                                >
                                  <Repeat className="w-3.5 h-3.5" />
                                  <span>Renew Boost</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (For Small & Tablet Screens) */}
            <div className="lg:hidden divide-y divide-[#F0F3F8]">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-xs">
                        <Image
                          src={order.thumbnail || "/images/winter-collection.jpg"}
                          alt={order.campaignName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#121826] truncate">
                          {order.campaignName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {order.isExternalBoost || order.source === "facebook_page_boost" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                              <Zap className="w-2.5 h-2.5" />
                              FB Page Direct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                              <ShoppingBag className="w-2.5 h-2.5" />
                              Portal Order
                            </span>
                          )}
                          <button
                            onClick={(e) => handleCopyOrderId(order.id, e)}
                            className="font-mono text-[11px] font-bold text-[#3858F6] hover:underline"
                          >
                            #{order.id}
                          </button>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-[#8A94A6]">{order.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Live Results Pill (If active/completed metrics exist) */}
                  {order.metrics && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 flex-wrap bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="bg-[#EBF2FF] text-[#0866FF] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#0866FF]" />
                        {order.metrics.reach.toLocaleString()} Reach
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {order.metrics.impressions.toLocaleString()} Views
                      </span>
                      {order.metrics.conversations > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          {order.metrics.conversations} Msgs
                        </span>
                      )}
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">
                        ${order.metrics.spendUSD.toFixed(1)} Spent
                      </span>
                    </div>
                  )}

                  {/* Budget & Payment info box */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F6F8FC] p-3 rounded-2xl border border-[#E9EDF4]">
                    <div>
                      <span className="text-[#8A94A6] block text-[10px] font-medium">Daily Budget</span>
                      <span className="font-bold text-[#121826]">${order.dailyBudgetUSD.toFixed(2)}/day</span>
                    </div>
                    <div>
                      <span className="text-[#8A94A6] block text-[10px] font-medium">Total (USD)</span>
                      <span className="font-black text-[#3858F6]">${order.totalBudgetUSD.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={order.paymentStatus} size="sm" />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {order.isExternalBoost || order.source === "facebook_page_boost"
                          ? "Meta Ad Account"
                          : order.paymentMethod
                          ? `via ${order.paymentMethod}`
                          : "Portal Direct"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrderForModal(order)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-slate-800 rounded-xl shadow-xs"
                      >
                        View Details
                      </button>
                      {order.isEligibleForRenew && (
                        <button
                          onClick={() => {
                            setSelectedOrderForRenew(order);
                            setIsRenewModalOpen(true);
                          }}
                          className="p-2 text-[#3858F6] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-xl font-bold"
                          title="Renew Boost"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout pageTitle="My Orders">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-3 border-[#3858F6] border-t-transparent rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      }
    >
      <MyOrdersContent />
    </Suspense>
  );
}
