"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Calendar,
  Layers,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Copy,
  X,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Save,
  Share2,
  Plus,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order, OrderStatus } from "@/types";
import { AdminCreateOrderModal } from "@/components/modals/AdminCreateOrderModal";

export default function AdminOrdersPage() {
  const {
    orders,
    updateOrderStatus,
    updateOrder,
    exchangeRateBDT,
    profile,
    isLoadingOrders,
    refreshOrders,
    refreshPayments,
    setSelectedOrderForModal,
  } = usePortal();

  // Search & Filters State
  const [sourceTab, setSourceTab] = useState<"portal" | "facebook_page">("portal");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [objectiveFilter, setObjectiveFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "budget-high" | "budget-low">("newest");
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get("clientId");
      if (cId) {
        setPreselectedClientId(cId);
        setIsCreateOrderModalOpen(true);
      } else if (params.get("create") === "true") {
        setIsCreateOrderModalOpen(true);
      }
    }
  }, []);

  // Update Live Results (Metrics) Modal State
  const [selectedOrderForMetrics, setSelectedOrderForMetrics] = useState<Order | null>(null);
  const [isFetchingFromMeta, setIsFetchingFromMeta] = useState(false);
  const [metricsForm, setMetricsForm] = useState({
    reach: 0,
    impressions: 0,
    conversations: 0,
    spendUSD: 0,
    ctr: 2.5,
    cpm: 0.85,
    status: "Active" as OrderStatus,
    specialistNote: "",
    metaCampaignId: "",
  });

  const handleOpenMetricsModal = (order: Order) => {
    setSelectedOrderForMetrics(order);
    setMetricsForm({
      reach: order.metrics?.reach || 0,
      impressions: order.metrics?.impressions || 0,
      conversations: order.metrics?.conversations || 0,
      spendUSD: order.metrics?.spendUSD ?? order.totalBudgetUSD ?? 0,
      ctr: order.metrics?.ctr || 2.5,
      cpm: order.metrics?.cpm || 0.85,
      status: order.status,
      specialistNote: order.notes?.[0] || "Campaign delivering smoothly across Meta networks.",
      metaCampaignId: order.metaCampaignId || "",
    });
  };

  const handleFetchFromMeta = async () => {
    if (!selectedOrderForMetrics) return;
    setIsFetchingFromMeta(true);
    try {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrderForMetrics.id }),
      });
      const data = await res.json();
      if (data.success && data.orders && data.orders.length > 0) {
        const updated = data.orders[0];
        if (updated.metrics) {
          setMetricsForm((prev) => ({
            ...prev,
            reach: updated.metrics.reach,
            impressions: updated.metrics.impressions,
            conversations: updated.metrics.conversations,
            spendUSD: updated.metrics.spendUSD,
            ctr: updated.metrics.ctr,
            cpm: updated.metrics.cpm,
          }));
          showNotification("Pulled live delivery numbers from Meta!");
        }
      }
    } catch {
      showNotification("Failed to fetch from Meta.");
    } finally {
      setIsFetchingFromMeta(false);
    }
  };

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForMetrics) return;

    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    updateOrder(selectedOrderForMetrics.id, {
      status: metricsForm.status,
      metaCampaignId: metricsForm.metaCampaignId.trim(),
      metrics: {
        reach: Number(metricsForm.reach) || 0,
        impressions: Number(metricsForm.impressions) || 0,
        conversations: Number(metricsForm.conversations) || 0,
        spendUSD: parseFloat(Number(metricsForm.spendUSD).toFixed(2)) || 0,
        ctr: parseFloat(Number(metricsForm.ctr).toFixed(2)) || 2.0,
        cpm: parseFloat(Number(metricsForm.cpm).toFixed(2)) || 0.8,
        lastUpdated: `Live on Meta • Updated ${now}`,
      },
      notes: metricsForm.specialistNote.trim()
        ? [metricsForm.specialistNote.trim()]
        : selectedOrderForMetrics.notes,
    });

    showNotification(`Live results for #${selectedOrderForMetrics.id} published to customer portal!`);
    setSelectedOrderForMetrics(null);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Live Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshOrders(), refreshPayments()]);
      showNotification("All client orders synchronized with live database!");
    } catch {
      showNotification("Failed to refresh orders from server.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Status Change with DB Persistence
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    if (newStatus === "Active") {
      updateOrder(orderId, { paymentStatus: "Verified" });
    }
    showNotification(`Order #${orderId} status updated to ${newStatus}`);
  };

  // One-click copy
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

  const activeDataset = sourceTab === "portal" ? portalOrders : pageBoosts;

  // Dynamic KPI counts for active dataset
  const totalCount = activeDataset.length;
  const activeCount = useMemo(() => activeDataset.filter((o) => o.status === "Active").length, [activeDataset]);
  const pendingCount = useMemo(
    () => activeDataset.filter((o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification").length,
    [activeDataset]
  );
  const completedCount = useMemo(() => activeDataset.filter((o) => o.status === "Completed").length, [activeDataset]);
  const pausedCount = useMemo(() => activeDataset.filter((o) => o.status === "Paused").length, [activeDataset]);
  const rejectedCount = useMemo(() => activeDataset.filter((o) => o.status === "Rejected").length, [activeDataset]);

  const totalVolumeUSD = useMemo(
    () => activeDataset.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0),
    [activeDataset]
  );
  const totalVolumeBDT = Math.round(totalVolumeUSD * (exchangeRateBDT || 150));

  // Status mapping for tab badges
  const statuses = ["All", "Pending", "Active", "Paused", "Completed", "Rejected"];
  const statusCounts: Record<string, number> = {
    All: totalCount,
    Pending: pendingCount,
    Active: activeCount,
    Paused: pausedCount,
    Completed: completedCount,
    Rejected: rejectedCount,
  };

  // Categories list
  const categories = ["All Formats", "Boost Post", "Ads Campaign", "Promotion"];

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = activeDataset.filter((order) => {
      const matchesSearch =
        !q ||
        order.campaignName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.transactionId && order.transactionId.toLowerCase().includes(q)) ||
        (order.postType && order.postType.toLowerCase().includes(q)) ||
        (order.paymentMethod && order.paymentMethod.toLowerCase().includes(q)) ||
        profile.businessName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Pending"
          ? order.status === "Pending" || order.paymentStatus === "Awaiting Verification"
          : order.status === statusFilter;

      const matchesObjective =
        objectiveFilter === "All" ? true : order.objective === objectiveFilter;

      const matchesCategory =
        categoryFilter === "All Formats"
          ? true
          : order.postType?.toLowerCase().includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesObjective && matchesCategory;
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
  }, [activeDataset, searchQuery, statusFilter, objectiveFilter, categoryFilter, sortBy, profile.businessName]);

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "All" ||
    objectiveFilter !== "All" ||
    categoryFilter !== "All Formats";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setObjectiveFilter("All");
    setCategoryFilter("All Formats");
    setSortBy("newest");
  };

  return (
    <AdminLayout pageTitle="All Client Orders">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#121826] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="space-y-6 sm:space-y-7">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight">
                All Client Boost Orders
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#3858F6] text-xs font-extrabold">
                {portalOrders.length} Portal Orders
              </span>
              {pageBoosts.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {pageBoosts.length} FB Page Boosts Connected
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                MongoDB Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Master control panel for monitoring, launching, and managing all client campaigns across Facebook & Instagram.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Create Order for Client Button */}
            <button
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl text-xs font-black shadow-md shadow-[#3858F6]/25 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order for Client</span>
            </button>

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
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {/* Quick link to Pending Approvals */}
            {portalOrders.filter(o => o.status === "Pending" || o.paymentStatus === "Awaiting Verification").length > 0 && (
              <Link
                href="/admin/pending"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {portalOrders.filter(o => o.status === "Pending" || o.paymentStatus === "Awaiting Verification").length} Pending Queue
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Dataset Switcher Tabs: Portal Orders vs Connected Facebook Page Boosts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E9EDF4] shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSourceTab("portal");
                setStatusFilter("All");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                sourceTab === "portal"
                  ? "bg-[#3858F6] text-white shadow-md shadow-[#3858F6]/25"
                  : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>In-App Portal Orders</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  sourceTab === "portal" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {portalOrders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setSourceTab("facebook_page");
                setStatusFilter("All");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                sourceTab === "facebook_page"
                  ? "bg-[#3858F6] text-white shadow-md shadow-[#3858F6]/25"
                  : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Connected FB Page Boosts</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  sourceTab === "facebook_page" ? "bg-white/20 text-white" : "bg-blue-100 text-[#3858F6]"
                }`}
              >
                {pageBoosts.length}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            {sourceTab === "portal"
              ? "Verified orders placed by clients directly through this web application."
              : "Boost campaigns running on client Facebook pages directly from Meta Ads Manager."}
          </p>
        </div>

        {/* 4 Dynamic Interactive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Orders */}
          <button
            onClick={() => setStatusFilter("All")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "All"
                ? "bg-white border-[#3858F6] ring-2 ring-[#3858F6]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-[#3858F6]" />
            </div>
            <div className="text-2xl font-black text-[#121826] mt-1.5">{orders.length}</div>
            <div className="text-[11px] text-[#3858F6] font-semibold mt-1">
              ${totalVolumeUSD.toFixed(2)} USD (≈ ৳{totalVolumeBDT.toLocaleString()})
            </div>
          </button>

          {/* Card 2: Active Campaigns */}
          <button
            onClick={() => setStatusFilter("Active")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "Active"
                ? "bg-[#EAF8F1] border-[#10B981] ring-2 ring-[#10B981]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-emerald-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10B981] uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Active Live</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <div className="text-2xl font-black text-[#10B981] mt-1.5">{activeCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Actively delivering on Meta</div>
          </button>

          {/* Card 3: Pending Queue */}
          <button
            onClick={() => setStatusFilter("Pending")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "Pending"
                ? "bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-amber-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#D97706] uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            </div>
            <div className="text-2xl font-black text-[#D97706] mt-1.5">{pendingCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Awaiting specialist verification</div>
          </button>

          {/* Card 4: Completed Campaigns */}
          <button
            onClick={() => setStatusFilter("Completed")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "Completed"
                ? "bg-slate-100 border-slate-400 ring-2 ring-slate-300 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1.5">{completedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Goals reached successfully</div>
          </button>
        </div>

        {/* Master Orders Table Card */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden space-y-4">
          {/* Controls Bar */}
          <div className="p-5 sm:p-6 border-b border-[#E9EDF4] space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by Order ID, campaign, TRX, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-xs text-[#121826] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3858F6] transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters & Sorters */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Format/Category Filter */}
                <div className="flex items-center gap-1.5 bg-[#F5F7FB] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Objective Selector */}
                <div className="flex items-center gap-1.5 bg-[#F5F7FB] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-medium">Goal:</span>
                  <select
                    value={objectiveFilter}
                    onChange={(e) => setObjectiveFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="All">All Goals</option>
                    <option value="Messages">Messages</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Leads">Leads</option>
                  </select>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-[#F5F7FB] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="newest">Newest Placed</option>
                    <option value="oldest">Oldest Placed</option>
                    <option value="budget-high">Budget: High to Low</option>
                    <option value="budget-low">Budget: Low to High</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-[#3858F6] hover:text-[#2542D9] px-2.5 py-1.5 hover:bg-[#EEF2FF] rounded-xl transition-all cursor-pointer"
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
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFD] text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                <tr>
                  <th className="py-4 px-6">Order ID & Campaign</th>
                  <th className="py-4 px-4">Client / Page</th>
                  <th className="py-4 px-4">Budget & Duration</th>
                  <th className="py-4 px-4">Payment Info</th>
                  <th className="py-4 px-4">Live Status Control</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoadingOrders && orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#3858F6]" />
                        <span>Loading live client orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 px-4">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          {sourceTab === "portal" ? (
                            <ShoppingBag className="w-6 h-6 text-[#3858F6]" />
                          ) : (
                            <Search className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-800">
                          {sourceTab === "portal"
                            ? "No Portal Orders Found (0 In-App Orders)"
                            : "No campaigns matching your filter"}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {sourceTab === "portal"
                            ? "No clients have placed new boost orders through this application yet. Any new orders submitted from client portals will appear here."
                            : "No Facebook page boost campaigns match this filter."}
                        </p>
                        {sourceTab === "portal" && pageBoosts.length > 0 && (
                          <button
                            onClick={() => {
                              setSourceTab("facebook_page");
                              setStatusFilter("All");
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3858F6] text-xs font-bold rounded-xl transition-all cursor-pointer mt-2"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>View Connected Page Boosts ({pageBoosts.length})</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID & Campaign */}
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={(e) => handleCopy(order.id, e)}
                                className="font-mono font-bold text-[#3858F6] hover:underline inline-flex items-center gap-1"
                                title="Click to copy Order ID"
                              >
                                <span>#{order.id}</span>
                                {copiedId === order.id && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                              </button>
                              {order.isExternalBoost || order.source === "facebook_page_boost" ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                  FB Page Direct
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EAF8F1] text-[#059669] border border-[#A7F3D0]">
                                  Portal Order
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-[#121826] text-sm mt-0.5 truncate max-w-[200px]">
                              {order.campaignName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {order.objective} • {order.postType}
                            </div>
                            {order.metaAccountName && (
                              <div className="text-[10px] font-semibold text-[#0866FF] flex items-center gap-1 mt-0.5">
                                <Share2 className="w-2.5 h-2.5" />
                                <span>{order.metaAccountName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Client / Page */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#121826]">{order.businessName || profile.businessName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {order.facebookPageName || profile.connectedPage.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{order.clientEmail || order.createdAt}</div>
                      </td>

                      {/* Budget & Duration */}
                      <td className="py-4 px-4">
                        <div className="font-black text-[#121826]">${order.totalBudgetUSD.toFixed(2)} USD</div>
                        <div className="text-[11px] text-slate-500">
                          ≈ ৳{(order.paidAmountBDT || Math.round(order.totalBudgetUSD * exchangeRateBDT)).toLocaleString()} BDT
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          ${order.dailyBudgetUSD.toFixed(2)}/day × {order.durationDays}d
                        </div>
                        {order.metrics && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-slate-50 p-1 rounded-md border border-slate-100">
                            <span className="text-[#3858F6] font-bold">{(order.metrics.reach / 1000).toFixed(1)}k reach</span>
                            <span>•</span>
                            <span className="text-purple-600 font-bold">{order.metrics.conversations} msg</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">${order.metrics.spendUSD.toFixed(1)} spent</span>
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{order.paymentMethod || "bKash"}</div>
                        <button
                          onClick={(e) => order.transactionId && handleCopy(order.transactionId, e)}
                          className="font-mono text-[11px] text-slate-500 hover:text-[#3858F6] hover:underline inline-flex items-center gap-1"
                          title="Copy TRX ID"
                        >
                          <span>{order.transactionId || "Pending"}</span>
                          {copiedId === order.transactionId && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                        </button>
                        <div className="mt-1">
                          <StatusBadge status={order.paymentStatus} size="sm" />
                        </div>
                      </td>

                      {/* Live Status Control Dropdown */}
                      <td className="py-4 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`font-bold text-xs px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${
                            order.status === "Active"
                              ? "bg-[#EAF8F1] border-[#10B981] text-[#059669]"
                              : order.status === "Pending"
                              ? "bg-[#FFFBEB] border-[#F59E0B] text-[#D97706]"
                              : order.status === "Completed"
                              ? "bg-slate-100 border-slate-300 text-slate-700"
                              : order.status === "Paused"
                              ? "bg-amber-50 border-amber-300 text-amber-800"
                              : "bg-red-50 border-red-200 text-red-600"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Active">Active (Live)</option>
                          <option value="Paused">Paused</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2">
                        {order.status === "Pending" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "Active")}
                            className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenMetricsModal(order)}
                          className="px-2.5 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3858F6] rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:scale-105 active:scale-95"
                          title="Publish / Update live delivery results (Reach, Spend, Views, Messages) to customer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Results</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrderForModal(order)}
                          className="px-2.5 py-1.5 bg-[#F5F7FB] hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Live Results (Metrics) Modal */}
        {selectedOrderForMetrics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedOrderForMetrics(null)}
            />

            <div className="relative bg-white rounded-[28px] shadow-2xl max-w-xl w-full p-6 sm:p-7 z-10 border border-[#E9EDF4] space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center font-black">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-[#121826]">Publish Live Delivery Results</h3>
                      <span className="font-mono text-xs font-bold text-[#3858F6] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                        #{selectedOrderForMetrics.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Campaign: <strong className="text-slate-800">{selectedOrderForMetrics.campaignName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForMetrics(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notice info */}
              <div className="p-3.5 rounded-2xl bg-[#F0F7FF] border border-[#BFDBFE] text-xs text-[#1E40AF] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Instant Customer Visibility:</strong> Numbers entered below will immediately display on the customer&apos;s <strong>Dashboard</strong>, <strong>Ads Performance Overview</strong>, and order lifecycle tracker.
                </div>
              </div>

              <form onSubmit={handleSaveMetrics} className="space-y-4">
                {/* Meta Campaign ID Link & Live Sync Button */}
                <div className="p-3.5 bg-gradient-to-r from-[#F0F5FF] to-[#EBF2FF] rounded-2xl border border-[#C7D9FE] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-[#0866FF]" />
                      <span>Meta Campaign ID</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchFromMeta}
                      disabled={isFetchingFromMeta}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0866FF] hover:text-[#0052CC] bg-white px-2.5 py-1 rounded-lg border border-[#C7D9FE] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      title="Pull latest live Reach, Impressions, Messages & Spend from Meta"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingFromMeta ? "animate-spin" : ""}`} />
                      <span>{isFetchingFromMeta ? "Fetching..." : "Fetch Live from Meta"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={metricsForm.metaCampaignId}
                    onChange={(e) => setMetricsForm({ ...metricsForm, metaCampaignId: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0866FF]"
                    placeholder="e.g. 23851029481720 (From Meta Ads Manager)"
                  />
                  <div className="text-[10px] text-slate-500">
                    Paste the campaign ID from your Meta Ads Manager to automatically fetch and stream live metrics.
                  </div>
                </div>

                {/* 4 Core Results Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Reach */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#3858F6]" />
                      <span>Unique Reach</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={metricsForm.reach}
                      onChange={(e) => setMetricsForm({ ...metricsForm, reach: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:border-[#3858F6] focus:outline-none"
                      placeholder="e.g. 12500"
                      required
                    />
                  </div>

                  {/* Impressions / Views */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>Impressions / Views</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={metricsForm.impressions}
                      onChange={(e) => setMetricsForm({ ...metricsForm, impressions: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:border-[#3858F6] focus:outline-none"
                      placeholder="e.g. 18200"
                      required
                    />
                  </div>

                  {/* Conversations / Messages */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Messages / Inquiries</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={metricsForm.conversations}
                      onChange={(e) => setMetricsForm({ ...metricsForm, conversations: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:border-[#3858F6] focus:outline-none"
                      placeholder="e.g. 64"
                      required
                    />
                  </div>

                  {/* Delivered Spend USD */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>Delivered Spend ($ USD)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={metricsForm.spendUSD}
                        onChange={(e) => setMetricsForm({ ...metricsForm, spendUSD: Number(e.target.value) })}
                        className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:border-[#3858F6] focus:outline-none"
                        placeholder="e.g. 15.00"
                        required
                      />
                      <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold text-xs">$</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Rapid Updating */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                  <span className="text-slate-400 font-semibold">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setMetricsForm({ ...metricsForm, reach: metricsForm.reach + 1000, impressions: metricsForm.impressions + 1500 })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    +1K Reach
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricsForm({ ...metricsForm, reach: metricsForm.reach + 5000, impressions: metricsForm.impressions + 7500 })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    +5K Reach
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricsForm({ ...metricsForm, conversations: metricsForm.conversations + 10 })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    +10 Messages
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricsForm({ ...metricsForm, spendUSD: selectedOrderForMetrics.totalBudgetUSD })}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Set Full Budget (${selectedOrderForMetrics.totalBudgetUSD})
                  </button>
                </div>

                {/* Status & CTR Row */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Delivery Status</label>
                    <select
                      value={metricsForm.status}
                      onChange={(e) => setMetricsForm({ ...metricsForm, status: e.target.value as OrderStatus })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3858F6]"
                    >
                      <option value="Active">Active (Currently Delivering)</option>
                      <option value="Completed">Completed (Campaign Finished)</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">CTR % (Click-Through Rate)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={metricsForm.ctr}
                      onChange={(e) => setMetricsForm({ ...metricsForm, ctr: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3858F6]"
                      placeholder="e.g. 2.8"
                    />
                  </div>
                </div>

                {/* Specialist Advice / Notes for Client */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Ad Specialist Performance Note (Visible to Customer)
                  </label>
                  <textarea
                    rows={2}
                    value={metricsForm.specialistNote}
                    onChange={(e) => setMetricsForm({ ...metricsForm, specialistNote: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:border-[#3858F6] focus:outline-none"
                    placeholder="e.g. Campaign delivering with optimal engagement. Dhaka audiences are responding actively."
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForMetrics(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3858F6]/20 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Publish Results to Customer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Admin Create Order on Behalf of Client Modal */}
        <AdminCreateOrderModal
          isOpen={isCreateOrderModalOpen}
          onClose={() => setIsCreateOrderModalOpen(false)}
          initialClientId={preselectedClientId}
          onOrderCreated={(newOrder) => {
            showNotification(
              `Order #${newOrder.id} created successfully for ${
                newOrder.clientName || newOrder.clientEmail
              }!`
            );
          }}
        />
      </div>
    </AdminLayout>
  );
}
