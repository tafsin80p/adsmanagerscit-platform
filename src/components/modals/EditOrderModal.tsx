"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  DollarSign,
  Calendar,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  Phone,
  CreditCard,
  Sun,
  Moon,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { Order, OrderStatus, PaymentMethod } from "@/types";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { updateOrder, exchangeRateBDT } = usePortal();

  const [campaignName, setCampaignName] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postType, setPostType] = useState<"Boost Post" | "Ads Campaign" | "Promotion">("Boost Post");
  const [objective, setObjective] = useState<"Messages" | "Engagement" | "Traffic" | "Leads">("Messages");
  const [budgetType, setBudgetType] = useState<"daily" | "total">("daily");
  const [dailyBudgetUSD, setDailyBudgetUSD] = useState<number>(5);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [totalBudgetUSD, setTotalBudgetUSD] = useState<number>(5);
  const [paidAmountBDT, setPaidAmountBDT] = useState<number>(0);
  const [status, setStatus] = useState<OrderStatus>("Pending");
  const [paymentStatus, setPaymentStatus] = useState<"Verified" | "Awaiting Verification" | "Unpaid" | "Failed">("Awaiting Verification");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bKash");
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [shift, setShift] = useState<"Day Shift (10 AM - 08 PM)" | "Night Shift (07 PM - 02:30 AM)">("Day Shift (10 AM - 08 PM)");
  const [specialNote, setSpecialNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever the selected order changes
  useEffect(() => {
    if (order) {
      setCampaignName(order.campaignName || "");
      setPostUrl(order.postUrl || "");
      setPostType(
        (order.postType as any) === "Ads Campaign" || (order.postType as any) === "Promotion"
          ? (order.postType as any)
          : "Boost Post"
      );
      setObjective(
        (["Messages", "Engagement", "Traffic", "Leads"].includes(order.objective || "")
          ? order.objective
          : "Messages") as any
      );
      setBudgetType(order.budgetType || "daily");
      const daily = Number(order.dailyBudgetUSD) || 5;
      const days = Number(order.durationDays) || 1;
      const total = Number(order.totalBudgetUSD) || daily * days;
      setDailyBudgetUSD(daily);
      setDurationDays(days);
      setTotalBudgetUSD(total);
      setPaidAmountBDT(order.paidAmountBDT || Math.round(total * (exchangeRateBDT || 150)));
      setStatus(order.status || "Pending");
      setPaymentStatus(
        (["Verified", "Awaiting Verification", "Unpaid", "Failed"].includes(order.paymentStatus || "")
          ? order.paymentStatus
          : "Awaiting Verification") as any
      );
      setPaymentMethod(
        (["bKash", "Nagad", "Bank Transfer"].includes(order.paymentMethod || "")
          ? order.paymentMethod
          : "bKash") as PaymentMethod
      );
      setTransactionId(order.transactionId || "");
      setSenderNumber(order.senderNumber || "");
      setShift(
        order.shift === "Night Shift (07 PM - 02:30 AM)" || order.shift === "Night Shift" || (order.addedBy?.shift?.includes("Night"))
          ? "Night Shift (07 PM - 02:30 AM)"
          : "Day Shift (10 AM - 08 PM)"
      );
      setSpecialNote(order.specialNote || "");
      setErrorMsg(null);
      setSaveSuccess(false);
    }
  }, [order, exchangeRateBDT]);

  if (!isOpen || !order) return null;

  // Handle budget mode recalculation
  const handleDailyBudgetChange = (val: number) => {
    const daily = Math.max(0, val);
    setDailyBudgetUSD(daily);
    const newTotal = Number((daily * durationDays).toFixed(2));
    setTotalBudgetUSD(newTotal);
    setPaidAmountBDT(Math.round(newTotal * (postType === "Ads Campaign" ? 155 : exchangeRateBDT || 150)));
  };

  const handleDurationChange = (val: number) => {
    const days = Math.max(1, Math.min(180, val));
    setDurationDays(days);
    if (budgetType === "total") {
      setDailyBudgetUSD(Number((totalBudgetUSD / days).toFixed(2)));
    } else {
      const newTotal = Number((dailyBudgetUSD * days).toFixed(2));
      setTotalBudgetUSD(newTotal);
      setPaidAmountBDT(Math.round(newTotal * (postType === "Ads Campaign" ? 155 : exchangeRateBDT || 150)));
    }
  };

  const handleTotalBudgetChange = (val: number) => {
    const total = Math.max(0, val);
    setTotalBudgetUSD(total);
    setDailyBudgetUSD(Number((total / Math.max(1, durationDays)).toFixed(2)));
    setPaidAmountBDT(Math.round(total * (postType === "Ads Campaign" ? 155 : exchangeRateBDT || 150)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setErrorMsg("Campaign name is required.");
      return;
    }
    if (totalBudgetUSD <= 0) {
      setErrorMsg("Total budget must be greater than $0.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const updatedFields: Partial<Order> = {
      campaignName: campaignName.trim(),
      postUrl: postUrl.trim(),
      postType,
      objective,
      budgetType,
      dailyBudgetUSD,
      durationDays,
      totalBudgetUSD,
      paidAmountBDT,
      status,
      paymentStatus,
      paymentMethod,
      transactionId: transactionId.trim() || undefined,
      senderNumber: senderNumber.trim() || undefined,
      shift,
      specialNote: specialNote.trim(),
    };

    try {
      // 1. Optimistic PortalContext update
      updateOrder(order.id, updatedFields);

      // 2. Direct server patch to ensure instant persistence in MongoDB Atlas
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order on server.");
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Order edit failed:", err);
      setErrorMsg(err.message || "Failed to update order. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-[#0866FF] text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate">Edit Campaign Order</h3>
                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded text-white shrink-0">
                  #{order.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Client: {order.businessName || order.clientName || "Direct"} • Shift: {shift.split(" ")[0]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Order updated successfully! Saving changes...</span>
            </div>
          )}

          {/* Section 1: Campaign Details */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1 border-b border-slate-200/60">
              <Layers className="w-3.5 h-3.5 text-[#0866FF]" />
              <span>Campaign Information</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Campaign Name / Description *
              </label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Winter Mega Clearance Sale • Post #1"
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">Facebook Post / Creative URL</label>
                {postUrl && (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#0866FF] font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Open Post</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://www.facebook.com/page/posts/12345678"
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none text-slate-700 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category / Format</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-semibold text-slate-800"
                >
                  <option value="Boost Post">Boost Post (Page Post)</option>
                  <option value="Ads Campaign">Ads Campaign (155 Rate)</option>
                  <option value="Promotion">Promotion (Targeted)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Campaign Objective</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-semibold text-slate-800"
                >
                  <option value="Messages">Messages (Messenger / WhatsApp)</option>
                  <option value="Engagement">Engagement (Likes & Shares)</option>
                  <option value="Traffic">Traffic (Website Link Clicks)</option>
                  <option value="Leads">Leads (Lead Generation)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Budget & Duration */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-[#0866FF]" />
                <span>Budget & Duration Strategy</span>
              </div>
              <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setBudgetType("daily")}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    budgetType === "daily" ? "bg-white text-[#0866FF] shadow-xs font-black" : "text-slate-600"
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetType("total")}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    budgetType === "total" ? "bg-white text-[#0866FF] shadow-xs font-black" : "text-slate-600"
                  }`}
                >
                  Lifetime
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Daily Pace ($ USD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={dailyBudgetUSD}
                    onChange={(e) => handleDailyBudgetChange(Number(e.target.value))}
                    disabled={budgetType === "total"}
                    className="w-full pl-6 pr-2 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration (Days)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar className="w-3 h-3" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={durationDays}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className="w-full pl-7 pr-2 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Budget ($ USD) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={totalBudgetUSD}
                    onChange={(e) => handleTotalBudgetChange(Number(e.target.value))}
                    disabled={budgetType === "daily"}
                    className="w-full pl-6 pr-2 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-bold text-[#0866FF] disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Paid (৳ BDT)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={paidAmountBDT}
                    onChange={(e) => setPaidAmountBDT(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Shift</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShift("Day Shift (10 AM - 08 PM)")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      shift.includes("Day")
                        ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Sun className="w-3 h-3 text-amber-200" />
                    <span>Day Shift</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift("Night Shift (07 PM - 02:30 AM)")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      shift.includes("Night")
                        ? "bg-purple-700 text-white border-purple-800 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Moon className="w-3 h-3 text-purple-300" />
                    <span>Night Shift</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Status & Payment Control */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1 border-b border-slate-200/60">
              <CreditCard className="w-3.5 h-3.5 text-[#0866FF]" />
              <span>Delivery Status & Payment Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Live Delivery Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className={`w-full px-3 py-2 rounded-lg border font-bold text-xs focus:outline-none ${
                    status === "Active"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : status === "Pending"
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : status === "Paused"
                      ? "bg-slate-100 border-slate-300 text-slate-700"
                      : status === "Completed"
                      ? "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-rose-50 border-rose-300 text-rose-700"
                  }`}
                >
                  <option value="Active">Active (Delivering Live)</option>
                  <option value="Pending">Pending (Under Review)</option>
                  <option value="Paused">Paused (Temporarily Stopped)</option>
                  <option value="Completed">Completed (Goal Reached)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-bold text-slate-800"
                >
                  <option value="Verified">Verified (Payment Confirmed)</option>
                  <option value="Awaiting Verification">Awaiting Verification</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Failed">Failed / Invalid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-semibold text-slate-800"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Transaction ID (TrxID)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Hash className="w-3 h-3" />
                  </span>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. BK98X7102"
                    className="w-full pl-7 pr-2 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Sender Mobile / Acc</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="w-3 h-3" />
                  </span>
                  <input
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g. 01712-XXXXXX"
                    className="w-full pl-7 pr-2 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#0866FF] focus:outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Special Note & Campaign Instructions */}
          <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Specialist Note / Campaign Instructions (স্পেশাল নোট ও নির্দেশনা)</span>
              </label>
              <span className="text-[10px] text-amber-800/80 font-medium">Synced with Telegram</span>
            </div>
            <textarea
              rows={3}
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder="e.g. Target Audience: Dhaka & Chittagong, Age 20-35, specific timing, placement instructions..."
              className="w-full p-2.5 bg-white rounded-lg border border-amber-200 focus:border-amber-400 focus:outline-none text-slate-800 text-xs font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-semibold transition-all cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0866FF] hover:bg-[#0052CC] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Order Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

