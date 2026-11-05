"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Sliders,
  Save,
  Loader2,
  CheckCircle2,
  Sun,
  Moon,
  Layers,
  ShoppingBag,
  Sparkles,
  BarChart3,
  Percent,
  Check,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Wallet,
  ArrowDownRight,
  ExternalLink,
  Users,
  Building,
  HelpCircle,
  Clock,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { Order, OrderStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ClientAvatar } from "@/components/ui/ClientAvatar";

type Timeframe = "today" | "week" | "month" | "all";

export default function AdminAnalyticsPage() {
  const {
    orders,
    exchangeRateBDT,
    dollarBuyRateBDT,
    updateRates,
    refreshOrders,
    setSelectedOrderForModal,
  } = usePortal();

  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [customBuyRate, setCustomBuyRate] = useState<string>(
    dollarBuyRateBDT ? String(dollarBuyRateBDT) : "130"
  );
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateSavedSuccess, setRateSavedSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState<"all" | "day" | "night">("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep local input in sync if context updates
  useEffect(() => {
    if (dollarBuyRateBDT) {
      setCustomBuyRate(String(dollarBuyRateBDT));
    }
  }, [dollarBuyRateBDT]);

  const activeBuyRate = parseFloat(customBuyRate) || dollarBuyRateBDT || 130;

  // Manual refresh from DB
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter orders by timeframe
  const filteredOrders = useMemo(() => {
    if (!mounted) {
      return orders.filter((order) => order.status !== "Rejected");
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((order) => {
      // Exclude rejected orders from financial profit calculations
      if (order.status === "Rejected") return false;

      let orderTime = 0;
      if (order.createdAt) {
        const parsed = new Date(order.createdAt).getTime();
        if (!isNaN(parsed)) orderTime = parsed;
      }

      if (timeframe === "today") return orderTime >= todayStart;
      if (timeframe === "week") return orderTime >= weekAgo;
      if (timeframe === "month") return orderTime >= monthStart;
      return true; // "all"
    });
  }, [orders, timeframe, mounted]);

  // Aggregate financials
  const stats = useMemo(() => {
    let totalUSD = 0;
    let totalRevenueBDT = 0;
    let totalCostBDT = 0;

    let dayShiftOrders = 0;
    let dayShiftUSD = 0;
    let dayShiftRevenueBDT = 0;
    let dayShiftCostBDT = 0;

    let nightShiftOrders = 0;
    let nightShiftUSD = 0;
    let nightShiftRevenueBDT = 0;
    let nightShiftCostBDT = 0;

    const clientProfitMap: Record<string, { name: string; email?: string; usd: number; revenue: number; cost: number; profit: number; ordersCount: number }> = {};
    const categoryMap: Record<string, { count: number; usd: number; revenue: number; cost: number; profit: number }> = {
      "Boost Post": { count: 0, usd: 0, revenue: 0, cost: 0, profit: 0 },
      "Ads Campaign": { count: 0, usd: 0, revenue: 0, cost: 0, profit: 0 },
      "Promotion": { count: 0, usd: 0, revenue: 0, cost: 0, profit: 0 },
    };

    filteredOrders.forEach((order) => {
      const usd = Number(order.totalBudgetUSD) || 0;
      const isAds = (order.postType || "").toLowerCase().includes("ads") || (order.postType || "").toLowerCase().includes("campaign");
      const orderRate = isAds ? 155 : exchangeRateBDT || 150;
      const revBDT = Number(order.paidAmountBDT) || Math.round(usd * orderRate);
      const costBDT = Math.round(usd * activeBuyRate);
      const profitBDT = revBDT - costBDT;

      totalUSD += usd;
      totalRevenueBDT += revBDT;
      totalCostBDT += costBDT;

      // Shift audit
      const isNight =
        order.shift?.toLowerCase().includes("night") ||
        order.addedBy?.shift?.toLowerCase().includes("night");

      if (isNight) {
        nightShiftOrders++;
        nightShiftUSD += usd;
        nightShiftRevenueBDT += revBDT;
        nightShiftCostBDT += costBDT;
      } else {
        dayShiftOrders++;
        dayShiftUSD += usd;
        dayShiftRevenueBDT += revBDT;
        dayShiftCostBDT += costBDT;
      }

      // Category breakdown
      const cat = isAds ? "Ads Campaign" : (order.postType === "Promotion" ? "Promotion" : "Boost Post");
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, usd: 0, revenue: 0, cost: 0, profit: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].usd += usd;
      categoryMap[cat].revenue += revBDT;
      categoryMap[cat].cost += costBDT;
      categoryMap[cat].profit += profitBDT;

      // Client leaderboard
      const clientKey = order.clientEmail || order.businessName || order.clientName || "Direct Clients";
      const clientDisplayName = order.businessName || order.clientName || order.facebookPageName || clientKey;
      if (!clientProfitMap[clientKey]) {
        clientProfitMap[clientKey] = {
          name: clientDisplayName,
          email: order.clientEmail,
          usd: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          ordersCount: 0,
        };
      }
      clientProfitMap[clientKey].usd += usd;
      clientProfitMap[clientKey].revenue += revBDT;
      clientProfitMap[clientKey].cost += costBDT;
      clientProfitMap[clientKey].profit += profitBDT;
      clientProfitMap[clientKey].ordersCount += 1;
    });

    const netProfitBDT = totalRevenueBDT - totalCostBDT;
    const profitMarginPercent = totalRevenueBDT > 0 ? ((netProfitBDT / totalRevenueBDT) * 100).toFixed(1) : "0.0";
    const avgProfitPerUSD = totalUSD > 0 ? (netProfitBDT / totalUSD).toFixed(1) : (exchangeRateBDT - activeBuyRate).toFixed(1);
    const avgProfitPerOrder = filteredOrders.length > 0 ? Math.round(netProfitBDT / filteredOrders.length) : 0;

    const dayShiftProfitBDT = dayShiftRevenueBDT - dayShiftCostBDT;
    const nightShiftProfitBDT = nightShiftRevenueBDT - nightShiftCostBDT;

    // Top profitable clients
    const topClients = Object.values(clientProfitMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    return {
      orderCount: filteredOrders.length,
      totalUSD,
      totalRevenueBDT,
      totalCostBDT,
      netProfitBDT,
      profitMarginPercent,
      avgProfitPerUSD,
      avgProfitPerOrder,
      dayShiftOrders,
      dayShiftUSD,
      dayShiftRevenueBDT,
      dayShiftCostBDT,
      dayShiftProfitBDT,
      nightShiftOrders,
      nightShiftUSD,
      nightShiftRevenueBDT,
      nightShiftCostBDT,
      nightShiftProfitBDT,
      categoryMap,
      topClients,
    };
  }, [filteredOrders, activeBuyRate, exchangeRateBDT]);

  // Handle saving new dollar buy rate to DB
  const handleSaveBuyRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRate = parseFloat(customBuyRate);
    if (isNaN(newRate) || newRate <= 0) return;

    setIsSavingRate(true);
    try {
      await updateRates({ dollarBuyRateBDT: newRate });
      setRateSavedSuccess(true);
      setTimeout(() => setRateSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to update dollar buy rate:", err);
    } finally {
      setIsSavingRate(false);
    }
  };

  // Filtered orders for detailed table
  const tableOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      // Shift filter
      const isNight =
        order.shift?.toLowerCase().includes("night") ||
        order.addedBy?.shift?.toLowerCase().includes("night");
      if (shiftFilter === "day" && isNight) return false;
      if (shiftFilter === "night" && !isNight) return false;

      // Format filter
      if (formatFilter !== "all") {
        const isAds = (order.postType || "").toLowerCase().includes("ads");
        const isBoost = (order.postType || "").toLowerCase().includes("boost");
        const isPromo = (order.postType || "").toLowerCase().includes("promo");
        if (formatFilter === "ads" && !isAds) return false;
        if (formatFilter === "boost" && !isBoost) return false;
        if (formatFilter === "promo" && !isPromo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = order.id?.toLowerCase().includes(q);
        const matchesCampaign = order.campaignName?.toLowerCase().includes(q);
        const matchesClient = order.clientName?.toLowerCase().includes(q) || order.businessName?.toLowerCase().includes(q);
        const matchesTrx = order.transactionId?.toLowerCase().includes(q);
        if (!matchesId && !matchesCampaign && !matchesClient && !matchesTrx) return false;
      }

      return true;
    });
  }, [filteredOrders, shiftFilter, formatFilter, searchQuery]);

  const standardSpread = exchangeRateBDT - activeBuyRate;
  const adsSpread = 155 - activeBuyRate;

  return (
    <AdminLayout pageTitle="System Financial & Profit Analytics">
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <TrendingUp className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#121826]">
                  Agency Financial Profit Analytics & System Accounting
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>সম্পূর্ণ সিস্টেম প্রফিট হিসাব</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                রিয়েল-টাইম ক্লায়েন্ট সেলস, ডলার ক্রয় খরচ এবং প্রতিটি ক্যাম্পেইনের আসল মুনাফা পর্যবেক্ষণ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Timeframe Selector */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200/80">
              {(
                [
                  { id: "today", label: "আজ (Today)" },
                  { id: "week", label: "চলতি সপ্তাহ (7D)" },
                  { id: "month", label: "চলতি মাস (30D)" },
                  { id: "all", label: "সর্বমোট (All Time)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeframe(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeframe === tab.id
                      ? "bg-white text-[#3858F6] shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh financial data from database"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200/80"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0866FF]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Agency Dollar Buying Cost Rate Configurator & Spread Banner */}
        <div className="bg-white text-slate-900 rounded-[26px] p-5 sm:p-6 border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Agency Dollar Buying Cost Rate (আপনার ডলার ক্রয় খরচ রেট)
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    ✓ Live Dynamic Engine
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
                আপনি প্রতি ডলার কত টাকায় ক্রয় করেন এখানে সেট করুন। আপনার সেট করা রেটের ভিত্তিতে ক্লায়েন্টের পেমেন্ট থেকে মেটা অ্যাড খরচ বাদ দিয়ে আসল লাভ (Net Profit) স্বয়ংক্রিয়ভাবে হিসাব করা হচ্ছে।
              </p>
            </div>

            {/* Input & Save Form */}
            <form onSubmit={handleSaveBuyRate} className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2 text-sm text-slate-900 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <span className="text-slate-500 font-bold mr-1.5">৳</span>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  max="300"
                  value={customBuyRate}
                  onChange={(e) => setCustomBuyRate(e.target.value)}
                  placeholder="130"
                  className="w-20 bg-transparent text-slate-900 font-mono font-black focus:outline-none text-base"
                />
                <span className="text-slate-500 text-xs font-semibold ml-1.5">/ USD</span>
              </div>

              <button
                type="submit"
                disabled={isSavingRate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingRate ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : rateSavedSuccess ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{rateSavedSuccess ? "Saved to DB!" : "Update & Recalculate"}</span>
              </button>
            </form>
          </div>

          {/* Quick Rate & Spread Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-semibold">Agency Buy Rate (ক্রয় রেট)</span>
              <span className="text-base font-extrabold font-mono text-emerald-700">
                ৳{activeBuyRate.toFixed(2)} BDT <span className="text-xs font-sans text-slate-400 font-normal">/ USD</span>
              </span>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-semibold">Client Selling Rate (বিক্রি রেট)</span>
              <span className="text-base font-extrabold font-mono text-blue-700">
                ৳{exchangeRateBDT} (Boost) • ৳155 (Ads)
              </span>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-semibold">Profit Spread per Dollar (প্রতি ডলারে লাভ)</span>
              <span className="text-base font-extrabold font-mono text-amber-700">
                +৳{standardSpread >= 0 ? standardSpread.toFixed(1) : 0} (Boost) • +৳{adsSpread.toFixed(1)} (Ads)
              </span>
            </div>
          </div>
        </div>

        {/* 6 High-Impact Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Net Profit (Hero) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/15 flex flex-col justify-between min-h-[145px] sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-100 font-bold uppercase tracking-wider">
                Total Net Profit (সর্বমোট নিট লাভ)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white">
                {stats.profitMarginPercent}% Margin
              </span>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                ৳{stats.netProfitBDT.toLocaleString()}{" "}
                <span className="text-sm font-sans font-bold">BDT</span>
              </div>
              <div className="text-xs text-emerald-100 font-medium mt-1">
                ≈ ৳{stats.avgProfitPerUSD} BDT Profit / $1 USD Boosted
              </div>
            </div>

            <div className="text-[11px] text-emerald-100/90 font-medium pt-2 border-t border-white/10 flex items-center justify-between">
              <span>Timeframe: {timeframe.toUpperCase()}</span>
              <span>{stats.orderCount} Orders Counted</span>
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Total Revenue (মোট জমা)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0866FF] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                ৳{stats.totalRevenueBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                From {stats.orderCount} orders
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>100% Client Paid</span>
              <span className="text-[#0866FF] font-bold">BDT Inflow</span>
            </div>
          </div>

          {/* Card 3: Total Dollar Cost */}
          <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Dollar Cost (ক্রয় খরচ)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                ৳{stats.totalCostBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                @ ৳{activeBuyRate} / USD rate
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Direct Ad Outflow</span>
              <span className="text-rose-600 font-bold">Spent</span>
            </div>
          </div>

          {/* Card 4: Ad Spend Volume USD */}
          <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Ad Volume ($ USD)
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                ${stats.totalUSD.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total Meta Ad Budget
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Delivered</span>
              <span className="text-purple-600 font-bold">Meta Spend</span>
            </div>
          </div>

          {/* Card 5: Average Profit per Order */}
          <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Avg Profit / Order
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                ৳{stats.avgProfitPerOrder.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Per campaign order
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Order Yield</span>
              <span className="text-amber-600 font-bold">Average</span>
            </div>
          </div>
        </div>

        {/* 2 Grid Columns: Shift Profit Breakdown + Format Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Shift Profit Intelligence (Day vs Night) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Shift-wise Profit Audit (শিফট ভিত্তিক আসল লাভ)
                  </h4>
                  <p className="text-xs text-slate-400">Day Shift vs Night Shift Profit Breakdown</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Day Shift Box */}
              <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-amber-950 block">Day Shift (10 AM - 08 PM)</span>
                      <span className="text-[10px] text-amber-800">সকাল শিফট</span>
                    </div>
                  </div>
                  <span className="text-xs bg-white text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-200 shadow-3xs">
                    {stats.dayShiftOrders} Boosts
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    +৳{stats.dayShiftProfitBDT.toLocaleString()}{" "}
                    <span className="text-xs font-sans font-bold text-slate-600">Net Profit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-200/80 text-[11px] text-amber-900 font-medium">
                    <div>
                      <span className="text-amber-700 block text-[10px]">Revenue (জমা):</span>
                      <span className="font-bold font-mono">৳{stats.dayShiftRevenueBDT.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 block text-[10px]">Cost (খরচ):</span>
                      <span className="font-bold font-mono">৳{stats.dayShiftCostBDT.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-700/80 mt-1.5 font-medium">
                    Delivered Volume: ${stats.dayShiftUSD.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Night Shift Box */}
              <div className="bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] p-5 rounded-2xl border border-purple-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-purple-950 block">Night Shift (07 PM - 02:30 AM)</span>
                      <span className="text-[10px] text-purple-800">রাত শিফট</span>
                    </div>
                  </div>
                  <span className="text-xs bg-white text-purple-800 font-bold px-2.5 py-1 rounded-full border border-purple-200 shadow-3xs">
                    {stats.nightShiftOrders} Boosts
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    +৳{stats.nightShiftProfitBDT.toLocaleString()}{" "}
                    <span className="text-xs font-sans font-bold text-slate-600">Net Profit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-purple-200/80 text-[11px] text-purple-900 font-medium">
                    <div>
                      <span className="text-purple-700 block text-[10px]">Revenue (জমা):</span>
                      <span className="font-bold font-mono">৳{stats.nightShiftRevenueBDT.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 block text-[10px]">Cost (খরচ):</span>
                      <span className="font-bold font-mono">৳{stats.nightShiftCostBDT.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-purple-700/80 mt-1.5 font-medium">
                    Delivered Volume: ${stats.nightShiftUSD.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Format Breakdown & Top Profit Clients */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Category Profit Share (ক্যাটাগরি লাভ)
                  </h4>
                  <p className="text-xs text-slate-400">Campaign format contribution</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(stats.categoryMap).map(([catName, data]) => {
                const catProfitShare =
                  stats.netProfitBDT > 0 ? Math.max(0, Math.round((data.profit / stats.netProfitBDT) * 100)) : 0;
                return (
                  <div key={catName} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{catName}</span>
                      <span className="font-mono font-bold text-emerald-600">
                        +৳{data.profit.toLocaleString()} ({catProfitShare}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, catProfitShare)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{data.count} Orders • ${data.usd.toFixed(2)} USD</span>
                      <span>Rev: ৳{data.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order-by-Order Accounting Breakdown Table */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#121826] text-base sm:text-lg">
                  Order-by-Order System Profit Breakdown (প্রতিটি অর্ডারের লাভ-ক্ষতির হিসাব)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#EEF2FF] text-[#3858F6] border border-blue-100">
                  {tableOrders.length} Orders
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                প্রতিটি অর্ডারে কত ডলার বাজেট ছিল, ক্লায়েন্ট কত টাকা দিয়েছে, আপনার ক্রয় খরচ কত হয়েছে এবং কত টাকা নেট লাভ এসেছে।
              </p>
            </div>

            {/* Table Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order ID, campaign, client..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0866FF] w-48 sm:w-60"
                />
              </div>

              {/* Shift Filter */}
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value as any)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="all">All Shifts</option>
                <option value="day">☀️ Day Shift</option>
                <option value="night">🌙 Night Shift</option>
              </select>

              {/* Format Filter */}
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="boost">Boost Post</option>
                <option value="ads">Ads Campaign</option>
                <option value="promo">Promotion</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Campaign</th>
                  <th className="py-3.5 px-3">Client / Brand</th>
                  <th className="py-3.5 px-3">Shift & Source</th>
                  <th className="py-3.5 px-3">Ad Budget ($ USD)</th>
                  <th className="py-3.5 px-3">Client Paid (Revenue)</th>
                  <th className="py-3.5 px-3">Agency Cost (ডলার খরচ)</th>
                  <th className="py-3.5 px-4 text-right">Net Profit (আসল লাভ)</th>
                  <th className="py-3.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                        <span>No campaign orders found in this timeframe.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tableOrders.map((order) => {
                    const usd = Number(order.totalBudgetUSD) || 0;
                    const isAds = (order.postType || "").toLowerCase().includes("ads") || (order.postType || "").toLowerCase().includes("campaign");
                    const orderRate = isAds ? 155 : exchangeRateBDT || 150;
                    const revBDT = Number(order.paidAmountBDT) || Math.round(usd * orderRate);
                    const costBDT = Math.round(usd * activeBuyRate);
                    const profitBDT = revBDT - costBDT;
                    const margin = revBDT > 0 ? ((profitBDT / revBDT) * 100).toFixed(1) : "0.0";

                    const isNight =
                      order.shift?.toLowerCase().includes("night") ||
                      order.addedBy?.shift?.toLowerCase().includes("night");

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* ID & Campaign */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <Image
                                src={order.thumbnail || "/images/placeholder.jpg"}
                                alt={order.campaignName}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#0866FF] text-[11px]">
                                  #{order.id}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {order.postType || "Boost"}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={order.campaignName}>
                                {order.campaignName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client / Page */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 text-xs truncate max-w-[140px]">
                            {order.businessName || order.clientName || "Direct Client"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {order.facebookPageName || order.clientEmail || "Facebook Page"}
                          </div>
                        </td>

                        {/* Shift & Source */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isNight
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {isNight ? <Moon className="w-2.5 h-2.5 text-purple-600" /> : <Sun className="w-2.5 h-2.5 text-amber-600" />}
                            <span>{isNight ? "Night Shift" : "Day Shift"}</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                          </div>
                        </td>

                        {/* Ad Budget USD */}
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900 text-xs font-mono">
                            ${usd.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {order.durationDays || 1} Days
                          </div>
                        </td>

                        {/* Client Paid BDT */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#0866FF] text-xs font-mono">
                            ৳{revBDT.toLocaleString()} BDT
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Rate: ৳{orderRate}/$
                          </div>
                        </td>

                        {/* Dollar Cost BDT */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-rose-600 text-xs font-mono">
                            ৳{costBDT.toLocaleString()} BDT
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Buy: ৳{activeBuyRate}/$
                          </div>
                        </td>

                        {/* Net Profit */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-black text-emerald-600 text-sm font-mono">
                            +৳{profitBDT.toLocaleString()} BDT
                          </div>
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {margin}% Profit
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForModal(order)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Inspect complete order specifications"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

