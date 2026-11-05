"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  ChevronRight,
  Info,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { Order } from "@/types";

type Timeframe = "today" | "week" | "month" | "all";

export const AdminProfitAnalytics: React.FC = () => {
  const {
    orders,
    exchangeRateBDT,
    dollarBuyRateBDT,
    updateRates,
  } = usePortal();

  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [customBuyRate, setCustomBuyRate] = useState<string>(
    dollarBuyRateBDT ? String(dollarBuyRateBDT) : "130"
  );
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateSavedSuccess, setRateSavedSuccess] = useState(false);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keep local input in sync if context updates
  React.useEffect(() => {
    if (dollarBuyRateBDT) {
      setCustomBuyRate(String(dollarBuyRateBDT));
    }
  }, [dollarBuyRateBDT]);

  const activeBuyRate = parseFloat(customBuyRate) || dollarBuyRateBDT || 130;

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
      // Exclude rejected orders from financial profit analytics
      if (order.status === "Rejected") return false;

      // Parse order date
      let orderTime = 0;
      if (order.createdAt) {
        const parsed = new Date(order.createdAt).getTime();
        if (!isNaN(parsed)) orderTime = parsed;
      }

      if (timeframe === "today") {
        return orderTime >= todayStart;
      }
      if (timeframe === "week") {
        return orderTime >= weekAgo;
      }
      if (timeframe === "month") {
        return orderTime >= monthStart;
      }
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

    const clientProfitMap: Record<string, { name: string; usd: number; revenue: number; profit: number }> = {};
    const categoryMap: Record<string, { count: number; usd: number; revenue: number; profit: number }> = {
      "Boost Post": { count: 0, usd: 0, revenue: 0, profit: 0 },
      "Ads Campaign": { count: 0, usd: 0, revenue: 0, profit: 0 },
      "Promotion": { count: 0, usd: 0, revenue: 0, profit: 0 },
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

      // Shift classification
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
        categoryMap[cat] = { count: 0, usd: 0, revenue: 0, profit: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].usd += usd;
      categoryMap[cat].revenue += revBDT;
      categoryMap[cat].profit += profitBDT;

      // Client attribution
      const clientKey = order.clientEmail || order.businessName || order.clientName || "Direct Clients";
      const clientDisplayName = order.businessName || order.clientName || order.facebookPageName || clientKey;
      if (!clientProfitMap[clientKey]) {
        clientProfitMap[clientKey] = { name: clientDisplayName, usd: 0, revenue: 0, profit: 0 };
      }
      clientProfitMap[clientKey].usd += usd;
      clientProfitMap[clientKey].revenue += revBDT;
      clientProfitMap[clientKey].profit += profitBDT;
    });

    const netProfitBDT = totalRevenueBDT - totalCostBDT;
    const profitMarginPercent = totalRevenueBDT > 0 ? ((netProfitBDT / totalRevenueBDT) * 100).toFixed(1) : "0.0";
    const avgProfitPerUSD = totalUSD > 0 ? (netProfitBDT / totalUSD).toFixed(1) : (exchangeRateBDT - activeBuyRate).toFixed(1);

    const dayShiftProfitBDT = dayShiftRevenueBDT - dayShiftCostBDT;
    const nightShiftProfitBDT = nightShiftRevenueBDT - nightShiftCostBDT;

    // Top 3 clients by profit
    const topClients = Object.values(clientProfitMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3);

    return {
      orderCount: filteredOrders.length,
      totalUSD,
      totalRevenueBDT,
      totalCostBDT,
      netProfitBDT,
      profitMarginPercent,
      avgProfitPerUSD,
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

  // Spread between selling rate and buying cost
  const standardSpread = exchangeRateBDT - activeBuyRate;
  const adsSpread = 155 - activeBuyRate;

  return (
    <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
      {/* Top Header: Title, Period Filter & Live Margin Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#3858F6] border border-[#C7D9FE] flex items-center justify-center font-black shadow-sm shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-[#121826] text-base sm:text-lg">
                Financial Analytics & Profit Intelligence
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#3858F6] border border-[#C7D9FE] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#3858F6]" />
                <span>Live Profit Engine</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              রিয়েল-টাইম ক্লায়েন্ট সেলস, ডলার ক্রয় খরচ এবং নেট প্রফিট মনিটরিং
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Filter Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100/80 p-1 text-xs font-bold border border-slate-200/60">
            {(
              [
                { id: "today", label: "আজ (Today)" },
                { id: "week", label: "চলতি সপ্তাহ (7D)" },
                { id: "month", label: "চলতি মাস (30D)" },
                { id: "all", label: "সর্বমোট (All)" },
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

          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#3858F6]/25 transition-all cursor-pointer"
            title="Open comprehensive system profit accounting table"
          >
            <span>Full Accounting Table</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Dollar Buy/Cost Rate Setter & Spread Card */}
      <div className="bg-[#F8FAFC] text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#3858F6] border border-[#C7D9FE] flex items-center justify-center shrink-0">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Agency Dollar Buying Cost Rate (ডলার ক্রয় রেট)
              </span>
              <span className="text-[9px] font-bold text-[#3858F6] bg-[#EEF2FF] px-2 py-0.5 rounded-full border border-[#C7D9FE]">
                Live Dynamic
              </span>
            </div>
            <p className="text-xs text-slate-500">
              আপনি প্রতি ডলার কত রেটে ক্রয় করেন সেট করুন। এর ভিত্তিতে প্রতিটি বুস্ট ও ক্যাম্পেইনের আসল লাভ হিসাব করা হয়।
            </p>
          </div>

          <form onSubmit={handleSaveBuyRate} className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus-within:border-[#3858F6] focus-within:ring-2 focus-within:ring-[#3858F6]/10">
              <span className="text-slate-500 font-bold mr-1">৳</span>
              <input
                type="number"
                step="0.25"
                min="1"
                value={customBuyRate}
                onChange={(e) => setCustomBuyRate(e.target.value)}
                placeholder="130"
                className="w-16 bg-transparent text-slate-900 font-mono font-bold focus:outline-none text-xs"
              />
              <span className="text-slate-400 text-[11px] font-medium ml-1">/ USD</span>
            </div>

            <button
              type="submit"
              disabled={isSavingRate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#3858F6]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingRate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : rateSavedSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{rateSavedSuccess ? "Saved!" : "Save Rate"}</span>
            </button>

            {/* Live Spread Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-white border border-[#C7D9FE] text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-3xs">
              <span className="text-[#3858F6] font-medium">Spread:</span>
              <span className="font-mono text-[#3858F6] font-bold">
                +৳{standardSpread >= 0 ? standardSpread.toFixed(1) : 0} (Boost) • +৳{adsSpread.toFixed(1)} (Ads)
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Agency Profit (Hero) - Clean White Card with Primary Blue Accent */}
        <div className="p-5 rounded-2xl bg-white border-2 border-[#3858F6] shadow-sm flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Net Agency Profit (মোট লাভ)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EEF2FF] text-[#3858F6] border border-[#C7D9FE]">
              {stats.profitMarginPercent}% Margin
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight font-mono">
              ৳{stats.netProfitBDT.toLocaleString()} <span className="text-xs font-sans font-bold text-[#3858F6]">BDT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              ≈ ৳{stats.avgProfitPerUSD} BDT Profit / $1 USD Boosted
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Period: <strong className="text-slate-700 uppercase">{timeframe}</strong></span>
            <span><strong className="text-slate-700">{stats.orderCount}</strong> Orders Counted</span>
          </div>
        </div>

        {/* Card 2: Total Revenue Collected */}
        <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Total Revenue (ক্লায়েন্ট জমা)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0866FF] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ৳{stats.totalRevenueBDT.toLocaleString()}{" "}
              <span className="text-xs font-sans font-normal text-slate-500">BDT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Client Selling Rate: ৳{exchangeRateBDT} - ৳155 BDT
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Volume: ${stats.totalUSD.toFixed(2)} USD</span>
            <span className="text-[#0866FF] font-bold">100% Collected</span>
          </div>
        </div>

        {/* Card 3: Agency Dollar Purchase Cost */}
        <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Dollar Cost (ডলার ক্রয় খরচ)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ৳{stats.totalCostBDT.toLocaleString()}{" "}
              <span className="text-xs font-sans font-normal text-slate-500">BDT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              ${stats.totalUSD.toFixed(2)} USD × ৳{activeBuyRate} Buying Cost
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Direct Ad Cost</span>
            <span className="text-rose-600 font-bold">Purchase Outflow</span>
          </div>
        </div>

        {/* Card 4: Total Ad Volume & Average */}
        <div className="p-5 rounded-2xl bg-white border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Ad Spend Volume (মোট ডলার)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ${stats.totalUSD.toFixed(2)}{" "}
              <span className="text-xs font-sans font-normal text-slate-500">USD</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Avg ${(stats.orderCount > 0 ? (stats.totalUSD / stats.orderCount).toFixed(2) : "0.00")} USD / Order
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Active Deliveries</span>
            <span className="text-purple-600 font-bold">{stats.orderCount} Orders</span>
          </div>
        </div>
      </div>

      {/* 2 Grid Columns: Shift Profit Breakdown + Format Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Shift Profit Intelligence (Day vs Night) */}
        <div className="lg:col-span-7 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0866FF]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Shift-wise Profit Audit (শিফট ভিত্তিক লাভ)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Day vs Night Shifts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Day Shift Box */}
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-3xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs text-amber-950">Day Shift (10 AM - 08 PM)</span>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {stats.dayShiftOrders} Boosts
                </span>
              </div>

              <div className="pt-1">
                <div className="text-lg font-black text-slate-900 font-mono">
                  +৳{stats.dayShiftProfitBDT.toLocaleString()}{" "}
                  <span className="text-xs font-sans font-bold text-[#3858F6]">Profit</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                  <span>Revenue: ৳{stats.dayShiftRevenueBDT.toLocaleString()}</span>
                  <span>Cost: ৳{stats.dayShiftCostBDT.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Volume: ${stats.dayShiftUSD.toFixed(2)} USD
                </div>
              </div>
            </div>

            {/* Night Shift Box */}
            <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-3xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-xs text-purple-950">Night Shift (07 PM - 02:30 AM)</span>
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  {stats.nightShiftOrders} Boosts
                </span>
              </div>

              <div className="pt-1">
                <div className="text-lg font-black text-slate-900 font-mono">
                  +৳{stats.nightShiftProfitBDT.toLocaleString()}{" "}
                  <span className="text-xs font-sans font-bold text-[#3858F6]">Profit</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                  <span>Revenue: ৳{stats.nightShiftRevenueBDT.toLocaleString()}</span>
                  <span>Cost: ৳{stats.nightShiftCostBDT.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Volume: ${stats.nightShiftUSD.toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Format & Category Profit Breakdown */}
        <div className="lg:col-span-5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3858F6]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Category Contribution (ক্যাটাগরি ভিত্তিক লাভ)
              </h4>
            </div>
          </div>

          <div className="space-y-2.5">
            {Object.entries(stats.categoryMap).map(([catName, data]) => {
              const catProfitShare =
                stats.netProfitBDT > 0 ? Math.max(0, Math.round((data.profit / stats.netProfitBDT) * 100)) : 0;
              return (
                <div key={catName} className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{catName}</span>
                    <span className="font-mono font-bold text-[#3858F6]">
                      +৳{data.profit.toLocaleString()} ({catProfitShare}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#3858F6] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, catProfitShare)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{data.count} Orders • ${data.usd.toFixed(2)} USD</span>
                    <span>Rev: ৳{data.revenue.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

