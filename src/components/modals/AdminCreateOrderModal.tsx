"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  X,
  ShoppingBag,
  User,
  Globe,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  ShieldCheck,
  Link as LinkIcon,
  UploadCloud,
  Trash2,
  ExternalLink,
  ImageIcon,
  Check,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";
import { ClientAccount, OrderStatus, PaymentStatus, PaymentMethod } from "@/types";

interface AdminCreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: any) => void;
  initialClientId?: string;
  clients?: ClientAccount[];
}

export const AdminCreateOrderModal: React.FC<AdminCreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialClientId,
  clients: propClients,
}) => {
  const { exchangeRateBDT, refreshOrders, refreshPayments } = usePortal();

  const [clientsList, setClientsList] = useState<ClientAccount[]>(propClients || []);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || "");
  const [clientSearch, setClientSearch] = useState("");

  // Form fields
  const [campaignName, setCampaignName] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postType, setPostType] = useState<"Boost Post" | "Ads Campaign" | "Promotion">("Boost Post");
  const [objective, setObjective] = useState<"Messages" | "Engagement" | "Traffic" | "Leads">("Messages");
  const [dailyBudgetUSD, setDailyBudgetUSD] = useState<number>(5);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [customTotalUSD, setCustomTotalUSD] = useState<number | null>(null);

  // Status & Payment controls
  const [status, setStatus] = useState<OrderStatus>("Active");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Verified");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Meta Ad Account");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [initialReach, setInitialReach] = useState<number>(0);
  const [initialImpressions, setInitialImpressions] = useState<number>(0);

  // Payment Screenshot state
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploadingScreenshot(true);

    const localUrl = URL.createObjectURL(file);
    setScreenshotPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "receipts");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setScreenshotUrl(data.url);
        setScreenshotPreview(data.url);
        setUploadSuccess(
          data.storage === "cloudinary"
            ? "Payment screenshot uploaded to Cloudinary!"
            : "Screenshot uploaded successfully!"
        );
        setTimeout(() => setUploadSuccess(null), 3500);
      } else {
        setUploadError(data.error || "Failed to upload image. Please check file format and size.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(error.message || "Network error uploading screenshot.");
    } finally {
      setIsUploadingScreenshot(false);
      e.target.value = "";
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotUrl("");
    setScreenshotPreview(null);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch clients if not provided or empty
  useEffect(() => {
    if (propClients && propClients.length > 0) {
      setClientsList(propClients);
      return;
    }

    if (isOpen) {
      setIsLoadingClients(true);
      fetch("/api/clients?role=client")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.clients)) {
            setClientsList(data.clients);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch clients for order creation:", err);
        })
        .finally(() => {
          setIsLoadingClients(false);
        });
    }
  }, [isOpen, propClients]);

  // Set initial selected client if passed
  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId, isOpen]);

  // Find currently selected client object
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return (
      clientsList.find(
        (c) =>
          c._id === selectedClientId ||
          c.id === selectedClientId ||
          c.email === selectedClientId
      ) || null
    );
  }, [clientsList, selectedClientId]);

  // Filter clients for dropdown search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clientsList;
    const q = clientSearch.toLowerCase();
    return clientsList.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.businessName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.connectedPage?.name?.toLowerCase().includes(q)
    );
  }, [clientsList, clientSearch]);

  // Calculated totals
  const totalBudgetUSD = customTotalUSD !== null ? customTotalUSD : dailyBudgetUSD * durationDays;
  const totalBudgetBDT = Math.round(totalBudgetUSD * exchangeRateBDT);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedClient) {
      setErrorMessage("Please select a client account for this order.");
      return;
    }

    if (!campaignName.trim()) {
      setErrorMessage("Please enter a campaign name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        campaignName: campaignName.trim(),
        postUrl: postUrl.trim(),
        postType,
        objective,
        platform: "Facebook",
        dailyBudgetUSD: Number(dailyBudgetUSD),
        durationDays: Number(durationDays),
        totalBudgetUSD: Number(totalBudgetUSD),
        status,
        paymentStatus,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paidAmountBDT: totalBudgetBDT,
        screenshotUrl: screenshotUrl.trim() || undefined,
        clientEmail: selectedClient.email,
        clientName: selectedClient.name,
        businessName: selectedClient.businessName || selectedClient.connectedPage?.name || selectedClient.name,
        facebookPageName: selectedClient.connectedPage?.name || selectedClient.businessName,
        facebookPageId: selectedClient.connectedPage?.id || "",
        thumbnail: selectedClient.connectedPage?.avatar || selectedClient.avatar || "/images/placeholder.jpg",
        notes: notes.trim()
          ? [notes.trim()]
          : [`Order manually entered by agency admin on behalf of ${selectedClient.name}.`],
        metrics: {
          reach: Number(initialReach) || 0,
          impressions: Number(initialImpressions) || 0,
          conversations: 0,
          spendUSD: Number(totalBudgetUSD) || 0,
          ctr: 2.5,
          cpm: 0.85,
          lastUpdated: "Just now",
        },
        source: "portal_order",
        isExternalBoost: false,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order on server.");
      }

      await refreshOrders();
      await refreshPayments();

      if (onOrderCreated) {
        onOrderCreated(data.order);
      }

      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#172033] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3858F6]/20 border border-[#3858F6]/40 flex items-center justify-center text-[#3858F6] shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Create Order for Client
              </h2>
              <p className="text-xs text-slate-300">
                Admin manual order entry for a registered client account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* 1. Client User Selector */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#3858F6]" />
                Select Client User *
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {isLoadingClients ? "Loading clients..." : `${clientsList.length} clients registered`}
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setCustomTotalUSD(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3858F6] cursor-pointer shadow-3xs"
              >
                <option value="">-- Choose Client Account --</option>
                {filteredClients.map((c) => (
                  <option key={c._id || c.id || c.email} value={c._id || c.id || c.email}>
                    {c.businessName || c.name} ({c.email}) {c.connectedPage?.name ? `• ${c.connectedPage.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Client Summary Pill */}
            {selectedClient && (
              <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center justify-between gap-3 text-xs shadow-3xs animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#3858F6] text-white font-black flex items-center justify-center shrink-0 text-xs">
                    {(selectedClient.name?.[0] || "C").toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 truncate">
                      {selectedClient.businessName || selectedClient.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">
                      {selectedClient.email} • {selectedClient.phone || "No phone"}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {selectedClient.connectedPage?.name || "Connected Page"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Campaign Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3858F6]" />
              Campaign Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign / Boost Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Collection Eid Mega Boost"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facebook Post URL or Creative Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://facebook.com/permalink.php?story_fbid=... or post link"
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Category / Type
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6] cursor-pointer"
                >
                  <option value="Boost Post">Boost Post (Post Engagement & Inquiries)</option>
                  <option value="Ads Campaign">Ads Campaign (Meta Ads Manager Campaign)</option>
                  <option value="Promotion">Promotion (Page Growth & Likes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Objective
                </label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6] cursor-pointer"
                >
                  <option value="Messages">Messages (Direct WhatsApp & Messenger)</option>
                  <option value="Engagement">Engagement (Likes, Comments & Shares)</option>
                  <option value="Traffic">Traffic (Website Clicks & Page Visits)</option>
                  <option value="Leads">Leads (Lead Generation Forms)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Budget & Duration */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F8FAFC] to-[#EEF4FF] border border-[#D8E4FC] space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#3858F6]" />
              Budget & Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daily Budget (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={dailyBudgetUSD}
                    onChange={(e) => {
                      setDailyBudgetUSD(parseFloat(e.target.value) || 0);
                      setCustomTotalUSD(null);
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3858F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration (Days)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={durationDays}
                    onChange={(e) => {
                      setDurationDays(parseInt(e.target.value, 10) || 1);
                      setCustomTotalUSD(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3858F6]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">Days</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Budget (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    step="0.5"
                    value={totalBudgetUSD}
                    onChange={(e) => setCustomTotalUSD(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-black text-[#3858F6] focus:outline-none focus:border-[#3858F6]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs border-t border-blue-200/60 font-semibold text-slate-700">
              <span>BDT Total (Rate: ৳{exchangeRateBDT}/USD):</span>
              <span className="font-black text-[#10B981] text-sm">৳{totalBudgetBDT.toLocaleString()} BDT</span>
            </div>
          </div>

          {/* 4. Status, Payment & Admin Verification Controls */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3858F6]" />
              Order Status & Payment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6] cursor-pointer"
                >
                  <option value="Active">Active (Currently Delivering)</option>
                  <option value="Pending">Pending (Awaiting Review)</option>
                  <option value="Confirmed">Confirmed (Ready to Launch)</option>
                  <option value="Paused">Paused (Temporarily Halted)</option>
                  <option value="Completed">Completed (Finished)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Verification Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6] cursor-pointer"
                >
                  <option value="Verified">Verified (Payment Received & Approved)</option>
                  <option value="Awaiting Verification">Awaiting Verification</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Unpaid">Unpaid / Later</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6] cursor-pointer"
                >
                  <option value="Meta Ad Account">Meta Ad Account (Direct Agency Card)</option>
                  <option value="Facebook Card">Facebook Card</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction ID / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. META-AUTO-CHARGE or TRX-88912"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                />
              </div>

              {/* Payment Receipt / Screenshot Upload Dropzone */}
              <div className="sm:col-span-2 space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#3858F6]" />
                    Payment Receipt / Verification Screenshot
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Upload receipt (PNG, JPG, WEBP, PDF) or paste URL
                  </span>
                </div>

                {screenshotPreview || screenshotUrl ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-3xs animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-2xs group">
                        <img
                          src={screenshotPreview || screenshotUrl}
                          alt="Payment screenshot proof"
                          className="w-full h-full object-cover"
                        />
                        {isUploadingScreenshot && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {isUploadingScreenshot
                            ? "Uploading to Cloud..."
                            : "Payment Proof Screenshot Attached"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] mt-0.5">
                          {isUploadingScreenshot ? (
                            <span className="text-[#3858F6] font-semibold flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Ready to Save
                            </span>
                          )}
                          <a
                            href={screenshotUrl || screenshotPreview || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3858F6] hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <span>View Full</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[280px] font-mono mt-0.5">
                          {screenshotUrl || "Local preview"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs">
                        Change
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleScreenshotUpload}
                          disabled={isUploadingScreenshot}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Remove screenshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#CBD5E1] hover:border-[#3858F6] rounded-2xl bg-[#F8FAFC] hover:bg-[#EEF4FF]/40 cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleScreenshotUpload}
                        disabled={isUploadingScreenshot}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-3xs flex items-center justify-center text-[#3858F6] group-hover:scale-105 transition-all mb-2">
                        {isUploadingScreenshot ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#3858F6]" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#3858F6] transition-colors">
                        Click or drag payment screenshot / invoice here
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, WEBP, PDF up to 10MB • Cloudinary Cloud Hosted
                      </p>
                    </label>

                    {/* Or manual URL input */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="url"
                        placeholder="Or paste screenshot image URL directly (e.g. https://res.cloudinary.com/...)"
                        value={screenshotUrl}
                        onChange={(e) => {
                          setScreenshotUrl(e.target.value);
                          setScreenshotPreview(e.target.value);
                        }}
                        className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Status Feedback */}
                {uploadSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Initial Metrics (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Reach (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialReach}
                  onChange={(e) => setInitialReach(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Impressions (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialImpressions}
                  onChange={(e) => setInitialImpressions(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specialist Notes / Setup Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Campaign launched via Meta Ads Manager targeting Dhaka and Chittagong fashion shoppers."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#3858F6]"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-black transition-all shadow-md shadow-[#3858F6]/25 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Create Order for Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
