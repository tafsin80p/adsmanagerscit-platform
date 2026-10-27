"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Filter,
  Eye,
  Layers,
  Sparkles,
  Rocket,
  Megaphone,
  Star,
  Tag,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  LayoutGrid,
  ListFilter,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import {
  Order,
  getOrderCategory,
  CampaignCategory,
  getCategoryDisplayName,
  getCategoryMetaTitle,
  generateMetaPrompt,
  formatOrderId,
} from "@/types";

export default function AdminPendingApprovalsPage() {
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

  const [typeFilter, setTypeFilter] = useState<"All" | CampaignCategory>("All");
  const [methodFilter, setMethodFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"categorized" | "unified">("categorized");
  const [expandedPromptOrderId, setExpandedPromptOrderId] = useState<string | null>(null);
  const [copiedPromptOrderId, setCopiedPromptOrderId] = useState<string | null>(null);
  const [modalPromptOrder, setModalPromptOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshOrders(), refreshPayments()]);
      showNotification("Pending approvals queue synchronized with live database!");
    } catch {
      showNotification("Failed to refresh live queue.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleCopyPrompt = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const promptText = generateMetaPrompt(order, exchangeRateBDT);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(promptText);
    }
    setCopiedPromptOrderId(order.id);
    showNotification(`Meta launch prompt copied for Order #${order.id}`);
    setTimeout(() => {
      setCopiedPromptOrderId(null);
    }, 2500);
  };

  const handleCopyCategoryPrompts = (categoryOrders: Order[], categoryName: string) => {
    if (categoryOrders.length === 0) return;
    const combinedPrompts = categoryOrders
      .map((o) => generateMetaPrompt(o, exchangeRateBDT))
      .join("\n\n" + "=".repeat(48) + "\n\n");
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(combinedPrompts);
    }
    showNotification(`Copied all ${categoryName} prompts (${categoryOrders.length} orders) to clipboard!`);
  };

  const handleApprove = (order: Order) => {
    const category = getOrderCategory(order.postType);
    const categoryLabel = getCategoryMetaTitle(category);

    updateOrderStatus(order.id, "Active");
    updateOrder(order.id, { paymentStatus: "Verified" });
    showNotification(`Order #${order.id} verified and launched as ${categoryLabel} on Meta!`);
  };

  const handleReject = (orderId: string) => {
    updateOrderStatus(orderId, "Rejected");
    showNotification(`Order #${orderId} rejected.`);
  };

  const handleChangeCategory = (
    orderId: string,
    newType: "Boost Post" | "Ads Campaign" | "Promotion"
  ) => {
    const cat = getOrderCategory(newType);
    const newId = formatOrderId(orderId, cat);
    updateOrder(orderId, { postType: newType, id: newId });
    showNotification(`Order reclassified to ${getCategoryDisplayName(cat)} (${newId}).`);
  };

  // Base list of all pending portal orders (excluding direct Facebook page boosts)
  const allPendingOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.isExternalBoost || order.source === "facebook_page_boost") return false;
      return order.status === "Pending" || order.paymentStatus === "Awaiting Verification";
    });
  }, [orders]);

  // Counts for each category across entire pending queue
  const boostCount = useMemo(() => {
    return allPendingOrders.filter((o) => getOrderCategory(o.postType) === "Boost").length;
  }, [allPendingOrders]);

  const adsCount = useMemo(() => {
    return allPendingOrders.filter((o) => getOrderCategory(o.postType) === "Ads").length;
  }, [allPendingOrders]);

  const promoteCount = useMemo(() => {
    return allPendingOrders.filter((o) => getOrderCategory(o.postType) === "Promote").length;
  }, [allPendingOrders]);

  // Gateway counts across pending queue
  const bkashCount = useMemo(() => {
    return allPendingOrders.filter((o) => o.paymentMethod === "bKash").length;
  }, [allPendingOrders]);

  const nagadCount = useMemo(() => {
    return allPendingOrders.filter((o) => o.paymentMethod === "Nagad").length;
  }, [allPendingOrders]);

  const bankCount = useMemo(() => {
    return allPendingOrders.filter((o) => o.paymentMethod === "Bank Transfer").length;
  }, [allPendingOrders]);

  // Filtered orders based on category, payment gateway, and search query
  const filteredPendingOrders = useMemo(() => {
    return allPendingOrders.filter((order) => {
      const category = getOrderCategory(order.postType);
      const matchesType = typeFilter === "All" ? true : category === typeFilter;
      const matchesMethod =
        methodFilter === "All" ? true : order.paymentMethod === methodFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q
        ? true
        : order.id.toLowerCase().includes(q) ||
          order.campaignName.toLowerCase().includes(q) ||
          (order.transactionId && order.transactionId.toLowerCase().includes(q)) ||
          profile.businessName.toLowerCase().includes(q);

      return matchesType && matchesMethod && matchesSearch;
    });
  }, [allPendingOrders, typeFilter, methodFilter, searchQuery, profile.businessName]);

  // Grouped lists
  const pendingBoostOrders = useMemo(() => {
    return filteredPendingOrders.filter((o) => getOrderCategory(o.postType) === "Boost");
  }, [filteredPendingOrders]);

  const pendingAdsOrders = useMemo(() => {
    return filteredPendingOrders.filter((o) => getOrderCategory(o.postType) === "Ads");
  }, [filteredPendingOrders]);

  const pendingPromoteOrders = useMemo(() => {
    return filteredPendingOrders.filter((o) => getOrderCategory(o.postType) === "Promote");
  }, [filteredPendingOrders]);

  const boostUSD = pendingBoostOrders.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0);
  const adsUSD = pendingAdsOrders.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0);
  const promoteUSD = pendingPromoteOrders.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0);

  const totalFilteredUSD = filteredPendingOrders.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0);
  const totalFilteredBDT = Math.round(totalFilteredUSD * exchangeRateBDT);

  // Render an individual pending order card
  const renderOrderCard = (order: Order) => {
    const category = getOrderCategory(order.postType);
    const isExpanded = expandedPromptOrderId === order.id;
    const isCopied = copiedPromptOrderId === order.id;
    const promptText = generateMetaPrompt(order, exchangeRateBDT);

    return (
      <div
        key={order.id}
        className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] hover:border-slate-300 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5"
      >
        <div>
          {/* Top Row: Order ID + CATEGORY BADGE (Boost / Ads / Promote) + Payment Status */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-[#3858F6] bg-[#EEF2FF] px-2.5 py-1 rounded-lg">
              {order.id}
            </span>

            {/* Primary Campaign Type Badge */}
            {category === "Boost" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#EEF2FF] text-[#2563EB] border border-[#BFDBFE] flex items-center gap-1 shadow-2xs">
                <Rocket className="w-3.5 h-3.5" />
                <span>Ads Boost</span>
              </span>
            )}
            {category === "Ads" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF] flex items-center gap-1 shadow-2xs">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Ads Campaign</span>
              </span>
            )}
            {category === "Promote" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center gap-1 shadow-2xs">
                <Star className="w-3.5 h-3.5" />
                <span>Promote</span>
              </span>
            )}

            <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-amber-200 whitespace-nowrap flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{order.paymentStatus}</span>
            </span>
          </div>

          {/* Campaign Title & Connected Client */}
          <h3 className="text-base font-extrabold text-[#121826] mt-3.5">
            {order.campaignName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Client: <strong>{profile.businessName}</strong> ({profile.connectedPage.name})
          </p>

          {/* Admin Category Quick-Switch Bar */}
          <div className="mt-3.5 p-2 bg-[#F8FAFC] rounded-xl border border-slate-200/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Category:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleChangeCategory(order.id, "Boost Post")}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  category === "Boost"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Categorize as Ads Boost"
              >
                🚀 Boost
              </button>
              <button
                type="button"
                onClick={() => handleChangeCategory(order.id, "Ads Campaign")}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  category === "Ads"
                    ? "bg-[#7C3AED] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Categorize as Ads Campaign"
              >
                📢 Ads
              </button>
              <button
                type="button"
                onClick={() => handleChangeCategory(order.id, "Promotion")}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  category === "Promote"
                    ? "bg-[#D97706] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Categorize as Promote"
              >
                ⭐ Promote
              </button>
            </div>
          </div>

          {/* Transaction Breakdown Box */}
          <div className="mt-3 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Payment Gateway:</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {order.paymentMethod || "bKash"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono font-black text-[#121826] tracking-wide">
                {order.transactionId || "TRX-PENDING"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Paid Amount:</span>
              <span className="font-extrabold text-[#10B981] text-sm">
                ${order.totalBudgetUSD.toFixed(2)} (৳
                {(
                  order.paidAmountBDT || Math.round(order.totalBudgetUSD * exchangeRateBDT)
                ).toLocaleString()}{" "}
                BDT)
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Goal & Duration:</span>
              <span className="font-semibold text-slate-700">
                {order.durationDays} Days ({order.objective})
              </span>
            </div>
          </div>

          {/* META LAUNCH PROMPT SPEC BOX (Dedicated for this Order & Category) */}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-[#F1F5F9]/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
                <Terminal className="w-3.5 h-3.5 text-[#3858F6]" />
                <span>Meta Ad Launch Prompt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleCopyPrompt(order, e)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    isCopied
                      ? "bg-[#10B981] text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                  title="Copy formatted Meta launch prompt"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedPromptOrderId(isExpanded ? null : order.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title={isExpanded ? "Collapse Prompt" : "Expand Prompt"}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsed Preview or Expanded Full Prompt */}
            {isExpanded ? (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {promptText}
                </pre>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Paste into ChatGPT / Meta Business Suite</span>
                  <button
                    type="button"
                    onClick={() => setModalPromptOrder(order)}
                    className="text-[#3858F6] font-bold hover:underline cursor-pointer"
                  >
                    Open in Fullscreen
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 line-clamp-1 italic font-mono bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                {category === "Boost"
                  ? `[Ads Boost Prompt] Post: ${order.postUrl || "Feed Post"} • Objective: ${order.objective}`
                  : category === "Ads"
                  ? `[Ads Campaign Prompt] Conversions & CBO • Budget: $${order.totalBudgetUSD}`
                  : `[Promote Prompt] Page Growth • Schedule: ${order.durationDays} Days`}
              </p>
            )}
          </div>

          {/* Client WhatsApp & Post URL */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ordered: {order.createdAt}</span>
            <div className="flex items-center gap-3">
              {order.postUrl && (
                <a
                  href={order.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3858F6] font-bold hover:underline flex items-center gap-1"
                >
                  <span>Creative Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a
                href={`https://wa.me/8801712889900?text=Hi%20${profile.businessName},%20regarding%20your%20${getCategoryDisplayName(
                  category
                )}%20order%20${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#10B981] font-bold hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => handleApprove(order)}
            className={`w-full py-2.5 px-4 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              category === "Boost"
                ? "bg-[#2563EB] hover:bg-[#1D4ED8]"
                : category === "Ads"
                ? "bg-[#7C3AED] hover:bg-[#6D28D9]"
                : "bg-[#D97706] hover:bg-[#B45309]"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              Approve & Launch {getCategoryDisplayName(category)}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrderForModal(order)}
              className="flex-1 py-2 px-3 bg-[#F5F7FB] hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Inspect Post
            </button>
            <button
              onClick={() => handleReject(order.id)}
              className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout pageTitle="Pending Approvals">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#121826] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Meta Ad Prompt Modal */}
      {modalPromptOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#EEF2FF] text-[#3858F6]">
                  <Terminal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#121826]">
                    Meta Ad Launch Prompt — #{modalPromptOrder.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: <strong>{getCategoryDisplayName(getOrderCategory(modalPromptOrder.postType))}</strong> • {modalPromptOrder.campaignName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalPromptOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2">
                Copy this pre-formatted prompt into Meta Ads Manager, Meta Business Suite, or your team’s ad execution sheet:
              </p>
              <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-4 rounded-2xl leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {generateMetaPrompt(modalPromptOrder, exchangeRateBDT)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">
                Total Budget: ${modalPromptOrder.totalBudgetUSD.toFixed(2)} USD (৳
                {(
                  modalPromptOrder.paidAmountBDT ||
                  Math.round(modalPromptOrder.totalBudgetUSD * exchangeRateBDT)
                ).toLocaleString()}{" "}
                BDT)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(modalPromptOrder)}
                  className="px-4 py-2 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Entire Prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalPromptOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight">
                Pending Approvals & Verification Queue
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  allPendingOrders.length > 0
                    ? "bg-[#FEF3C7] text-[#D97706]"
                    : "bg-[#EAF8F1] text-[#10B981]"
                }`}
              >
                {allPendingOrders.length} In Queue
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                MongoDB Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Verify incoming transactions and launch campaigns under their respective categories: <strong>Ads Boost</strong>, <strong>Ads Campaign</strong>, and <strong>Promote</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingOrders}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh pending queue from database"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3858F6] ${
                  isRefreshing || isLoadingOrders ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh Queue</span>
            </button>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Interactive Category Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Queue */}
          <button
            onClick={() => {
              setTypeFilter("All");
              setMethodFilter("All");
            }}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              typeFilter === "All"
                ? "bg-white border-[#3858F6] ring-2 ring-[#3858F6]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Total In Queue</div>
              <Clock className="w-4 h-4 text-[#3858F6]" />
            </div>
            <div className="text-2xl font-black text-[#121826] mt-2">
              {allPendingOrders.length} Orders
            </div>
            <div className="text-[11px] text-[#3858F6] font-semibold mt-1">
              ${allPendingOrders.reduce((s, o) => s + (o.totalBudgetUSD || 0), 0).toFixed(2)} USD queued
            </div>
          </button>

          {/* Card 2: Ads Boost */}
          <button
            onClick={() => setTypeFilter(typeFilter === "Boost" ? "All" : "Boost")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              typeFilter === "Boost"
                ? "bg-[#EEF2FF] border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-blue-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#2563EB] uppercase flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" />
                <span>Ads Boost</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            </div>
            <div className="text-2xl font-black text-[#2563EB] mt-2">
              {boostCount} Boosts
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct post reach & WhatsApp engagement
            </div>
          </button>

          {/* Card 3: Ads Campaigns */}
          <button
            onClick={() => setTypeFilter(typeFilter === "Ads" ? "All" : "Ads")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              typeFilter === "Ads"
                ? "bg-[#FAF5FF] border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-purple-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#7C3AED] uppercase flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Ads Campaign</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            </div>
            <div className="text-2xl font-black text-[#7C3AED] mt-2">
              {adsCount} Campaigns
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Lead gen, conversions & traffic
            </div>
          </button>

          {/* Card 4: Promote */}
          <button
            onClick={() => setTypeFilter(typeFilter === "Promote" ? "All" : "Promote")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              typeFilter === "Promote"
                ? "bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-amber-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#D97706] uppercase flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                <span>Promote</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            </div>
            <div className="text-2xl font-black text-[#D97706] mt-2">
              {promoteCount} Promotes
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Page followers & official brand growth
            </div>
          </button>
        </div>

        {/* Dual Filter Controls Bar: Category Tabs + View Switcher + Search + Gateway */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E9EDF4] shadow-2xs space-y-4">
          {/* Row 1: Campaign Category Tabs & View Mode Switcher */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#3858F6]" />
                <span>Category View:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-[#F5F7FB] p-1 rounded-xl border border-slate-200 flex-wrap">
                <button
                  onClick={() => setTypeFilter("All")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === "All"
                      ? "bg-white text-[#3858F6] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                    {allPendingOrders.length}
                  </span>
                </button>

                <button
                  onClick={() => setTypeFilter("Boost")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === "Boost"
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#2563EB]"
                  }`}
                >
                  <Rocket className="w-3 h-3" />
                  <span>Ads Boost</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      typeFilter === "Boost"
                        ? "bg-white/25 text-white"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {boostCount}
                  </span>
                </button>

                <button
                  onClick={() => setTypeFilter("Ads")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === "Ads"
                      ? "bg-[#7C3AED] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#7C3AED]"
                  }`}
                >
                  <Megaphone className="w-3 h-3" />
                  <span>Ads Campaign</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      typeFilter === "Ads"
                        ? "bg-white/25 text-white"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {adsCount}
                  </span>
                </button>

                <button
                  onClick={() => setTypeFilter("Promote")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === "Promote"
                      ? "bg-[#D97706] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#D97706]"
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>Promote</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      typeFilter === "Promote"
                        ? "bg-white/25 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {promoteCount}
                  </span>
                </button>
              </div>
            </div>

            {/* View Mode Toggle: Categorized Blocks vs Unified Grid */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Layout:</span>
              <div className="flex items-center gap-1 bg-[#F5F7FB] p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("categorized")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "categorized"
                      ? "bg-white text-[#3858F6] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Group orders by Ads Boost, Ads Campaign, and Promote"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>By Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("unified")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "unified"
                      ? "bg-white text-[#3858F6] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Show all orders in a single unified grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>All Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Search Input + Payment Gateway Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              {/* Search Box */}
              <div className="relative min-w-[220px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Order #, client, TRX..."
                  className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#3858F6] focus:outline-none transition-all"
                />
              </div>

              {/* Payment Gateway Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gateway:</span>
                </span>
                <div className="flex items-center gap-1 bg-[#F5F7FB] p-1 rounded-xl border border-slate-200">
                  {["All", "bKash", "Nagad", "Bank Transfer"].map((m) => {
                    const count =
                      m === "All"
                        ? allPendingOrders.length
                        : m === "bKash"
                        ? bkashCount
                        : m === "Nagad"
                        ? nagadCount
                        : bankCount;

                    return (
                      <button
                        key={m}
                        onClick={() => setMethodFilter(m)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          methodFilter === m
                            ? "bg-white text-[#3858F6] shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>{m}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            methodFilter === m
                              ? "bg-[#EEF2FF] text-[#3858F6]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(typeFilter !== "All" || methodFilter !== "All" || searchQuery) && (
                <button
                  onClick={() => {
                    setTypeFilter("All");
                    setMethodFilter("All");
                    setSearchQuery("");
                  }}
                  className="text-xs text-[#3858F6] hover:underline font-bold ml-1 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredPendingOrders.length}</strong> of {allPendingOrders.length} pending
              (<strong>${totalFilteredUSD.toFixed(2)} USD</strong> / ৳{totalFilteredBDT.toLocaleString()} BDT)
            </div>
          </div>
        </div>

        {/* CONTENT DISPLAY: CATEGORIZED SECTIONS OR UNIFIED GRID */}
        {filteredPendingOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-[28px] border border-[#E9EDF4] text-center shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#EAF8F1] text-[#10B981] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#121826]">
                {allPendingOrders.length === 0 ? "All Clear! Queue Empty" : "No Matches Found"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {allPendingOrders.length === 0
                  ? "There are currently no pending orders or unverified payments in queue. All client campaigns have been launched."
                  : `No pending orders matched your current filters. Try resetting filters or search query.`}
              </p>
            </div>
            <div className="pt-2">
              {allPendingOrders.length === 0 ? (
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <span>Browse All Active Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setTypeFilter("All");
                    setMethodFilter("All");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "categorized" && typeFilter === "All" ? (
          /* ==============================================================
             CATEGORIZED SECTIONS VIEW:
             1. Ads Boost Section
             2. Ads Campaign Section
             3. Promote Section
             ============================================================== */
          <div className="space-y-8">
            {/* SECTION 1: ADS BOOST */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#EEF2FF] to-white p-4 sm:p-5 rounded-2xl border border-[#BFDBFE] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#1E3A8A]">
                        Ads Boost Queue
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2563EB] text-white">
                        {pendingBoostOrders.length} {pendingBoostOrders.length === 1 ? "Boost" : "Boosts"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Direct post boost orders for WhatsApp & Messenger client inquiries and engagement.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                    ${boostUSD.toFixed(2)} USD (৳{Math.round(boostUSD * exchangeRateBDT).toLocaleString()} BDT)
                  </span>
                  {pendingBoostOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyCategoryPrompts(pendingBoostOrders, "Ads Boost")}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Copy all Boost prompts at once"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Prompts</span>
                    </button>
                  )}
                </div>
              </div>

              {pendingBoostOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingBoostOrders.map(renderOrderCard)}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No pending Ads Boost orders in queue.
                </div>
              )}
            </div>

            {/* SECTION 2: ADS CAMPAIGN */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#FAF5FF] to-white p-4 sm:p-5 rounded-2xl border border-[#E9D5FF] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#581C87]">
                        Ads Campaign Queue
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#7C3AED] text-white">
                        {pendingAdsOrders.length} {pendingAdsOrders.length === 1 ? "Campaign" : "Campaigns"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Meta Ads Manager full setup campaigns for conversions, lead generation, and multi-placement delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-[#581C87] bg-white px-3 py-1.5 rounded-xl border border-purple-200">
                    ${adsUSD.toFixed(2)} USD (৳{Math.round(adsUSD * exchangeRateBDT).toLocaleString()} BDT)
                  </span>
                  {pendingAdsOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyCategoryPrompts(pendingAdsOrders, "Ads Campaign")}
                      className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Copy all Ads Campaign prompts at once"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Prompts</span>
                    </button>
                  )}
                </div>
              </div>

              {pendingAdsOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingAdsOrders.map(renderOrderCard)}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No pending Ads Campaign orders in queue.
                </div>
              )}
            </div>

            {/* SECTION 3: PROMOTE */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#FFFBEB] to-white p-4 sm:p-5 rounded-2xl border border-[#FDE68A] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#92400E]">
                        Promote (Page Growth) Queue
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#D97706] text-white">
                        {pendingPromoteOrders.length} {pendingPromoteOrders.length === 1 ? "Promotion" : "Promotions"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Official page like, genuine follower, and brand authority campaigns on Facebook.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-[#92400E] bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                    ${promoteUSD.toFixed(2)} USD (৳{Math.round(promoteUSD * exchangeRateBDT).toLocaleString()} BDT)
                  </span>
                  {pendingPromoteOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyCategoryPrompts(pendingPromoteOrders, "Promote")}
                      className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Copy all Promote prompts at once"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Prompts</span>
                    </button>
                  )}
                </div>
              </div>

              {pendingPromoteOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingPromoteOrders.map(renderOrderCard)}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No pending Page Promotion orders in queue.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==============================================================
             FILTERED OR UNIFIED GRID VIEW
             ============================================================== */
          <div className="space-y-4">
            {typeFilter !== "All" && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                  typeFilter === "Boost"
                    ? "bg-[#EEF2FF] border-[#BFDBFE]"
                    : typeFilter === "Ads"
                    ? "bg-[#FAF5FF] border-[#E9D5FF]"
                    : "bg-[#FFFBEB] border-[#FDE68A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-800">
                    Showing {getCategoryDisplayName(typeFilter)} Category
                  </span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold shadow-2xs">
                    {filteredPendingOrders.length} Orders
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCategoryPrompts(
                      filteredPendingOrders,
                      getCategoryDisplayName(typeFilter)
                    )
                  }
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All {getCategoryDisplayName(typeFilter)} Prompts</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPendingOrders.map(renderOrderCard)}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
