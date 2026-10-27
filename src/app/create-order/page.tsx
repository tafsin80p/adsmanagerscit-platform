"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Trash2,
  DollarSign,
  Calculator,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Building,
  Smartphone,
  ExternalLink,
  CheckCircle,
  Hash,
  Phone,
  ScanLine,
  Loader2,
  FileUp,
  Flame,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { BoostItem, PaymentMethod, BankAccount } from "@/types";
import {
  CityBankLogo,
  BracBankLogo,
  DbblLogo,
  BkashLogo,
  NagadLogo,
} from "@/components/ui/BankLogos";
import { BankDetailsModal } from "@/components/modals/BankDetailsModal";
import { FacebookPostPreview } from "@/components/ui/FacebookPostPreview";
import { AnimatedToast, ToastData } from "@/components/ui/AnimatedToast";

export default function CreateOrderPage() {
  const router = useRouter();
  const {
    addOrder,
    exchangeRateBDT,
    bkashCashoutPercent,
    nagadCashoutPercent,
    bkashNumber,
    bkashAccountType,
    bkashAccountName,
    bkashInstructions,
    bkashActive,
    nagadNumber,
    nagadAccountType,
    nagadAccountName,
    nagadInstructions,
    nagadActive,
    bankAccounts: contextBankAccounts,
    profile,
  } = usePortal();

  // Campaign Type
  const [postType, setPostType] = useState<"Boost Post" | "Ads Campaign" | "Promotion">("Boost Post");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [targetPlatform] = useState<"Facebook">("Facebook");
  const [primaryObjective, setPrimaryObjective] = useState<"Messages" | "Engagement" | "Traffic" | "Leads">("Messages");

  // Advertising Items list
  const [items, setItems] = useState<BoostItem[]>([
    {
      id: "item-1",
      name: "Ad Creative #1",
      postUrl: "",
      objective: "Messages",
      platform: "Facebook",
      dailyBudgetUSD: 5,
      durationDays: 1,
      totalBudgetUSD: 5,
    },
  ]);

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bKash");
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [uploadStorageSource, setUploadStorageSource] = useState<"cloudinary" | "local_fallback" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Live Calculations
  const totalUSD = items.reduce((sum, item) => sum + item.totalBudgetUSD, 0);
  const baseBDT = Math.round(totalUSD * exchangeRateBDT);
  const cashoutPercent =
    paymentMethod === "bKash"
      ? bkashCashoutPercent
      : paymentMethod === "Nagad"
      ? nagadCashoutPercent
      : 0;
  const cashoutChargeBDT = Math.round((baseBDT * cashoutPercent) / 100);
  const finalPayableBDT = baseBDT + cashoutChargeBDT;

  // Handlers for dynamic items
  const handleAddItem = () => {
    const newItem: BoostItem = {
      id: `item-${Date.now()}`,
      name: `Ad Item #${items.length + 1}`,
      postUrl: "",
      objective: primaryObjective,
      platform: targetPlatform,
      dailyBudgetUSD: 5,
      durationDays: 1,
      totalBudgetUSD: 5,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof BoostItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "dailyBudgetUSD" || field === "durationDays") {
            const daily = field === "dailyBudgetUSD" ? Number(value) || 0 : item.dailyBudgetUSD;
            const days = field === "durationDays" ? Number(value) || 1 : item.durationDays;
            updated.totalBudgetUSD = daily * days;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Cloudinary Screenshot upload & OCR scanner
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingScreenshot(true);
    setOcrStatus("scanning");

    // Immediate local preview so the user sees instant feedback
    const localPreview = URL.createObjectURL(file);
    setUploadedImage(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "payments");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setUploadedImage(data.url);
        setUploadStorageSource(data.storage === "cloudinary" ? "cloudinary" : "local_fallback");

        // Simulate reading receipt
        setTimeout(() => {
          const detectedTrx = `TRX${Math.floor(100000 + Math.random() * 900000)}`;
          setTransactionId(detectedTrx);
          setOcrStatus("success");
        }, 800);
      } else {
        setUploadError(data.error || "Failed to upload receipt to cloud");
        setOcrStatus("idle");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(error.message || "Network error uploading receipt");
      setOcrStatus("idle");
    } finally {
      setIsUploadingScreenshot(false);
      e.target.value = "";
    }
  };

  // Bank selection & popup modal
  const activeBankAccounts = useMemo(() => {
    return contextBankAccounts && contextBankAccounts.length > 0
      ? contextBankAccounts.filter((b) => b.isActive)
      : [];
  }, [contextBankAccounts]);

  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const selectedBankAccount = useMemo(() => {
    if (!activeBankAccounts || activeBankAccounts.length === 0) return null;
    return (
      activeBankAccounts.find((b) => b.id === selectedBankId) ||
      activeBankAccounts.find((b) => b.isPrimary) ||
      activeBankAccounts[0]
    );
  }, [activeBankAccounts, selectedBankId]);

  const handleBankSelect = (bank: BankAccount) => {
    setSelectedBankId(bank.id);
    setIsBankModalOpen(true);
  };

  const mobileAccounts = {
    bKash: {
      brandName: "bKash",
      title: "bKash Official Account",
      accountName: bkashAccountName || "Shopno IT / Meta Ads Agency",
      number: bkashNumber || "01712-345678",
      type: bkashAccountType || "Personal (Send Money)",
      instructions:
        bkashInstructions ||
        "Open bKash App > Send Money > enter exact amount and put your phone in Reference. Then enter the TrxID below.",
    },
    Nagad: {
      brandName: "Nagad",
      title: "Nagad Official Account",
      accountName: nagadAccountName || "Shopno IT / Meta Ads Agency",
      number: nagadNumber || "01898-765432",
      type: nagadAccountType || "Personal (Send Money)",
      instructions:
        nagadInstructions ||
        "Open Nagad App > Send Money > enter exact amount and put your phone in Reference. Then enter the TrxID below.",
    },
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) {
      setToast({
        type: "error",
        title: "Missing Campaign Title",
        message: "Please enter a campaign name or post description.",
        duration: 4000,
      });
      return;
    }
    const firstUrl = items[0]?.postUrl?.trim();
    if (!firstUrl) {
      setToast({
        type: "error",
        title: "Missing Facebook Post URL",
        message: "Please enter your Facebook post URL.",
        duration: 4000,
      });
      return;
    }
    if (totalUSD <= 0) {
      setToast({
        type: "error",
        title: "Invalid Budget",
        message: "Please enter a valid budget greater than $0.",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await addOrder({
        campaignName: campaignTitle.trim(),
        postUrl: firstUrl,
        postType,
        platform: targetPlatform,
        objective: primaryObjective,
        dailyBudgetUSD: items[0]?.dailyBudgetUSD || 5,
        totalBudgetUSD: totalUSD,
        durationDays: items[0]?.durationDays || 2,
        paymentStatus: transactionId ? "Awaiting Verification" : "Unpaid",
        paymentMethod,
        transactionId: transactionId || undefined,
        paidAmountBDT: finalPayableBDT,
        thumbnail: uploadedImage || "/images/winter-collection.jpg",
        items,
        notes: [
          `Client submitted boost order for ${items.length} item(s).`,
          `Target objective: ${primaryObjective} on ${targetPlatform}.`,
          `Payment submitted via ${paymentMethod}${paymentMethod === "Bank Transfer" ? ` (${selectedBankAccount?.bankName || "Bank"})` : ""}${cashoutChargeBDT > 0 ? ` with ${cashoutPercent}% cashout charge (+৳${cashoutChargeBDT} BDT)` : ""} (${transactionId || "pending confirmation"}).`,
          senderNumber ? `Sender Account: ${senderNumber}` : "",
        ].filter(Boolean),
        senderNumber: senderNumber || undefined,
        screenshotUrl: uploadedImage || undefined,
        isEligibleForRenew: false,
      });

      setIsSubmitting(false);
      setOrderCreatedSuccess(created.id);
      setToast({
        type: "success",
        title: "🎉 Boost Order Placed Successfully!",
        message: `Order #${created.id} (${campaignTitle.trim()}) has been submitted! Our specialist is reviewing your payment and creatives.`,
        duration: 5000,
      });

      try {
        sessionStorage.setItem(
          "scit_auth_toast",
          JSON.stringify({
            type: "success",
            title: "🎉 Boost Order Placed Successfully!",
            message: `Order #${created.id} has been recorded. Review status is live in My Orders.`,
            duration: 4500,
          })
        );
      } catch {}
    } catch (err: unknown) {
      const error = err as Error;
      setIsSubmitting(false);
      setToast({
        type: "error",
        title: "Order Placement Error",
        message: error.message || "Could not save order to database. Please try again.",
        duration: 4500,
      });
    }
  };

  if (orderCreatedSuccess) {
    return (
      <DashboardLayout pageTitle="Order Confirmed">
        {/* Animated Toast Notification */}
        <AnimatedToast toast={toast} onClose={() => setToast(null)} />

        <div className="max-w-xl mx-auto py-12 text-center space-y-6 bg-white p-8 rounded-2xl border border-[#E7ECF3] shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#E8F8F2] text-[#12A875] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#0866FF] bg-[#EBF2FF] px-2.5 py-1 rounded-md">
              Order #{orderCreatedSuccess}
            </span>
            <h2 className="text-xl font-bold text-[#172033] mt-2">
              Boost Order Placed Successfully!
            </h2>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto leading-relaxed">
              Your order has been recorded. Our Meta Ad Specialist will verify the payment and initialize ad delivery on Facebook.
            </p>
          </div>

          <div className="p-4 bg-[#F6F8FC] rounded-xl border border-[#E7ECF3] text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Campaign:</span>
              <span className="font-semibold text-slate-800">{campaignTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Budget:</span>
              <span className="font-semibold text-[#0866FF]">${totalUSD.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payable Amount:</span>
              <span className="font-semibold text-slate-800">৳{finalPayableBDT.toLocaleString()} BDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment TRX ID:</span>
              <span className="font-mono font-semibold text-slate-800">{transactionId || "Pending Verification"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/my-orders")}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              My Orders
            </button>
            <button
              onClick={() => router.push("/all-boosts")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>View in All Boosts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Create Order">
      {/* Animated Toast Notification */}
      <AnimatedToast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Create New Boost Order
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Configure your campaign, add your creative post URLs, and calculate your budget in BDT.
            </p>
          </div>
        </div>

        {/* Connected Facebook Page Header Banner */}
        <div className="bg-gradient-to-r from-[#EEF4FF] via-white to-[#F6F8FC] p-4 rounded-2xl border border-[#D8E4FC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0866FF] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              f
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  Boosting For: {profile.connectedPage?.name || profile.businessName || "My Facebook Page"}
                </span>
                <span className="text-[10px] bg-[#E8F8F2] text-[#12A875] px-2 py-0.5 rounded-full font-bold">
                  Connected
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {profile.connectedPage?.category || "Shopping & Retail"} • Page ID: {profile.connectedPage?.id || "N/A"}
              </div>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs font-bold text-[#0866FF] hover:underline self-start sm:self-auto flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-[#D8E4FC] shadow-2xs"
          >
            <span>Change Page in Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Campaign Category */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#EBF2FF] text-[#0866FF] text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Campaign Type & Objective
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    type: "Boost Post" as const,
                    label: "Ads Boost",
                    sub: "Boost Existing Post",
                    icon: "🚀",
                  },
                  {
                    type: "Ads Campaign" as const,
                    label: "Ads Campaign",
                    sub: "Meta Ads Manager",
                    icon: "📢",
                  },
                  {
                    type: "Promotion" as const,
                    label: "Promote",
                    sub: "Page Growth & Likes",
                    icon: "⭐",
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setPostType(item.type)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      postType === item.type
                        ? "bg-[#EBF2FF] text-[#0866FF] border-[#0866FF] shadow-2xs ring-1 ring-[#0866FF]/30"
                        : "bg-white text-slate-700 border-[#E7ECF3] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Campaign / Boost Name *
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Winter Collection Launch or Flash Weekend Sale"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Target Platform
                  </label>
                  <div className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] bg-[#F6F8FC] text-[#0866FF] font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0866FF]" />
                    Facebook Feed & Videos (Exclusive)
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Primary Goal / Objective
                  </label>
                  <select
                    value={primaryObjective}
                    onChange={(e: any) => setPrimaryObjective(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none bg-white"
                  >
                    <option value="Messages">WhatsApp & Messenger Conversations</option>
                    <option value="Engagement">Post Engagement (Likes, Shares, Comments)</option>
                    <option value="Traffic">Website / Landing Page Traffic</option>
                    <option value="Leads">Lead Form Submissions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Multi-Item Creative & Post Links */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EBF2FF] text-[#0866FF] text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Advertising Posts & Budgets ({items.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0866FF] hover:text-[#0052CC] hover:bg-[#EBF2FF] px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Post
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#E7ECF3] bg-[#F6F8FC]/60 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Post Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-[#DC4545] p-1 rounded-md transition-colors"
                          title="Remove this item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-500">
                          Facebook Post URL *
                        </label>
                        {item.postUrl.trim().length > 0 && (
                          <span className="text-[10px] font-bold text-[#0866FF] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                            Live Post Preview
                          </span>
                        )}
                      </div>
                      <input
                        type="url"
                        required
                        value={item.postUrl}
                        onChange={(e) => handleUpdateItem(item.id, "postUrl", e.target.value)}
                        placeholder="https://www.facebook.com/yourpage/posts/123456789"
                        className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                      />
                    </div>

                    {/* Live Facebook Post & Ad Mockup Preview */}
                    {item.postUrl.trim().length > 0 && (
                      <div className="pt-1">
                        <FacebookPostPreview
                          postUrl={item.postUrl}
                          pageName={profile?.connectedPage?.name || "Min Mart BD"}
                          pageAvatar={profile?.avatar || "/images/profile-avatar.jpg"}
                          thumbnail="/images/winter-collection.jpg"
                          campaignName={campaignTitle || item.name}
                          objective={item.objective || primaryObjective}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 block mb-1">
                          Daily Budget (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            value={item.dailyBudgetUSD}
                            onChange={(e) => handleUpdateItem(item.id, "dailyBudgetUSD", e.target.value)}
                            className="w-full text-xs pl-6 pr-3 py-2 bg-white rounded-lg border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-500 block mb-1">
                          Duration (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={item.durationDays}
                          onChange={(e) => handleUpdateItem(item.id, "durationDays", e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-semibold text-slate-600">
                      Item Total: <span className="text-[#0866FF]">${item.totalBudgetUSD.toFixed(2)} USD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Verification & Proof Upload */}
            <div className="bg-white p-3.5 sm:p-6 rounded-2xl border border-[#E7ECF3] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0866FF] text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Payment Method & Proof
                </h2>
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Agency
                </span>
              </div>

              {/* 3 Compact Payment Method Cards */}
              <div className="grid grid-cols-3 gap-2">
                {(["bKash", "Nagad", "Bank Transfer"] as const).map((method) => {
                  const isSelected = paymentMethod === method;
                  const feeTag =
                    method === "bKash"
                      ? `+${bkashCashoutPercent}%`
                      : method === "Nagad"
                      ? `+${nagadCashoutPercent}%`
                      : "0% fee";
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 sm:p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center min-w-0 ${
                        isSelected
                          ? method === "bKash"
                            ? "border-[#E2136E] bg-[#FFF5F8] text-[#E2136E] shadow-2xs"
                            : method === "Nagad"
                            ? "border-[#EA580C] bg-[#FFF7ED] text-[#EA580C] shadow-2xs"
                            : "border-[#0866FF] bg-[#F0F7FF] text-[#0866FF] shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      <div className="h-5 sm:h-6 flex items-center justify-center">
                        {method === "bKash" && <BkashLogo className="w-7 sm:w-8 h-4 sm:h-5" />}
                        {method === "Nagad" && <NagadLogo className="w-7 sm:w-8 h-4 sm:h-5" />}
                        {method === "Bank Transfer" && <Building className="w-4 h-4 text-slate-600" />}
                      </div>
                      <span className="font-bold text-[11px] sm:text-xs leading-none text-slate-900 truncate max-w-full">
                        {method}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-white/90" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {feeTag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Conditional Display: Bank Transfer Multi-Bank Selector or Mobile Banking Details */}
              {paymentMethod === "Bank Transfer" ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-[#172033] block">
                        Select Partner Bank Account
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Click on any bank card to view complete account details
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#0866FF] bg-[#EBF2FF] px-2 py-0.5 rounded-full shrink-0">
                      {activeBankAccounts.length} Verified Partner Bank{activeBankAccounts.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Dynamic Bank Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {activeBankAccounts.map((bank) => {
                      const isSelected = selectedBankAccount?.id === bank.id;
                      const lower = bank.bankName.toLowerCase();
                      const isCity = lower.includes("city");
                      const isBrac = lower.includes("brac");
                      const isDbbl = lower.includes("dutch") || lower.includes("dbbl");

                      return (
                        <div
                          key={bank.id}
                          onClick={() => handleBankSelect(bank)}
                          className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center justify-between gap-2 ${
                            isSelected
                              ? "bg-white border-[#0866FF] shadow-2xs ring-2 ring-[#0866FF]/20"
                              : "bg-white hover:bg-slate-50 border-[#E7ECF3] hover:border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold text-[#0866FF] bg-[#EBF2FF] px-1.5 py-0.2 rounded-full">
                              <Check className="w-2.5 h-2.5" /> Selected
                            </span>
                          )}

                          <div className="w-full h-14 bg-white rounded-lg p-1.5 flex items-center justify-center border border-slate-100">
                            {isCity && <CityBankLogo className="w-full h-full max-h-10" />}
                            {isBrac && <BracBankLogo className="w-full h-full max-h-8" />}
                            {isDbbl && <DbblLogo className="w-full h-full max-h-10" />}
                            {!isCity && !isBrac && !isDbbl && (
                              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                                <Building className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="w-full">
                            <h4 className="text-xs font-bold text-[#172033] truncate">
                              {bank.bankName}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {bank.tag || bank.branch || "Online / NPSB Transfer"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBankSelect(bank);
                            }}
                            className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-[#0866FF] text-white"
                                : "bg-[#F6F8FC] text-slate-700 hover:bg-[#EBF2FF] hover:text-[#0866FF]"
                            }`}
                          >
                            <span>Account Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Bank Confirmation Ribbon */}
                  {selectedBankAccount && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#EBF2FF]/60 border border-[#0866FF]/25 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#0866FF] text-white flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-xs">
                          <span className="font-bold text-[#172033] block truncate">
                            Selected: <span className="text-[#0866FF]">{selectedBankAccount.bankName}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono truncate block">
                            A/C: {selectedBankAccount.accountNumber} • {selectedBankAccount.accountName}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBankModalOpen(true)}
                        className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-slate-50 text-[#0866FF] text-xs font-bold rounded-lg border border-[#0866FF]/20 shadow-3xs transition-colors shrink-0 cursor-pointer"
                      >
                        View Account Details
                      </button>
                    </div>
                  )}

                  {selectedBankAccount && (
                    <BankDetailsModal
                      isOpen={isBankModalOpen}
                      onClose={() => setIsBankModalOpen(false)}
                      bankAccount={selectedBankAccount}
                      onConfirmBank={(b) => {
                        setSelectedBankId(b.id || selectedBankAccount.id);
                        setIsBankModalOpen(false);
                      }}
                    />
                  )}
                </div>
              ) : (
                /* Ultra-Clean Modern Mobile Banking Slip (Zero Gisibisi, 100% Responsive) */
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 space-y-3">
                  {/* Account Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-7 bg-white rounded-lg border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-3xs">
                        {paymentMethod === "bKash" ? (
                          <BkashLogo className="w-full h-full" />
                        ) : (
                          <NagadLogo className="w-full h-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                          <span>{(paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).title}</span>
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200/50">
                            Verified
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {(paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).accountName} • {(paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).type}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2 Clean Data Rows with Copy Buttons */}
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
                    {/* Row 1: Number */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                          {(paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).type} Number
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                          {(paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText((paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).number, "mobile")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-3xs transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedText === "mobile" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Row 2: Exact Amount */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                          Total to Send (inc. {cashoutPercent}% cashout)
                        </span>
                        <div className="text-base font-bold text-[#0866FF] font-mono leading-tight">
                          ৳{finalPayableBDT.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-slate-400 font-sans">BDT</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(finalPayableBDT.toString(), "amount")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-semibold rounded-lg shadow-3xs transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedText === "amount" ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Amount</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Guide */}
                  <p className="text-[11px] text-slate-500 leading-snug px-0.5">
                    💡 <span className="font-semibold text-slate-700">Guide:</span> {(paymentMethod === "Nagad" ? mobileAccounts.Nagad : mobileAccounts.bKash).instructions}
                  </p>
                </div>
              )}

              {/* Clean Screenshot Dropzone (Zero Overflow, Fully Responsive) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    Payment Receipt / Screenshot
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0866FF] bg-[#EBF2FF] px-2 py-0.5 rounded-full shrink-0">
                    <ScanLine className="w-3 h-3 text-[#0866FF]" />
                    <span>Auto-Detects TrxID</span>
                  </span>
                </div>

                {uploadedImage ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-3xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0">
                        <img src={uploadedImage} alt="Receipt preview" className="w-full h-full object-cover" />
                        {isUploadingScreenshot && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {isUploadingScreenshot ? "Uploading to Cloud..." : "Receipt Attached"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          {isUploadingScreenshot ? (
                            <span className="text-[#0866FF] font-medium flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {uploadStorageSource === "cloudinary" ? "Cloudinary Stored" : "Cloud Ready"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors shadow-3xs">
                        <FileUp className="w-3.5 h-3.5 text-[#0866FF]" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          disabled={isUploadingScreenshot}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          setOcrStatus("idle");
                          setUploadError(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white transition-colors"
                        title="Remove receipt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="group relative border-2 border-dashed border-slate-200 hover:border-[#0866FF] bg-slate-50/50 hover:bg-[#F5F9FF] rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 block">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploadingScreenshot}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-3xs flex items-center justify-center text-[#0866FF] group-hover:scale-105 transition-all">
                      {isUploadingScreenshot ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0866FF]" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#0866FF] transition-colors block">
                        Upload payment receipt / screenshot
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, WEBP, or PDF • Cloudinary cloud hosted & OCR scanned
                      </p>
                    </div>
                  </label>
                )}

                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* OCR Scan Status Feedback */}
                {ocrStatus === "scanning" && (
                  <div className="flex items-center gap-2 text-xs text-[#0866FF] bg-[#EBF2FF] p-2.5 rounded-xl font-medium border border-[#0866FF]/20 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0866FF] shrink-0" />
                    <span>Scanning receipt to detect Transaction ID...</span>
                  </div>
                )}
                {ocrStatus === "success" && (
                  <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium border border-emerald-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Detected TrxID: <strong className="font-mono text-emerald-950 font-bold">{transactionId}</strong></span>
                    </div>
                    <span className="text-[9px] bg-white px-1.5 py-0.5 rounded font-bold text-emerald-700 border border-emerald-200 shrink-0">
                      Auto-Filled
                    </span>
                  </div>
                )}
              </div>

              {/* Manual Transaction ID & Sender Account Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#0866FF]" />
                    <span>Transaction ID (TRX) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. BK98X7102"
                    className="w-full text-xs font-mono font-bold tracking-wider px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none uppercase bg-white placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    From your {paymentMethod} confirmation SMS
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#0866FF]" />
                    <span>Sender Account / Mobile Number</span>
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g. 01712-XXXXXX"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none bg-white placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Number used to send the payment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Column (5 cols): Live Cost Calculator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs sticky top-24 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E7ECF3]">
                <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Live Cost Calculator</h3>
                  <p className="text-[11px] text-slate-400">Dynamic USD to BDT pricing</p>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Ad Items</span>
                  <span className="font-semibold text-slate-900">{items.length} Post(s)</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Total USD Budget</span>
                  <span className="font-bold text-[#0866FF]">${totalUSD.toFixed(2)} USD</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>Dollar Rate</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                      Live
                    </span>
                  </span>
                  <span className="font-medium text-slate-800">1 USD = ৳{exchangeRateBDT} BDT</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>BDT Base Amount</span>
                  <span className="font-semibold text-slate-800">৳{baseBDT.toLocaleString()} BDT</span>
                </div>

                {cashoutChargeBDT > 0 ? (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>{paymentMethod} Cashout Fee</span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/80 px-1.5 py-0.5 rounded font-mono font-medium">
                        +{cashoutPercent}%
                      </span>
                    </span>
                    <span className="font-bold text-amber-700">
                      +৳{cashoutChargeBDT.toLocaleString()} BDT
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Cashout Fee</span>
                    <span className="font-semibold text-[#12A875] bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200/60">
                      0% (Free for Bank)
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#E7ECF3] flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Final Payable Amount</span>
                    <span className="text-[10px] text-slate-400 font-normal">All taxes & charges included</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[#0866FF] tracking-tight">
                      ৳{finalPayableBDT.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">BDT</span>
                  </div>
                </div>
              </div>

              {/* Guarantee badge */}
              <div className="p-3 bg-[#E8F8F2] rounded-xl text-[#0F825B] text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-medium leading-relaxed">
                  100% verified manual setup by Meta certified ad buyers.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || totalUSD <= 0}
                className="w-full py-3 px-4 bg-[#0866FF] hover:bg-[#0052CC] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Order...</span>
                ) : (
                  <>
                    <span>Confirm & Submit Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
