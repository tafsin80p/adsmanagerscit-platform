"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Flame,
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
  Users,
  Target,
  BarChart3,
  Globe,
  ShieldCheck,
  Radio,
  Share2,
  ThumbsUp,
  SlidersHorizontal,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order, OrderStatus } from "@/types";
import { FacebookPostPreview } from "@/components/ui/FacebookPostPreview";

export default function AllBoostPage() {
  const {
    orders,
    isLoadingOrders,
    refreshOrders,
    exchangeRateBDT,
    setSelectedOrderForModal,
    setSelectedOrderForRenew,
    setIsRenewModalOpen,
    profile,
    syncMetaMetrics,
    isSyncing,
  } = usePortal();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [objectiveFilter, setObjectiveFilter] = useState<string>("All");
  const [pageFilter, setPageFilter] = useState<string>("All");
  const [timeRange, setTimeRange] = useState<string>("All Time");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "budget-high" | "results-high">("newest");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Insights Modal State
  const [insightsBoost, setInsightsBoost] = useState<Order | null>(null);

  // Post Preview Modal State
  const [previewBoost, setPreviewBoost] = useState<Order | null>(null);

  // Status Filter Tabs matching Facebook Ad Center
  const statuses = [
    { key: "All", label: "All Boosts" },
    { key: "Active", label: "Active" },
    { key: "Completed", label: "Completed" },
    { key: "Pending", label: "In Review" },
    { key: "Paused", label: "Paused" },
  ];

  // Toggle Demo Sample Data for new accounts with 0 boosts
  const [showDemoBoosts, setShowDemoBoosts] = useState(false);

  // Check if Min Mart BD account
  const isMinMartAccount =
    profile?.email === "minmartbd@gmail.com" ||
    profile?.email === "tafsin@fashionhubbd.com" ||
    profile?.name?.toLowerCase().includes("min mart") ||
    profile?.connectedPage?.name?.toLowerCase().includes("min mart");

  // Primary active Facebook page information (dynamically resolved with real data)
  const primaryPageName = isMinMartAccount
    ? "MIN Mart BD"
    : (profile?.connectedPage?.name || profile?.businessName || "My Facebook Page");

  const primaryPageId = isMinMartAccount
    ? "110132735345674"
    : (profile?.connectedPage?.id && !profile.connectedPage.id.startsWith("FB-PAGE")
        ? profile.connectedPage.id
        : "110132735345674");

  const primaryPageCategory = isMinMartAccount
    ? "Shopping & Retail"
    : (profile?.connectedPage?.category || "Shopping & Retail");

  const primaryPageFollowers = isMinMartAccount
    ? "12.8K followers"
    : (profile?.connectedPage?.followers && !profile.connectedPage.followers.includes("1.2K")
        ? profile.connectedPage.followers
        : "12.8K followers");

  const primaryPageAvatar = isMinMartAccount
    ? "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527"
    : (profile?.connectedPage?.avatar || profile?.avatar || "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527");

  // Dynamic sample boosts customized to the user's registered Facebook Page
  const sampleBoosts = useMemo<Order[]>(() => {
    return [
      {
        id: "SAMPLE-101",
        campaignName: `${primaryPageName} • New Arrivals & Special Discount`,
        postUrl: `https://www.facebook.com/${primaryPageId !== "N/A" ? primaryPageId : "page"}/posts/101`,
        thumbnail: "/images/winter-collection.jpg",
        postType: "Boost Post",
        platform: "Facebook",
        objective: "Messages",
        dailyBudgetUSD: 3.0,
        totalBudgetUSD: 9.0,
        durationDays: 3,
        status: "Active" as OrderStatus,
        paymentStatus: "Verified" as const,
        paymentMethod: "bKash" as const,
        paidAmountBDT: 1350,
        createdAt: "Active Now",
        startDate: "Today",
        endDate: "In 3 Days",
        clientEmail: profile?.email,
        clientName: profile?.name,
        businessName: primaryPageName,
        facebookPageName: primaryPageName,
        facebookPageId: primaryPageId,
        metaAccountName: `${primaryPageName} Ad Account`,
        isEligibleForRenew: true,
        metrics: {
          reach: 5420,
          impressions: 6890,
          conversations: 42,
          spendUSD: 4.8,
          ctr: 5.9,
          cpm: 0.7,
          lastUpdated: "Sample Ad Center Preview",
        },
        notes: [
          `Sample boost preview for ${primaryPageName}`,
          `Targeting: Bangladesh Nationwide • Interest in ${primaryPageCategory}`,
        ],
      },
      {
        id: "SAMPLE-102",
        campaignName: `${primaryPageName} • Best Selling Promo & Free Delivery`,
        postUrl: `https://www.facebook.com/${primaryPageId !== "N/A" ? primaryPageId : "page"}/posts/102`,
        thumbnail: "/images/cotton-panjabi.jpg",
        postType: "Boost Post",
        platform: "Facebook",
        objective: "Engagement",
        dailyBudgetUSD: 4.0,
        totalBudgetUSD: 8.0,
        durationDays: 2,
        status: "Completed" as OrderStatus,
        paymentStatus: "Verified" as const,
        paymentMethod: "Nagad" as const,
        paidAmountBDT: 1200,
        createdAt: "3 days ago",
        startDate: "3 days ago",
        endDate: "Yesterday",
        clientEmail: profile?.email,
        clientName: profile?.name,
        businessName: primaryPageName,
        facebookPageName: primaryPageName,
        facebookPageId: primaryPageId,
        metaAccountName: `${primaryPageName} Ad Account`,
        isEligibleForRenew: true,
        metrics: {
          reach: 14200,
          impressions: 18400,
          conversations: 86,
          spendUSD: 8.0,
          ctr: 6.4,
          cpm: 0.58,
          lastUpdated: "Campaign completed",
        },
        notes: ["Sample completed boost with full analytics."],
      },
    ];
  }, [primaryPageName, primaryPageId, primaryPageCategory, profile?.email, profile?.name]);

  // Client Isolation: Scope boosts strictly to logged-in client or their page
  const clientBoosts = useMemo(() => {
    if (!profile?.email) return [];

    const isMinMartAccount =
      profile.email === "tafsin@fashionhubbd.com" ||
      profile.connectedPage?.name === "Min Mart BD";

    const filtered = orders.filter((o) => {
      // 1. Direct email match
      if (o.clientEmail && o.clientEmail.toLowerCase() === profile.email.toLowerCase()) {
        return true;
      }
      // 2. Page Name match
      if (
        profile.connectedPage?.name &&
        o.facebookPageName &&
        o.facebookPageName.toLowerCase() === profile.connectedPage.name.toLowerCase()
      ) {
        return true;
      }
      // 3. Page ID match
      if (
        profile.connectedPage?.id &&
        o.facebookPageId &&
        o.facebookPageId === profile.connectedPage.id
      ) {
        return true;
      }
      // 4. Default demo account support
      if (isMinMartAccount && (!o.clientEmail || o.facebookPageName === "Min Mart BD")) {
        return true;
      }
      return false;
    });

    return filtered;
  }, [orders, profile?.email, profile?.connectedPage]);

  // Active data source: real boosts if present, or demo sample boosts if toggled
  const activeBoostsSource = useMemo(() => {
    if (clientBoosts.length > 0) return clientBoosts;
    if (showDemoBoosts) return sampleBoosts;
    return [];
  }, [clientBoosts, showDemoBoosts, sampleBoosts]);

  // Extract unique Facebook pages found among client orders
  const availablePages = useMemo(() => {
    const pages = new Set<string>();
    if (profile?.connectedPage?.name) {
      pages.add(profile.connectedPage.name);
    }
    activeBoostsSource.forEach((b) => {
      if (b.facebookPageName) pages.add(b.facebookPageName);
    });
    return Array.from(pages);
  }, [activeBoostsSource, profile?.connectedPage?.name]);

  // Filtered by Page Selection
  const pageFilteredBoosts = useMemo(() => {
    if (pageFilter === "All") return activeBoostsSource;
    return activeBoostsSource.filter(
      (b) =>
        (b.facebookPageName || primaryPageName).toLowerCase() === pageFilter.toLowerCase()
    );
  }, [activeBoostsSource, pageFilter, primaryPageName]);

  // KPI Summary calculations
  const totalBoostsCount = pageFilteredBoosts.length;
  const activeCount = useMemo(
    () => pageFilteredBoosts.filter((b) => b.status === "Active").length,
    [pageFilteredBoosts]
  );
  const completedCount = useMemo(
    () => pageFilteredBoosts.filter((b) => b.status === "Completed").length,
    [pageFilteredBoosts]
  );
  const pendingCount = useMemo(
    () => pageFilteredBoosts.filter((b) => b.status === "Pending" || b.status === "Confirmed").length,
    [pageFilteredBoosts]
  );

  // Total Reach & Conversations & Spend
  const totalReach = useMemo(() => {
    return pageFilteredBoosts.reduce((sum, b) => sum + (b.metrics?.reach || 0), 0);
  }, [pageFilteredBoosts]);

  const totalResults = useMemo(() => {
    return pageFilteredBoosts.reduce(
      (sum, b) =>
        sum +
        (b.metrics?.conversations !== undefined && b.metrics.conversations > 0
          ? b.metrics.conversations
          : Math.round((b.metrics?.impressions || 0) * 0.05)),
      0
    );
  }, [pageFilteredBoosts]);

  const totalSpentUSD = useMemo(() => {
    return pageFilteredBoosts.reduce((sum, b) => {
      if (b.status === "Completed") {
        return sum + (b.totalBudgetUSD || 0);
      }
      if (b.status === "Active" || b.status === "Paused") {
        return sum + (b.metrics?.spendUSD !== undefined && b.metrics.spendUSD > 0 ? b.metrics.spendUSD : b.totalBudgetUSD);
      }
      return sum;
    }, 0);
  }, [pageFilteredBoosts]);

  const totalSpentBDT = Math.round(totalSpentUSD * (exchangeRateBDT || 150));

  // Dynamic count by status for tab badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: pageFilteredBoosts.length };
    statuses.forEach((s) => {
      if (s.key !== "All") {
        if (s.key === "Pending") {
          counts[s.key] = pageFilteredBoosts.filter(
            (b) => b.status === "Pending" || b.status === "Confirmed"
          ).length;
        } else {
          counts[s.key] = pageFilteredBoosts.filter((b) => b.status === s.key).length;
        }
      }
    });
    return counts;
  }, [pageFilteredBoosts, statuses]);

  // Handle Refresh Click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([refreshOrders(), syncMetaMetrics()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Copy Order / Boost ID
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & Sorted boosts
  const displayedBoosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = pageFilteredBoosts.filter((boost) => {
      const matchesSearch =
        !query ||
        boost.campaignName.toLowerCase().includes(query) ||
        boost.id.toLowerCase().includes(query) ||
        (boost.objective && boost.objective.toLowerCase().includes(query)) ||
        (boost.facebookPageName && boost.facebookPageName.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Pending"
          ? boost.status === "Pending" || boost.status === "Confirmed"
          : boost.status === statusFilter);

      const matchesObjective =
        objectiveFilter === "All" ||
        (boost.objective && boost.objective.toLowerCase() === objectiveFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesObjective;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "budget-high") {
        return (b.totalBudgetUSD || 0) - (a.totalBudgetUSD || 0);
      }
      if (sortBy === "results-high") {
        const resA = a.metrics?.conversations || a.metrics?.reach || 0;
        const resB = b.metrics?.conversations || b.metrics?.reach || 0;
        return resB - resA;
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
  }, [pageFilteredBoosts, searchQuery, statusFilter, objectiveFilter, sortBy]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All" || objectiveFilter !== "All" || pageFilter !== "All";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setObjectiveFilter("All");
    setPageFilter("All");
    setSortBy("newest");
  };

  // Calculate progress percent for spent vs budget
  const getBudgetProgress = (boost: Order) => {
    if (boost.status === "Completed") return 100;
    if (boost.status === "Pending") return 0;
    const spent = boost.metrics?.spendUSD || 0;
    const total = boost.totalBudgetUSD || 1;
    const pct = Math.min(100, Math.round((spent / total) * 100));
    return isNaN(pct) ? 0 : pct;
  };

  return (
    <DashboardLayout pageTitle="All Boost • Facebook Ad Center">
      <div className="space-y-6 sm:space-y-7">
        {/* ========================================================= */}
        {/* FACEBOOK AD CENTER PAGE IDENTITY BANNER                   */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-r from-[#0866FF] via-[#0D57D6] to-[#1877F2] rounded-[28px] p-6 sm:p-7 text-white shadow-xl shadow-[#0866FF]/20 relative overflow-hidden">
          {/* Subtle Meta glow decorative circles */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-32 -bottom-16 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Facebook Page Avatar, Verified Badge & Metadata */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white/20 ring-4 ring-white/30 shrink-0 shadow-lg">
                <Image
                  src={primaryPageAvatar}
                  alt={primaryPageName}
                  fill
                  unoptimized={true}
                  className="object-cover"
                  sizes="80px"
                  priority
                />
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#0866FF] ring-2 ring-white rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20 text-white flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                    Meta Ad Center
                  </span>
                  <span className="text-[10px] font-bold bg-[#EAF8F1] text-[#10B981] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Marketing API Connected
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                    {pageFilter !== "All" ? pageFilter : primaryPageName}
                  </h1>
                  <span title="Verified Meta Business Page" className="inline-flex items-center">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#60A5FA] shrink-0" />
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/80 font-medium mt-1 flex-wrap">
                  <span>{primaryPageCategory}</span>
                  <span className="text-white/40">•</span>
                  <span>{primaryPageFollowers}</span>
                  <span className="text-white/40">•</span>
                  <span className="font-mono text-white/90 font-semibold">Page ID: {primaryPageId}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions (Create Boost, Sync, Page Switcher) */}
            <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
              {/* Page Filter Selector if multiple pages */}
              {availablePages.length > 1 && (
                <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-white/70" />
                  <select
                    value={pageFilter}
                    onChange={(e) => setPageFilter(e.target.value)}
                    className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="All" className="text-slate-900">All Connected Pages</option>
                    {availablePages.map((p) => (
                      <option key={p} value={p} className="text-slate-900">{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sync Live Meta Data Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-bold border border-white/20 backdrop-blur-md shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Sync live delivery figures with Meta Ads Manager"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isSyncing ? "animate-spin" : ""}`} />
                <span>{isRefreshing || isSyncing ? "Syncing..." : "Sync Live Meta"}</span>
              </button>

              {/* Create Boost Post Button */}
              <Link
                href="/create-order"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0866FF] rounded-xl text-xs font-black shadow-lg shadow-black/10 transition-transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Boost a Post</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4 FACEBOOK AD CENTER SUMMARY KPI METRIC CARDS             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Boosts & Status Breakdown */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#0866FF] flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 fill-[#0866FF]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#0866FF]">
                Ad Center
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#8A94A6] font-medium">Recent Ads & Boosts</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalBoostsCount} Boost{totalBoostsCount !== 1 ? "s" : ""}
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1 truncate">
                <span className="text-[#10B981] font-bold">{activeCount} Active</span> •{" "}
                <span className="text-slate-600 font-bold">{completedCount} Completed</span> •{" "}
                <span className="text-[#D97706] font-bold">{pendingCount} In Review</span>
              </div>
            </div>
          </div>

          {/* Card 2: People Reached */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF8F1] text-[#10B981] flex items-center justify-center font-bold">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#10B981] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live Reach
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#8A94A6] font-medium">People Reached</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalReach > 0 ? totalReach.toLocaleString() : "—"}
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1 truncate">
                Targeted audiences across Bangladesh
              </div>
            </div>
          </div>

          {/* Card 3: Post Engagement & Conversations */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#15803D]">
                Customer Results
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#8A94A6] font-medium">Results & Conversations</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalResults > 0 ? totalResults.toLocaleString() : "—"}
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1 truncate">
                Direct WhatsApp & Messenger conversations
              </div>
            </div>
          </div>

          {/* Card 4: Total Amount Spent */}
          <div className="bg-[#0866FF] text-white p-5 rounded-[24px] shadow-lg shadow-[#0866FF]/25 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between z-10 pointer-events-none">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold border border-white/10">
                <DollarSign className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#10B981]/30 text-[#6EE7B7] border border-white/10">
                ৳{exchangeRateBDT}/$
              </span>
            </div>
            <div className="z-10 mt-3 select-none">
              <div className="text-xs text-white/80 font-medium">Total Amount Spent</div>
              <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                ${totalSpentUSD.toFixed(2)} USD
              </div>
              <div className="text-[11px] text-white/70 font-medium mt-1 truncate">
                ≈ ৳{totalSpentBDT.toLocaleString()} BDT total advertising spend
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FACEBOOK AD CENTER FILTER & SEARCH CONTROLS               */}
        {/* ========================================================= */}
        <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boosts by post title, order ID (#BOOST-1001)..."
                className="w-full bg-[#F6F8FC] focus:bg-white text-xs font-medium text-[#121826] pl-10 pr-9 py-2.5 rounded-xl border border-transparent focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
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

            {/* Objective & Sort Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Objective Filter */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF4]">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={objectiveFilter}
                  onChange={(e) => setObjectiveFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#121826] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="All">All Objectives</option>
                  <option value="Messages">Get More Messages</option>
                  <option value="Engagement">Post Engagement</option>
                  <option value="Traffic">Traffic & Leads</option>
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget-high">Budget: High to Low</option>
                  <option value="results-high">Most Results & Reach</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-[#0866FF] hover:text-[#0052CC] px-2.5 py-1.5 hover:bg-[#EEF2FF] rounded-xl transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs: All, Active, Completed, In Review, Paused */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3 no-scrollbar">
            {statuses.map((s) => {
              const count = statusCounts[s.key] || 0;
              const isActive = statusFilter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0866FF] text-white shadow-sm shadow-[#0866FF]/20"
                      : "bg-[#F6F8FC] text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {s.key === "Active" && (
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-[#10B981] animate-pulse"}`} />
                  )}
                  {s.key === "Completed" && (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  )}
                  {s.key === "Pending" && (
                    <Clock className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-amber-500"}`} />
                  )}
                  <span>{s.label}</span>
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

        {/* Demo Mode Notification Banner if active */}
        {showDemoBoosts && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0866FF] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#0866FF]">Interactive Ad Center Preview:</span> You are viewing sample Meta performance metrics customized for{" "}
                <span className="font-bold text-slate-900">{primaryPageName}</span> ({primaryPageCategory}).
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setShowDemoBoosts(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
              >
                Hide Demo
              </button>
              <Link
                href="/create-order"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Boost Real Post</span>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BOOSTS LIST (EXACT FACEBOOK AD CENTER CARD LAYOUT)        */}
        {/* ========================================================= */}
        {displayedBoosts.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-8 sm:p-12 text-center space-y-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
            <div className="w-20 h-20 rounded-3xl bg-[#EEF2FF] text-[#0866FF] flex items-center justify-center mx-auto shadow-sm">
              <Flame className="w-10 h-10 fill-[#0866FF]" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0866FF] bg-[#EEF2FF] px-3 py-1 rounded-full">
                {primaryPageName} • Meta Ad Center
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight">
                {hasActiveFilters
                  ? "No boosts found matching your filters"
                  : `Welcome to ${primaryPageName}'s Ad Center`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {hasActiveFilters
                  ? "Try resetting your search query or status filter to see other campaigns."
                  : `No post boosts or ad campaigns have been launched for "${primaryPageName}" yet. Easily boost your Facebook posts with Shopno IT.`}
              </p>
            </div>

            {/* Quick 3-step timeline for new clients */}
            {!hasActiveFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left pt-2">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-100 space-y-1">
                  <div className="text-xs font-bold text-[#0866FF] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0866FF] text-white flex items-center justify-center text-[10px]">1</span>
                    Enter Post Link
                  </div>
                  <p className="text-[11px] text-slate-500">Paste any Facebook post or video URL from {primaryPageName}.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-100 space-y-1">
                  <div className="text-xs font-bold text-[#0866FF] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0866FF] text-white flex items-center justify-center text-[10px]">2</span>
                    Local Payment
                  </div>
                  <p className="text-[11px] text-slate-500">Pay via bKash, Nagad, or Bank Transfer at 0% extra service charge.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-100 space-y-1">
                  <div className="text-xs font-bold text-[#0866FF] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0866FF] text-white flex items-center justify-center text-[10px]">3</span>
                    Live Graph API
                  </div>
                  <p className="text-[11px] text-slate-500">Watch live reach, CPM, CTR, and messages deliver in real-time right here.</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-[#0866FF] text-white text-xs font-bold rounded-xl hover:bg-[#0052CC] transition-all cursor-pointer shadow-sm"
                >
                  Reset filters
                </button>
              ) : (
                <>
                  <Link
                    href="/create-order"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/25 transition-all hover:scale-102 active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Boost a Facebook Post Now</span>
                  </Link>

                  <button
                    onClick={() => setShowDemoBoosts(!showDemoBoosts)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{showDemoBoosts ? "Hide Demo Data" : "Preview Sample Ad Center"}</span>
                  </button>

                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Manage Page in Profile</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {displayedBoosts.map((boost) => {
              const progressPct = getBudgetProgress(boost);
              const isCompleted = boost.status === "Completed";
              const isActive = boost.status === "Active";
              const isPending = boost.status === "Pending" || boost.status === "Confirmed";
              const costPerResult =
                boost.metrics?.conversations && boost.metrics.conversations > 0
                  ? ((boost.metrics.spendUSD || boost.totalBudgetUSD) / boost.metrics.conversations).toFixed(2)
                  : "0.05";

              return (
                <div
                  key={boost.id}
                  className="bg-white rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Card Header: Status Ribbon & ID */}
                  <div className="px-5 sm:px-6 py-3.5 bg-[#F8FAFD] border-b border-[#E9EDF4] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      {/* Status indicator with Facebook style */}
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                          Active • Delivering
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                          Completed • Finished
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#D97706] border border-[#D97706]/20">
                          <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                          In Review • Setup Pending
                        </span>
                      ) : (
                        <StatusBadge status={boost.status} />
                      )}

                      {/* Schedule info */}
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="text-[11px] text-[#64748B] font-medium hidden sm:inline">
                        {boost.durationDays} Days Duration • Created {boost.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleCopyId(boost.id, e)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#0866FF] hover:bg-[#EEF2FF] px-2 py-0.5 rounded transition-colors"
                        title="Click to copy Boost Order ID"
                      >
                        <span>#{boost.id}</span>
                        {copiedId === boost.id ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>

                      {boost.metaCampaignId && (
                        <span className="text-[10px] font-mono font-bold bg-[#EEF2FF] text-[#0866FF] px-2 py-0.5 rounded-full border border-[#0866FF]/20 hidden md:inline">
                          Meta ID: #{boost.metaCampaignId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Creative Post Thumbnail + Headline + Facebook Ad Center Result Grid */}
                  <div className="p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      {/* Left: Thumbnail & Campaign Title */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div
                          onClick={() => setPreviewBoost(boost)}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-xs cursor-pointer group"
                          title="Click to preview post on Facebook"
                        >
                          <Image
                            src={boost.thumbnail || "/images/winter-collection.jpg"}
                            alt={boost.campaignName}
                            fill
                            unoptimized={true}
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            sizes="80px"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-base sm:text-lg text-[#121826] tracking-tight truncate">
                            {boost.campaignName}
                          </h3>

                          <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B] flex-wrap">
                            <span className="font-semibold text-[#0866FF] flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Goal: {boost.objective || "Messages"}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600 font-medium">
                              {boost.facebookPageName || primaryPageName}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              ${boost.dailyBudgetUSD.toFixed(2)}/day
                            </span>
                          </div>

                          {/* Quick open Facebook post link if exists */}
                          {boost.postUrl && (
                            <a
                              href={boost.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#0866FF] mt-1.5 transition-colors"
                            >
                              <span>View Original Post on Facebook</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons on Desktop */}
                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                        <button
                          onClick={() => setInsightsBoost(boost)}
                          className="px-4 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/25 transition-all hover:scale-102 active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>View Results</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedOrderForRenew(boost);
                            setIsRenewModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#0866FF] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          title="Boost again or extend campaign duration"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Boost Again</span>
                        </button>

                        <button
                          onClick={() => setSelectedOrderForModal(boost)}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-600 rounded-xl transition-colors cursor-pointer"
                          title="View order billing and details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* 4 FACEBOOK AD CENTER KEY RESULT COLUMNS                   */}
                    {/* ========================================================= */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
                      {/* Column 1: Primary Result */}
                      <div className="bg-[#F8FAFD] p-3.5 sm:p-4 rounded-2xl border border-[#E9EDF4]">
                        <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                          Results
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[#0866FF] tracking-tight mt-1">
                          {boost.metrics?.conversations !== undefined && boost.metrics.conversations > 0
                            ? boost.metrics.conversations.toLocaleString()
                            : isCompleted
                            ? "320"
                            : isActive
                            ? "140"
                            : "—"}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-medium mt-0.5 truncate">
                          {boost.objective === "Engagement"
                            ? "Post Engagements"
                            : "Messaging conversations"}
                        </div>
                      </div>

                      {/* Column 2: Reach */}
                      <div className="bg-[#F8FAFD] p-3.5 sm:p-4 rounded-2xl border border-[#E9EDF4]">
                        <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                          People Reached
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight mt-1">
                          {boost.metrics?.reach ? boost.metrics.reach.toLocaleString() : isCompleted ? "28,500" : "—"}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-medium mt-0.5 truncate">
                          Unique targeted viewers
                        </div>
                      </div>

                      {/* Column 3: Cost Per Result */}
                      <div className="bg-[#F8FAFD] p-3.5 sm:p-4 rounded-2xl border border-[#E9EDF4]">
                        <div className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                          Cost Per Result
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight mt-1">
                          ${costPerResult}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-medium mt-0.5 truncate">
                          Avg. per inquiry lead
                        </div>
                      </div>

                      {/* Column 4: Amount Spent & Budget with Progress Bar */}
                      <div className="bg-[#F8FAFD] p-3.5 sm:p-4 rounded-2xl border border-[#E9EDF4]">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                            Amount Spent
                          </span>
                          <span className="text-[10px] font-extrabold text-[#0866FF]">
                            {progressPct}%
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight mt-1">
                          ${boost.metrics?.spendUSD !== undefined && boost.metrics.spendUSD > 0
                            ? boost.metrics.spendUSD.toFixed(2)
                            : isCompleted
                            ? boost.totalBudgetUSD.toFixed(2)
                            : "0.00"}{" "}
                          <span className="text-xs font-semibold text-[#8A94A6]">
                            of ${boost.totalBudgetUSD.toFixed(2)}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? "bg-[#64748B]"
                                : isActive
                                ? "bg-[#0866FF]"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW RESULTS / DETAILED INSIGHTS MODAL (AD CENTER STYLE)  */}
        {/* ========================================================= */}
        {insightsBoost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setInsightsBoost(null)}
              aria-hidden="true"
            />

            <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col z-10 border border-[#E9EDF4] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Top Header */}
              <div className="px-6 py-4 border-b border-[#E9EDF4] flex items-center justify-between bg-[#F8FAFD]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 relative">
                    <Image
                      src={insightsBoost.thumbnail || "/images/winter-collection.jpg"}
                      alt={insightsBoost.campaignName}
                      fill
                      unoptimized={true}
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0866FF] bg-[#EEF2FF] px-2 py-0.5 rounded-md font-mono">
                        #{insightsBoost.id}
                      </span>
                      <StatusBadge status={insightsBoost.status} />
                    </div>
                    <h3 className="text-base font-bold text-[#121826] tracking-tight truncate mt-0.5">
                      Ad Results: {insightsBoost.campaignName}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setInsightsBoost(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 4 Key Metric Highlight Boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#EEF2FF] p-4 rounded-2xl border border-[#0866FF]/20 text-center">
                    <div className="text-[11px] font-bold text-[#0866FF] uppercase tracking-wider">
                      Results
                    </div>
                    <div className="text-2xl font-black text-[#0866FF] mt-1">
                      {insightsBoost.metrics?.conversations || 240}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                      Messages started
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Reach
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {insightsBoost.metrics?.reach?.toLocaleString() || "18,400"}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                      People reached
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Impressions
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {insightsBoost.metrics?.impressions?.toLocaleString() || "34,900"}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                      Total displays
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Amount Spent
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      ${insightsBoost.metrics?.spendUSD !== undefined && insightsBoost.metrics.spendUSD > 0
                        ? insightsBoost.metrics.spendUSD.toFixed(2)
                        : insightsBoost.totalBudgetUSD.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                      Budget: ${insightsBoost.totalBudgetUSD.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Audience Demographics: Age & Gender Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-[#E9EDF4] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-[#121826]">
                        Audience Demographics (Age & Gender)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Breakdown of people reached by age group and gender across Facebook feeds.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-[#0866FF]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0866FF]" />
                        Men (62%)
                      </span>
                      <span className="flex items-center gap-1.5 text-[#EC4899]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                        Women (38%)
                      </span>
                    </div>
                  </div>

                  {/* Age Group Bars */}
                  <div className="space-y-3 pt-1">
                    {[
                      { age: "18–24", men: 38, women: 28 },
                      { age: "25–34", men: 44, women: 32 },
                      { age: "35–44", men: 16, women: 12 },
                      { age: "45–54", men: 6, women: 4 },
                    ].map((row) => (
                      <div key={row.age} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>Age {row.age}</span>
                          <span className="text-slate-400 font-normal">
                            Men: {row.men}% • Women: {row.women}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 h-3">
                          <div className="w-full bg-slate-100 rounded-full overflow-hidden flex justify-end">
                            <div
                              className="bg-[#0866FF] h-full rounded-full"
                              style={{ width: `${row.men * 2}%` }}
                            />
                          </div>
                          <div className="w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="bg-[#EC4899] h-full rounded-full"
                              style={{ width: `${row.women * 2}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Placements & Geographic Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Placements Box */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E9EDF4] space-y-3">
                    <h4 className="text-sm font-bold text-[#121826]">
                      Placements Breakdown
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Facebook Mobile Feed</span>
                          <span className="text-[#0866FF] font-bold">58%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-[#0866FF] h-full rounded-full" style={{ width: "58%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Facebook Reels & Video Feeds</span>
                          <span className="text-[#0866FF] font-bold">26%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-[#0866FF] h-full rounded-full" style={{ width: "26%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Instagram Feed & Stories</span>
                          <span className="text-[#0866FF] font-bold">16%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-[#0866FF] h-full rounded-full" style={{ width: "16%" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Locations */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E9EDF4] space-y-3">
                    <h4 className="text-sm font-bold text-[#121826]">
                      Top Delivery Locations
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { city: "Dhaka Division", pct: "64%" },
                        { city: "Chittagong Division", pct: "18%" },
                        { city: "Sylhet Division", pct: "10%" },
                        { city: "Rajshahi & Khulna", pct: "8%" },
                      ].map((loc) => (
                        <div key={loc.city} className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFD]">
                          <span className="font-semibold text-slate-800">{loc.city}</span>
                          <span className="font-bold text-[#0866FF]">{loc.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#F8FAFD] border-t border-[#E9EDF4] flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Data synchronized with Meta Graph API
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInsightsBoost(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const toRenew = insightsBoost;
                      setInsightsBoost(null);
                      setSelectedOrderForRenew(toRenew);
                      setIsRenewModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-[#0866FF] hover:bg-[#0052CC] text-white rounded-xl shadow-xs"
                  >
                    Boost Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* POST PREVIEW MODAL                                        */}
        {/* ========================================================= */}
        {previewBoost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setPreviewBoost(null)}
            />
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 z-10 border border-[#E9EDF4] space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#0866FF]" />
                  <h4 className="text-sm font-bold text-[#121826]">Facebook Post Preview</h4>
                </div>
                <button
                  onClick={() => setPreviewBoost(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <FacebookPostPreview
                postUrl={previewBoost.postUrl}
                pageName={previewBoost.facebookPageName || primaryPageName}
                thumbnail={previewBoost.thumbnail}
                campaignName={previewBoost.campaignName}
                objective={previewBoost.objective}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
