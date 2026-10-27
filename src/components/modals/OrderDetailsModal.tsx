"use client";

import React from "react";
import Image from "next/image";
import {
  X,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  Repeat,
  FileText,
  AlertCircle,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FacebookPostPreview } from "@/components/ui/FacebookPostPreview";

export const OrderDetailsModal: React.FC = () => {
  const [showPreview, setShowPreview] = React.useState(false);
  const {
    selectedOrderForModal,
    setSelectedOrderForModal,
    setSelectedOrderForRenew,
    setIsRenewModalOpen,
  } = usePortal();

  if (!selectedOrderForModal) return null;

  const order = selectedOrderForModal;

  const handleRenewClick = () => {
    const toRenew = order;
    setSelectedOrderForModal(null);
    setSelectedOrderForRenew(toRenew);
    setIsRenewModalOpen(true);
  };

  const steps = [
    { title: "Order Submitted", done: true, time: order.createdAt },
    {
      title: "Payment Verification",
      done: order.paymentStatus === "Verified",
      inProgress: order.paymentStatus === "Awaiting Verification",
      time: order.paymentStatus === "Verified" ? "Verified" : "Under review",
    },
    {
      title: "Meta Specialist Setup",
      done: order.status === "Active" || order.status === "Completed" || order.status === "Paused",
      inProgress: order.status === "Confirmed",
      time: order.status === "Confirmed" ? "In progress" : order.startDate || "Pending",
    },
    {
      title: "Ad Delivery Live",
      done: order.status === "Completed",
      inProgress: order.status === "Active",
      time: order.status === "Active" ? "Delivering now" : order.status === "Completed" ? "Completed" : "Scheduled",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setSelectedOrderForModal(null)}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col z-10 border border-[#E7ECF3] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7ECF3] flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#3858F6] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                #{order.id}
              </span>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} size="sm" />
            </div>
            <h3 className="text-base font-bold text-[#172033] mt-1 truncate">
              {order.campaignName}
            </h3>
          </div>
          <button
            onClick={() => setSelectedOrderForModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Post Overview Card */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-[#F6F8FC] border border-[#E7ECF3]">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
              <Image
                src={order.thumbnail}
                alt={order.campaignName}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {order.postType} • {order.platform}
              </div>
              <div className="text-sm font-semibold text-[#172033] mt-0.5">
                Objective: <span className="text-[#3858F6]">{order.objective}</span>
              </div>
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3858F6] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-2.5 py-1 rounded-lg transition-colors cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? "Hide Preview" : "Preview Post"}</span>
                </button>
                <a
                  href={order.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline font-medium"
                >
                  <span>Open on Facebook</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Collapsible Live Facebook Post Preview */}
          {showPreview && order.postUrl && (
            <div className="animate-in fade-in zoom-in-98 duration-150">
              <FacebookPostPreview
                postUrl={order.postUrl}
                pageName={order.facebookPageName || "Min Mart BD"}
                pageAvatar="/images/profile-avatar.jpg"
                thumbnail={order.thumbnail}
                campaignName={order.campaignName}
                objective={order.objective}
              />
            </div>
          )}

          {/* Budget & Payment Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-[#E7ECF3]">
              <div className="text-[11px] text-slate-400 font-medium">Daily Budget</div>
              <div className="text-sm font-bold text-[#172033] mt-1">${order.dailyBudgetUSD.toFixed(2)}/day</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7ECF3]">
              <div className="text-[11px] text-slate-400 font-medium">Total Budget</div>
              <div className="text-sm font-bold text-[#3858F6] mt-1">${order.totalBudgetUSD.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7ECF3]">
              <div className="text-[11px] text-slate-400 font-medium">Paid (BDT)</div>
              <div className="text-sm font-bold text-[#172033] mt-1">
                {order.paidAmountBDT ? `৳${order.paidAmountBDT.toLocaleString()}` : "Pending"}
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7ECF3]">
              <div className="text-[11px] text-slate-400 font-medium">Duration</div>
              <div className="text-sm font-bold text-[#172033] mt-1">{order.durationDays} Day{order.durationDays > 1 ? "s" : ""}</div>
            </div>
          </div>

          {/* Payment Proof / Receipt Screenshot */}
          {order.screenshotUrl && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#3858F6]" />
                  Attached Payment Proof / Screenshot
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Cloud Stored
                </span>
              </div>
              <a
                href={order.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-lg overflow-hidden border border-slate-200 bg-white hover:border-[#3858F6] transition-all shadow-3xs"
              >
                <div className="relative w-full h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={order.screenshotUrl}
                    alt="Payment receipt proof"
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

          {/* Status Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Order Lifecycle Timeline
            </h4>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="relative mt-0.5">
                    {step.done ? (
                      <CheckCircle className="w-4 h-4 text-[#12A875]" />
                    ) : step.inProgress ? (
                      <Clock className="w-4 h-4 text-[#D97706] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`font-medium ${step.done ? "text-slate-800" : step.inProgress ? "text-[#D97706] font-semibold" : "text-slate-400"}`}>
                      {step.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{step.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Campaign Metrics (If available) */}
          {order.metrics ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#F6F8FC] to-[#EEF3FB] border border-[#E7ECF3]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#3858F6]" />
                  Live Campaign Delivery Metrics
                </div>
                <div className="flex items-center gap-2">
                  {order.metaCampaignId && (
                    <span className="text-[10px] font-mono font-bold bg-[#EBF2FF] text-[#0866FF] px-2 py-0.5 rounded-full border border-[#C7D9FE]">
                      Meta ID: #{order.metaCampaignId}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {order.metrics.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-[#E7ECF3]">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Reach</div>
                  <div className="text-sm font-bold text-[#172033]">
                    {order.metrics.reach.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E7ECF3]">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Impressions</div>
                  <div className="text-sm font-bold text-[#172033]">
                    {order.metrics.impressions.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E7ECF3]">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Messages</div>
                  <div className="text-sm font-bold text-[#3858F6]">
                    {order.metrics.conversations}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E7ECF3]">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Spent</div>
                  <div className="text-sm font-bold text-[#172033]">
                    ${order.metrics.spendUSD.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              Live performance metrics will be synchronized from Meta once the campaign starts delivering.
            </div>
          )}

          {/* Specialist Notes */}
          {order.notes && order.notes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Ad Manager & Specialist Notes
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 bg-[#F6F8FC] p-3 rounded-xl border border-[#E7ECF3]">
                {order.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#3858F6] font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#E7ECF3] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            TRX: {order.transactionId || "N/A"} ({order.paymentMethod || "Pending"})
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedOrderForModal(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-colors"
            >
              Close
            </button>
            {order.isEligibleForRenew && (
              <button
                onClick={handleRenewClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl shadow-xs transition-colors"
              >
                <Repeat className="w-3.5 h-3.5" />
                Renew Boost
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
