"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Megaphone,
  Clock,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Eye,
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreVertical,
  HelpCircle,
  Lightbulb,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Info,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order } from "@/types";

export default function DashboardPage() {
  const {
    orders,
    liveMetrics,
    syncMetaMetrics,
    isSyncing,
    setSelectedOrderForModal,
    setIsSupportModalOpen,
    setSelectedOrderForRenew,
    setIsRenewModalOpen,
  } = usePortal();

  const [dateFilter, setDateFilter] = useState("Oct 16, 2025");
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  // Calculate summary counts dynamically from orders
  const activeAdsCount = orders.filter((o) => o.status === "Active").length;
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
  const completedOrdersCount = orders.filter((o) => o.status === "Completed").length;
  const totalSpentUSD = orders
    .filter((o) => o.status === "Active" || o.status === "Completed" || o.status === "Paused")
    .reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0);
  const totalSpentBDT = Math.round(totalSpentUSD * 125);

  // Take the 4 most recent orders for dashboard display
  const recentOrders = orders.slice(0, 4);

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
              Welcome back, Tafsin Ahmed <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Here&apos;s a quick overview of your ads and recent activity.
            </p>
          </div>

          {/* Date Selector Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const dates = ["Today", "Oct 16, 2025", "Last 7 Days", "This Month"];
                const nextIdx = (dates.indexOf(dateFilter) + 1) % dates.length;
                setDateFilter(dates[nextIdx]);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E7ECF3] rounded-xl text-xs font-semibold text-[#172033] hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{dateFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Ads */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3.5 bg-[#0866FF] rounded-full" />
                  <span className="text-xs text-[#667085] font-medium truncate">Active Ads</span>
                </div>
                <div className="text-2xl font-bold text-[#172033] mt-0.5 tracking-tight">
                  {activeAdsCount}
                </div>
                <div className="text-[11px] text-[#12A875] font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A875] animate-pulse" />
                  Running now
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pending Orders */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFF4E5] text-[#F59E0B] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-[#667085] font-medium truncate block">Pending Orders</span>
                <div className="text-2xl font-bold text-[#172033] mt-0.5 tracking-tight">
                  {pendingOrdersCount}
                </div>
                <div className="text-[11px] text-[#D97706] font-semibold mt-0.5">
                  Awaiting payment
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#E8F8F2] text-[#12A875] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-[#667085] font-medium truncate block">Completed</span>
                <div className="text-2xl font-bold text-[#172033] mt-0.5 tracking-tight">
                  {completedOrdersCount}
                </div>
                <div className="text-[11px] text-[#12A875] font-semibold mt-0.5">
                  This month
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Total Spent */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F0EDFF] text-[#6366F1] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-[#667085] font-medium truncate block">Total Spent</span>
                <div className="text-2xl font-bold text-[#172033] mt-0.5 tracking-tight">
                  ${totalSpentUSD.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#667085] font-medium mt-0.5 truncate">
                  ≈ ৳{totalSpentBDT.toLocaleString()} (BDT)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Left (Recent Orders) + Right (New Boost & Performance) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Recent Orders */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-2xs p-5 md:p-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E7ECF3]">
                <h2 className="text-base font-bold text-[#172033] tracking-tight">
                  Recent Orders
                </h2>
                <Link
                  href="/my-orders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0866FF] hover:text-[#0052CC] transition-colors group"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Order Rows */}
              <div className="divide-y divide-[#E7ECF3]">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#F6F8FC]/50 px-2 rounded-xl transition-colors"
                  >
                    {/* Thumbnail & Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <Image
                          src={order.thumbnail}
                          alt={order.campaignName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#172033] truncate">
                          {order.campaignName}
                        </h3>
                        <div className="text-xs text-[#667085] font-medium flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[#0866FF] font-semibold">#{order.id}</span>
                          <span>•</span>
                          <span>{order.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle stats & Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 pl-15 sm:pl-0">
                      {/* Budget */}
                      <div className="text-left sm:text-right">
                        <div className="text-[11px] text-[#667085] font-medium">Budget</div>
                        <div className="text-xs font-bold text-[#172033]">
                          ${order.dailyBudgetUSD.toFixed(2)}/day
                        </div>
                      </div>

                      {/* Total */}
                      <div className="text-left sm:text-right">
                        <div className="text-[11px] text-[#667085] font-medium">Total</div>
                        <div className="text-xs font-bold text-[#172033]">
                          ${order.totalBudgetUSD.toFixed(2)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="min-w-[80px] text-right">
                        <StatusBadge status={order.status} />
                      </div>

                      {/* View Button & Actions */}
                      <div className="flex items-center gap-1.5 relative">
                        <button
                          onClick={() => setSelectedOrderForModal(order)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-[#E7ECF3] rounded-lg shadow-2xs transition-all hover:border-slate-300"
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            setActiveMenuOrderId(
                              activeMenuOrderId === order.id ? null : order.id
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          aria-label="More order actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Order Row Dropdown */}
                        {activeMenuOrderId === order.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#E7ECF3] py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setSelectedOrderForModal(order);
                                setActiveMenuOrderId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC] hover:text-[#0866FF]"
                            >
                              View Full Details
                            </button>
                            {order.isEligibleForRenew && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForRenew(order);
                                  setIsRenewModalOpen(true);
                                  setActiveMenuOrderId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC] hover:text-[#0866FF]"
                              >
                                Renew Boost
                              </button>
                            )}
                            <a
                              href={order.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveMenuOrderId(null)}
                              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#F6F8FC]"
                            >
                              <span>Open on Meta</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): CTA & Live Performance */}
          <div className="lg:col-span-4 space-y-4">
            {/* Start a New Boost Card */}
            <div className="bg-gradient-to-br from-[#0866FF] to-[#0052CC] p-5 sm:p-6 rounded-2xl text-white shadow-lg shadow-[#0866FF]/20 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 ring-4 ring-white/10">
                    <Megaphone className="w-5 h-5 text-white stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Start a New Boost
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-white/90 leading-relaxed font-normal">
                  Create a new order and grow your business with Meta Ads.
                </p>

                <Link
                  href="/create-order"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#0866FF] hover:bg-slate-50 font-bold text-xs rounded-xl shadow-md transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Create Order</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Decorative background shapes */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Live Performance Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                  Live Performance
                </h3>
                <button
                  onClick={syncMetaMetrics}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-[#0866FF] transition-colors disabled:opacity-50"
                  title="Click to fetch live Meta metrics"
                >
                  <span className="w-2 h-2 rounded-full bg-[#12A875] animate-live-pulse" />
                  <span>{isSyncing ? "Syncing..." : liveMetrics.lastSynced}</span>
                  <RefreshCw
                    className={`w-3 h-3 text-slate-400 ${
                      isSyncing ? "animate-spin text-[#0866FF]" : ""
                    }`}
                  />
                </button>
              </div>

              {/* 2x2 Mini Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Metric 1: Reach */}
                <div className="p-3 bg-[#F6F8FC] rounded-xl border border-[#E7ECF3]/70">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center mb-2">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-[#667085] font-medium">Reach</div>
                  <div className="text-base font-bold text-[#172033] mt-0.5">
                    {(liveMetrics.reach / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[10px] text-[#12A875] font-semibold mt-0.5 flex items-center gap-0.5">
                    <span>↑ {liveMetrics.reachGrowth}%</span>
                  </div>
                </div>

                {/* Metric 2: Impressions */}
                <div className="p-3 bg-[#F6F8FC] rounded-xl border border-[#E7ECF3]/70">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center mb-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-[#667085] font-medium">Impressions</div>
                  <div className="text-base font-bold text-[#172033] mt-0.5">
                    {(liveMetrics.impressions / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[10px] text-[#12A875] font-semibold mt-0.5 flex items-center gap-0.5">
                    <span>↑ {liveMetrics.impressionsGrowth}%</span>
                  </div>
                </div>

                {/* Metric 3: Messages */}
                <div className="p-3 bg-[#F6F8FC] rounded-xl border border-[#E7ECF3]/70">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-[#667085] font-medium">Messages</div>
                  <div className="text-base font-bold text-[#172033] mt-0.5">
                    {liveMetrics.messages}
                  </div>
                  <div className="text-[10px] text-[#12A875] font-semibold mt-0.5 flex items-center gap-0.5">
                    <span>↑ {liveMetrics.messagesGrowth}%</span>
                  </div>
                </div>

                {/* Metric 4: Spend */}
                <div className="p-3 bg-[#F6F8FC] rounded-xl border border-[#E7ECF3]/70">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center mb-2">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-[#667085] font-medium">Spend</div>
                  <div className="text-base font-bold text-[#172033] mt-0.5">
                    ${liveMetrics.spend.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#12A875] font-semibold mt-0.5 flex items-center gap-0.5">
                    <span>↑ {liveMetrics.spendGrowth}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ads in Progress Note Card */}
            <div className="bg-white p-4 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0866FF] text-white flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172033]">Ads in Progress</h4>
                </div>
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                Your ads are being managed manually by our team. Data is fetched from Meta.
              </p>
              <button
                onClick={() => setShowHowItWorksModal(true)}
                className="w-full text-left inline-flex items-center justify-between text-xs font-semibold text-[#0866FF] hover:underline pt-1"
              >
                <span>How it works?</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Banner: Support Assistance */}
        <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#172033]">
                Need to get better results?
              </h4>
              <p className="text-xs text-[#667085] mt-0.5">
                You can always contact our support team for help with your campaign or payment.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-slate-50 border border-[#E7ECF3] text-xs font-bold text-[#172033] hover:text-[#0866FF] hover:border-[#0866FF]/40 rounded-xl shadow-2xs transition-colors shrink-0"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* "How It Works" Informational Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowHowItWorksModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10 border border-[#E7ECF3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0866FF] text-white flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">How Meta Ads Management Works</h3>
                <p className="text-xs text-slate-400">Professional manual optimization</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>1. Order Placement:</strong> You submit your Facebook post link with your preferred USD budget and target objectives.
              </p>
              <p>
                <strong>2. Manual Execution:</strong> Our certified Meta Ad Specialists set up your campaign inside Meta Ads Manager with tailored audience targeting, bidding strategies, and placements.
              </p>
              <p>
                <strong>3. Automated Live Sync:</strong> Once Meta activates delivery, verified performance metrics (Reach, Impressions, Messages) stream directly to this portal.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-[#0866FF] text-white rounded-xl hover:bg-[#0052CC]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
