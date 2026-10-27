"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Download,
  Filter,
  Check,
  X,
  RefreshCw,
  Copy,
  Smartphone,
  Building,
  AlertCircle,
  FileText,
  Printer,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PaymentTransaction } from "@/types";

export default function AdminPaymentsPage() {
  const {
    payments,
    orders,
    exchangeRateBDT,
    profile,
    isLoadingPayments,
    refreshPayments,
    refreshOrders,
    updatePaymentStatus,
    setSelectedOrderForModal,
  } = usePortal();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [methodFilter, setMethodFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-high" | "amount-low">("newest");
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Live Refresh from DB
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshPayments(), refreshOrders()]);
      showNotification("Payment audit log synchronized with live database!");
    } catch {
      showNotification("Failed to refresh payments.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Status Change Handler with DB persistence
  const handleStatusChange = (
    paymentId: string,
    newStatus: "Verified" | "Under Review" | "Failed"
  ) => {
    updatePaymentStatus(paymentId, newStatus);
    showNotification(`Payment #${paymentId} status updated to ${newStatus}`);
  };

  // One-click copy
  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy full receipt text
  const handleCopyReceiptText = () => {
    if (!selectedReceipt) return;
    const details = `
🧾 AUDIT PAYMENT RECEIPT #${selectedReceipt.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client: ${profile.name} (${profile.businessName})
Campaign: ${selectedReceipt.campaignName}
Order ID: #${selectedReceipt.orderId}
Payment Method: ${selectedReceipt.method}
Transaction ID: ${selectedReceipt.transactionId}
${selectedReceipt.senderNumber ? `Sender Number: ${selectedReceipt.senderNumber}\n` : ""}Date: ${selectedReceipt.date}
USD Budget: $${selectedReceipt.amountUSD.toFixed(2)}
Dollar Rate: 1 USD = ৳${selectedReceipt.exchangeRate} BDT
Service Charge: ৳${selectedReceipt.serviceChargeBDT || 0} BDT
Total Amount Paid: ৳${selectedReceipt.amountBDT.toLocaleString()} BDT
Verification Status: ${selectedReceipt.status}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCIT Meta Ads Agency Internal Audit
    `.trim();

    navigator.clipboard.writeText(details);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  // Open related order modal
  const handleOpenRelatedOrder = (orderId: string) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setSelectedOrderForModal(found);
    }
  };

  // Dynamic KPI Calculations
  const totalVerifiedBDT = useMemo(
    () => payments.filter((p) => p.status === "Verified").reduce((sum, p) => sum + (p.amountBDT || 0), 0),
    [payments]
  );
  const totalVerifiedUSD = useMemo(
    () => payments.filter((p) => p.status === "Verified").reduce((sum, p) => sum + (p.amountUSD || 0), 0),
    [payments]
  );

  const underReviewBDT = useMemo(
    () => payments.filter((p) => p.status === "Under Review").reduce((sum, p) => sum + (p.amountBDT || 0), 0),
    [payments]
  );
  const underReviewUSD = useMemo(
    () => payments.filter((p) => p.status === "Under Review").reduce((sum, p) => sum + (p.amountUSD || 0), 0),
    [payments]
  );

  const totalVolumeUSD = useMemo(() => payments.reduce((sum, p) => sum + (p.amountUSD || 0), 0), [payments]);
  const totalVolumeBDT = useMemo(() => payments.reduce((sum, p) => sum + (p.amountBDT || 0), 0), [payments]);

  // Counts by status
  const statuses = ["All", "Verified", "Under Review", "Failed"];
  const statusCounts = useMemo(() => {
    return {
      All: payments.length,
      Verified: payments.filter((p) => p.status === "Verified").length,
      "Under Review": payments.filter((p) => p.status === "Under Review").length,
      Failed: payments.filter((p) => p.status === "Failed").length,
    };
  }, [payments]);

  // Gateways list & counts
  const methods = ["All", "bKash", "Nagad", "Bank Transfer"];
  const methodCounts = useMemo(() => {
    return {
      All: payments.length,
      bKash: payments.filter((p) => p.method === "bKash").length,
      Nagad: payments.filter((p) => p.method === "Nagad").length,
      "Bank Transfer": payments.filter((p) => p.method === "Bank Transfer").length,
    };
  }, [payments]);

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
    <AdminLayout pageTitle="Payment Audit Log">
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
                Payment Audit & Verification Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8F1] text-[#10B981] text-xs font-extrabold">
                {statusCounts["Verified"]} Verified
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F1] text-[#10B981] border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                MongoDB Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Audit, verify, and reconcile all client bKash, Nagad, and Bank transfer receipts with automated order synchronization.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Live Refresh Trigger */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingPayments}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh payments from database"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3858F6] ${
                  isRefreshing || isLoadingPayments ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {/* Payment Accounts & Rates Link */}
            <Link
              href="/admin/rates"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] text-[#3858F6] rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#3858F6]" />
              <span>Payment Accounts & Rates</span>
            </Link>
          </div>
        </div>

        {/* 4 Dynamic Interactive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Verified Revenue */}
          <button
            onClick={() => setStatusFilter("Verified")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "Verified"
                ? "bg-[#EAF8F1] border-[#10B981] ring-2 ring-[#10B981]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-emerald-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10B981] uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Revenue</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#059669]">
                {statusCounts["Verified"]} Cleared
              </span>
            </div>
            <div className="text-2xl font-black text-[#121826] mt-2">
              ৳{totalVerifiedBDT.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#059669] font-semibold mt-1">
              ${totalVerifiedUSD.toFixed(2)} USD successfully reconciled
            </div>
          </button>

          {/* Card 2: Under Review */}
          <button
            onClick={() => setStatusFilter("Under Review")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "Under Review"
                ? "bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-amber-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#D97706] uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Awaiting Audit</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {statusCounts["Under Review"]} Pending
              </span>
            </div>
            <div className="text-2xl font-black text-[#D97706] mt-2">
              ৳{underReviewBDT.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              ${underReviewUSD.toFixed(2)} USD awaiting verification
            </div>
          </button>

          {/* Card 3: Total Transactions Volume */}
          <button
            onClick={() => setStatusFilter("All")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "All"
                ? "bg-white border-[#3858F6] ring-2 ring-[#3858F6]/20 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#3858F6]" />
                <span>Total Audit Volume</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3858F6]">
                {payments.length} Total
              </span>
            </div>
            <div className="text-2xl font-black text-[#121826] mt-2">
              ৳{totalVolumeBDT.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#3858F6] font-semibold mt-1">
              ${totalVolumeUSD.toFixed(2)} USD total ledger volume
            </div>
          </button>

          {/* Card 4: Failed / Disputed */}
          <button
            onClick={() => setStatusFilter("Failed")}
            className={`p-5 rounded-[24px] border text-left transition-all cursor-pointer ${
              statusFilter === "Failed"
                ? "bg-red-50 border-red-300 ring-2 ring-red-200 shadow-md"
                : "bg-white border-[#E9EDF4] hover:border-red-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-600 uppercase flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Failed / Rejected</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {statusCounts["Failed"]} Failed
              </span>
            </div>
            <div className="text-2xl font-black text-red-600 mt-2">
              {statusCounts["Failed"]} Txns
            </div>
            <div className="text-[11px] text-red-500 font-medium mt-1">
              Invalid TRX or rejected payments
            </div>
          </button>
        </div>

        {/* Payments Table Card */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden space-y-4">
          {/* Controls Bar */}
          <div className="p-5 sm:p-6 border-b border-[#E9EDF4] space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search TRX ID, Order ID, phone number, client..."
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

              {/* Gateway Filter & Sorter */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Method / Gateway Selector */}
                <div className="flex items-center gap-1.5 bg-[#F5F7FB] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  >
                    {methods.map((m) => (
                      <option key={m} value={m}>
                        {m === "All" ? "All Gateways" : m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sorter */}
                <div className="flex items-center gap-1.5 bg-[#F5F7FB] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Amount: High to Low</option>
                    <option value="amount-low">Amount: Low to High</option>
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

            {/* Status Filter Tabs with Dynamic Live Count Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3 no-scrollbar">
              {statuses.map((s) => {
                const count = (statusCounts as any)[s] || 0;
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFD] text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                <tr>
                  <th className="py-4 px-6">Transaction ID & Order</th>
                  <th className="py-4 px-4">Gateway</th>
                  <th className="py-4 px-4">Sender Account</th>
                  <th className="py-4 px-4">Amount (USD & BDT)</th>
                  <th className="py-4 px-4">Live Verification Status</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-6 text-right">Audit Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoadingPayments && payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#3858F6]" />
                        <span>Loading live payment transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      No payment transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((txn) => {
                    const isBkash = txn.method === "bKash";
                    const isNagad = txn.method === "Nagad";

                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Transaction ID & Order reference */}
                        <td className="py-4 px-6">
                          <button
                            onClick={(e) => handleCopy(txn.transactionId, e)}
                            className="font-mono font-bold text-[#3858F6] hover:underline inline-flex items-center gap-1"
                            title="Click to copy Transaction ID"
                          >
                            <span>{txn.transactionId}</span>
                            {copiedId === txn.transactionId && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <button
                              onClick={() => handleOpenRelatedOrder(txn.orderId)}
                              className="font-mono text-[11px] font-bold text-slate-600 hover:text-[#3858F6] hover:underline"
                              title="Inspect associated order"
                            >
                              Order #{txn.orderId}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{txn.campaignName}</div>
                        </td>

                        {/* Payment Method */}
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
                            <span>{txn.method}</span>
                          </span>
                        </td>

                        {/* Sender Account */}
                        <td className="py-4 px-4 font-mono text-slate-700">
                          {txn.senderNumber ? (
                            <button
                              onClick={(e) => handleCopy(txn.senderNumber || "", e)}
                              className="hover:underline hover:text-[#3858F6] inline-flex items-center gap-1"
                              title="Click to copy sender phone"
                            >
                              <span>{txn.senderNumber}</span>
                              {copiedId === txn.senderNumber && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                            </button>
                          ) : (
                            <span className="text-slate-400">Direct Deposit / Bank</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4">
                          <div className="font-black text-[#121826]">${txn.amountUSD.toFixed(2)} USD</div>
                          <div className="text-[11px] font-bold text-[#10B981]">
                            ৳{txn.amountBDT.toLocaleString()} BDT
                          </div>
                          {txn.serviceChargeBDT > 0 && (
                            <div className="text-[10px] text-amber-700 font-medium">
                              incl. ৳{txn.serviceChargeBDT} fee
                            </div>
                          )}
                        </td>

                        {/* Live Verification Status Control Dropdown */}
                        <td className="py-4 px-4">
                          <select
                            value={txn.status}
                            onChange={(e) =>
                              handleStatusChange(
                                txn.id,
                                e.target.value as "Verified" | "Under Review" | "Failed"
                              )
                            }
                            className={`font-bold text-xs px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer transition-all ${
                              txn.status === "Verified"
                                ? "bg-[#EAF8F1] border-[#10B981] text-[#059669]"
                                : txn.status === "Under Review"
                                ? "bg-[#FFFBEB] border-[#F59E0B] text-[#D97706]"
                                : "bg-red-50 border-red-200 text-red-600"
                            }`}
                          >
                            <option value="Verified">Verified ✓</option>
                            <option value="Under Review">Under Review ⏳</option>
                            <option value="Failed">Failed ✕</option>
                          </select>
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                          {txn.date}
                        </td>

                        {/* Quick Audit Action Controls */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {txn.status !== "Verified" && (
                              <button
                                onClick={() => handleStatusChange(txn.id, "Verified")}
                                className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="Verify and approve transaction"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedReceipt(txn)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#E2E8F0] text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="Inspect receipt and proof"
                            >
                              <FileText className="w-3 h-3 text-[#3858F6]" />
                              <span>Receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Invoice & Receipt Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedReceipt(null)}
            />

            <div className="relative bg-white rounded-[28px] shadow-2xl max-w-md w-full p-6 z-10 border border-[#E9EDF4] space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#3858F6] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#3858F6]/20">
                    SC
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#121826]">Payment Audit Verification</h3>
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
                    <span className="text-slate-500 font-medium">Client Account:</span>
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
                    <span className="text-slate-500 font-medium">Audit Status:</span>
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

                {/* Verification Control Inside Modal */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Audit Status:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        handleStatusChange(selectedReceipt.id, "Verified");
                        setSelectedReceipt({ ...selectedReceipt, status: "Verified" });
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedReceipt.status === "Verified"
                          ? "bg-[#10B981] text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      Verify ✓
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedReceipt.id, "Failed");
                        setSelectedReceipt({ ...selectedReceipt, status: "Failed" });
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedReceipt.status === "Failed"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      Fail ✕
                    </button>
                  </div>
                </div>
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
    </AdminLayout>
  );
}
