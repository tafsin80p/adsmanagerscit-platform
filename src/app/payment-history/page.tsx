"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FileText,
  Printer,
  X,
  RefreshCw,
  Copy,
  Check,
  ArrowUpDown,
  Building,
  Smartphone,
  Sparkles,
  ChevronDown,
  Info,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PaymentTransaction, Order } from "@/types";

export default function PaymentHistoryPage() {
  const {
    payments,
    orders,
    profile,
    exchangeRateBDT,
    isLoadingPayments,
    refreshPayments,
    setSelectedOrderForModal,
  } = usePortal();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [methodFilter, setMethodFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-high" | "amount-low">("newest");
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Status List
  const statuses = ["All", "Verified", "Under Review", "Failed"];

  // Gateways
  const methods = ["All", "bKash", "Nagad", "Bank Transfer"];

  // Live KPI Calculations
  const totalVerifiedBDT = useMemo(() => {
    return payments
      .filter((p) => p.status === "Verified")
      .reduce((sum, p) => sum + (p.amountBDT || 0), 0);
  }, [payments]);

  const totalVerifiedUSD = useMemo(() => {
    return payments
      .filter((p) => p.status === "Verified")
      .reduce((sum, p) => sum + (p.amountUSD || 0), 0);
  }, [payments]);

  const pendingVerificationBDT = useMemo(() => {
    return payments
      .filter((p) => p.status === "Under Review")
      .reduce((sum, p) => sum + (p.amountBDT || 0), 0);
  }, [payments]);

  const pendingVerificationUSD = useMemo(() => {
    return payments
      .filter((p) => p.status === "Under Review")
      .reduce((sum, p) => sum + (p.amountUSD || 0), 0);
  }, [payments]);

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: payments.length };
    statuses.forEach((s) => {
      if (s !== "All") {
        counts[s] = payments.filter((p) => p.status === s).length;
      }
    });
    return counts;
  }, [payments]);

  // Counts by method
  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = { All: payments.length };
    methods.forEach((m) => {
      if (m !== "All") {
        counts[m] = payments.filter((p) => p.method === m).length;
      }
    });
    return counts;
  }, [payments]);

  // Handle Refresh Click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPayments();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Copy TRX ID
  const handleCopyTrx = (trx: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trx);
    setCopiedTrx(trx);
    setTimeout(() => setCopiedTrx(null), 2000);
  };

  // Copy full receipt text
  const handleCopyReceiptText = () => {
    if (!selectedReceipt) return;
    const details = `
🧾 INVOICE RECEIPT #${selectedReceipt.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client: ${profile.name} (${profile.businessName})
Campaign: ${selectedReceipt.campaignName}
Order ID: #${selectedReceipt.orderId}
Gateway: ${selectedReceipt.method}
Transaction ID: ${selectedReceipt.transactionId}
${selectedReceipt.senderNumber ? `Sender Number: ${selectedReceipt.senderNumber}\n` : ""}Date: ${selectedReceipt.date}
USD Budget: $${selectedReceipt.amountUSD.toFixed(2)}
Dollar Rate: 1 USD = ৳${selectedReceipt.exchangeRate} BDT
Cashout Charge: ৳${selectedReceipt.serviceChargeBDT || 0} BDT
Total Paid: ৳${selectedReceipt.amountBDT.toLocaleString()} BDT
Status: ${selectedReceipt.status}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHOPNO IT Meta Ads Billing
    `.trim();

    navigator.clipboard.writeText(details);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  // Open related order
  const handleOpenRelatedOrder = (orderId: string) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setSelectedOrderForModal(found);
    }
  };

  // Filtered & Sorted Payments
  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = payments.filter((p) => {
      const matchesSearch =
        !query ||
        p.transactionId.toLowerCase().includes(query) ||
        p.orderId.toLowerCase().includes(query) ||
        p.campaignName.toLowerCase().includes(query) ||
        p.method.toLowerCase().includes(query) ||
        (p.senderNumber && p.senderNumber.toLowerCase().includes(query)) ||
        (p.id && p.id.toLowerCase().includes(query));

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesMethod = methodFilter === "All" || p.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "amount-high") {
        return (b.amountBDT || 0) - (a.amountBDT || 0);
      }
      if (sortBy === "amount-low") {
        return (a.amountBDT || 0) - (b.amountBDT || 0);
      }
      if (sortBy === "oldest") {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return dateA - dateB;
      }
      // default: newest
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [payments, searchQuery, statusFilter, methodFilter, sortBy]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All" || methodFilter !== "All";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setMethodFilter("All");
    setSortBy("newest");
  };

  return (
    <DashboardLayout pageTitle="Payment History">
      <div className="space-y-6 sm:space-y-7">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight">
                Payment & Invoicing History
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live Ledger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Real-time audit log of your bKash, Nagad, and Bank Transfer receipts, verification statuses, and invoices.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Live Exchange Rate Pill */}
            <div className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-[#E9EDF4] text-xs font-bold text-[#121826] shadow-xs">
              <span className="text-[#8A94A6]">Dollar Rate:</span>
              <span className="text-[#3858F6]">1 USD = ৳{exchangeRateBDT} BDT</span>
            </div>

            {/* Live Refresh Trigger */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingPayments}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh payments from database"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3858F6] ${
                  isRefreshing || isLoadingPayments ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Dynamic Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Verified Payments (BDT) */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF8F1] text-[#10B981] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#10B981]">
                Verified
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs text-[#8A94A6] font-medium">Total Paid (BDT)</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                ৳{totalVerifiedBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-0.5 truncate">
                ${totalVerifiedUSD.toFixed(2)} USD successfully verified
              </div>
            </div>
          </div>

          {/* Card 2: Under Verification (BDT) */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#D97706] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF7ED] text-[#D97706]">
                Under Review
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs text-[#8A94A6] font-medium">Under Verification</div>
              <div className="text-2xl font-black text-[#D97706] tracking-tight mt-0.5">
                ৳{pendingVerificationBDT.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-0.5 truncate">
                ${pendingVerificationUSD.toFixed(2)} USD awaiting billing check
              </div>
            </div>
          </div>

          {/* Card 3: Total Transactions Count */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#3858F6]">
                {payments.length} Txns
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs text-[#8A94A6] font-medium">Transaction Volume</div>
              <div className="text-2xl font-black text-[#121826] tracking-tight mt-0.5">
                {payments.length} Records
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-0.5 truncate">
                {statusCounts["Verified"] || 0} Cleared • {statusCounts["Under Review"] || 0} In Review
              </div>
            </div>
          </div>

          {/* Card 4: Verified Client Account */}
          <div className="bg-[#3858F6] text-white p-5 rounded-[24px] shadow-lg shadow-[#3858F6]/25 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div className="flex items-center justify-between z-10 pointer-events-none">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold border border-white/10">
                <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#10B981]/30 text-[#6EE7B7] border border-white/10">
                Verified Account
              </span>
            </div>
            <div className="z-10 mt-2.5 select-none">
              <div className="text-xs text-white/80 font-medium">Billing Profile</div>
              <div className="text-xl font-black text-white tracking-tight mt-0.5 truncate">
                {profile.businessName || "Fashion Hub BD"}
              </div>
              <div className="text-[11px] text-white/70 font-medium mt-0.5 truncate">
                Client: {profile.name}
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Search, Filter & Gateways Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          {/* Top row: Search input + Gateway Filter + Sort Selector */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Transaction ID (BK...), Order ID (#BOOST-1001), Sender..."
                className="w-full bg-[#F6F8FC] focus:bg-white text-xs font-medium text-[#121826] pl-10 pr-9 py-2.5 rounded-xl border border-transparent focus:border-[#3858F6] focus:outline-none transition-all placeholder:text-slate-400"
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

            {/* Right side controls: Method Filter + Sort Selector */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Gateway Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF4]">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#121826] focus:outline-none cursor-pointer pr-1"
                >
                  {methods.map((m) => (
                    <option key={m} value={m}>
                      {m === "All" ? "All Gateways" : m}
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
                  <option value="newest">Newest Date</option>
                  <option value="oldest">Oldest Date</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </select>
              </div>

              {/* Reset Button */}
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

          {/* Status Tabs with Dynamic Counter Badges */}
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

        {/* Dynamic Payments Table / List */}
        {isLoadingPayments && payments.length === 0 ? (
          /* Loading Skeleton */
          <div className="bg-white rounded-[24px] border border-[#E9EDF4] p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="w-28 h-3.5 bg-slate-200 rounded" />
                  <div className="w-44 h-3 bg-slate-100 rounded" />
                </div>
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-16 h-6 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="bg-white rounded-[28px] border border-[#E9EDF4] p-12 text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
            <div className="w-14 h-14 rounded-2xl bg-[#F6F8FC] text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#121826]">
                {payments.length === 0 ? "No payment transactions yet" : "No payments match your filters"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {payments.length === 0
                  ? "When you submit a boost order with bKash, Nagad, or Bank Transfer, the transaction record will appear here."
                  : "Try clearing search keywords or choosing a different status/gateway filter."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#3858F6] text-white text-xs font-bold rounded-xl hover:bg-[#2542D9] transition-all cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          /* Transactions Table */
          <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E9EDF4] bg-[#F8FAFD] text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">
                    <th className="py-4 px-6">Transaction ID</th>
                    <th className="py-4 px-4">Order ID & Campaign</th>
                    <th className="py-4 px-4">Gateway</th>
                    <th className="py-4 px-4">Date & Time</th>
                    <th className="py-4 px-4">USD Budget</th>
                    <th className="py-4 px-4">Payable (BDT)</th>
                    <th className="py-4 px-4">Verification</th>
                    <th className="py-4 px-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F3F8] text-xs">
                  {filteredPayments.map((p) => {
                    const isBkash = p.method === "bKash";
                    const isNagad = p.method === "Nagad";

                    return (
                      <tr key={p.id} className="hover:bg-[#F9FAFC] transition-colors group cursor-default">
                        {/* Transaction ID with One-click Copy */}
                        <td className="py-4 px-6">
                          <button
                            onClick={(e) => handleCopyTrx(p.transactionId, e)}
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-[#3858F6] hover:bg-[#EEF2FF] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Click to copy Transaction ID"
                          >
                            <span>{p.transactionId}</span>
                            {copiedTrx === p.transactionId ? (
                              <Check className="w-3 h-3 text-[#10B981]" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-[#3858F6]" />
                            )}
                          </button>
                          {p.senderNumber && (
                            <div className="text-[10px] text-[#8A94A6] font-mono mt-0.5 pl-2">
                              Sender: {p.senderNumber}
                            </div>
                          )}
                        </td>

                        {/* Order ID & Campaign Name */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#121826] group-hover:text-[#3858F6] transition-colors truncate max-w-xs">
                            {p.campaignName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <button
                              onClick={() => handleOpenRelatedOrder(p.orderId)}
                              className="font-mono text-[11px] font-bold text-slate-500 hover:text-[#3858F6] hover:underline"
                              title="View order details"
                            >
                              #{p.orderId}
                            </button>
                          </div>
                        </td>

                        {/* Gateway Method */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              isBkash
                                ? "bg-[#FDF2F7] text-[#D12053] border border-[#D12053]/20"
                                : isNagad
                                ? "bg-[#FFF7ED] text-[#EA580C] border border-[#EA580C]/20"
                                : "bg-[#EEF2FF] text-[#3858F6] border border-[#3858F6]/20"
                            }`}
                          >
                            {isBkash || isNagad ? (
                              <Smartphone className="w-3 h-3" />
                            ) : (
                              <Building className="w-3 h-3" />
                            )}
                            <span>{p.method}</span>
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-4 text-[#8A94A6] font-medium whitespace-nowrap">
                          {p.date}
                        </td>

                        {/* USD Budget */}
                        <td className="py-4 px-4 font-bold text-[#121826]">
                          ${p.amountUSD.toFixed(2)}
                        </td>

                        {/* Payable BDT */}
                        <td className="py-4 px-4">
                          <div className="font-black text-[#121826]">
                            ৳{p.amountBDT.toLocaleString()}
                          </div>
                          {p.serviceChargeBDT > 0 && (
                            <div className="text-[10px] text-amber-700 font-medium">
                              incl. ৳{p.serviceChargeBDT} fee
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <StatusBadge status={p.status} size="sm" />
                        </td>

                        {/* Receipt Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-slate-700 rounded-xl shadow-2xs hover:border-[#3858F6]/40 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#3858F6]" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (For Tablets & Mobile) */}
            <div className="lg:hidden divide-y divide-[#F0F3F8]">
              {filteredPayments.map((p) => (
                <div key={p.id} className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <button
                        onClick={(e) => handleCopyTrx(p.transactionId, e)}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#3858F6]"
                      >
                        <span>{p.transactionId}</span>
                        {copiedTrx === p.transactionId ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>
                      <div className="text-sm font-bold text-[#121826] mt-0.5 truncate">
                        {p.campaignName}
                      </div>
                      <div className="text-[11px] text-[#8A94A6] mt-0.5">
                        Order #{p.orderId} • {p.method}
                      </div>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                  </div>

                  {/* Budget & Payable Breakdown Box */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F6F8FC] p-3 rounded-2xl border border-[#E9EDF4]">
                    <div>
                      <span className="text-[#8A94A6] block text-[10px] font-medium">USD Budget</span>
                      <span className="font-bold text-[#121826]">${p.amountUSD.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[#8A94A6] block text-[10px] font-medium">BDT Total</span>
                      <span className="font-black text-[#3858F6]">৳{p.amountBDT.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#8A94A6]">{p.date}</span>
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#3858F6] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Printable/Downloadable Official Invoice Receipt Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedReceipt(null)}
            />

            {/* Modal Card */}
            <div className="relative bg-white rounded-[28px] shadow-2xl max-w-md w-full p-6 z-10 border border-[#E9EDF4] space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#3858F6] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#3858F6]/20">
                    SC
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#121826]">Official Payment Receipt</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Invoice #{selectedReceipt.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Body */}
              <div className="space-y-3.5 text-xs">
                {/* Meta Details Box */}
                <div className="p-3.5 bg-[#F6F8FC] rounded-2xl space-y-2 border border-[#E9EDF4]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Billed To:</span>
                    <span className="font-bold text-[#121826]">
                      {profile.name} ({profile.businessName})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Campaign:</span>
                    <span className="font-bold text-[#121826] truncate max-w-[200px]">
                      {selectedReceipt.campaignName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Order Reference:</span>
                    <span className="font-mono font-bold text-[#3858F6]">#{selectedReceipt.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Payment Gateway:</span>
                    <span className="font-bold text-[#121826]">{selectedReceipt.method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Transaction ID:</span>
                    <span className="font-mono font-extrabold text-[#3858F6] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {selectedReceipt.transactionId}
                    </span>
                  </div>
                  {selectedReceipt.senderNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Sender Number:</span>
                      <span className="font-mono text-slate-700 font-semibold">{selectedReceipt.senderNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Date & Time:</span>
                    <span className="text-slate-600 font-medium">{selectedReceipt.date}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <StatusBadge status={selectedReceipt.status} size="sm" />
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Amount (USD)</span>
                    <span className="font-bold text-[#121826]">${selectedReceipt.amountUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Applied Dollar Rate</span>
                    <span className="font-medium text-slate-700">1 USD = ৳{selectedReceipt.exchangeRate} BDT</span>
                  </div>
                  {selectedReceipt.serviceChargeBDT > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Gateway Cashout Fee</span>
                      <span className="text-amber-700 font-semibold">
                        +৳{selectedReceipt.serviceChargeBDT} BDT
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-[#121826] pt-2 border-t border-[#E9EDF4]">
                    <span>Total Amount Paid</span>
                    <span className="text-[#3858F6] text-base">
                      ৳{selectedReceipt.amountBDT.toLocaleString()} BDT
                    </span>
                  </div>
                </div>

                {/* Uploaded Payment Screenshot / Proof */}
                {selectedReceipt.screenshotUrl && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700">
                        Payment Proof (Cloudinary / Cloud Storage)
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        Attached
                      </span>
                    </div>
                    <a
                      href={selectedReceipt.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#3858F6] transition-all shadow-3xs"
                    >
                      <div className="relative w-full h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={selectedReceipt.screenshotUrl}
                          alt="Payment Receipt"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 bg-white flex items-center justify-between text-xs border-t border-slate-100">
                        <span className="text-slate-600 font-medium">Click to open full receipt</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#3858F6] shrink-0" />
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F0F3F8]">
                <button
                  onClick={handleCopyReceiptText}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  {copiedInvoice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Details</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 text-xs font-bold bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
