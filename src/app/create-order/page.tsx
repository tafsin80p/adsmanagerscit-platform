"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Sparkles,
  FileCheck,
  Building,
  Smartphone,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { BoostItem, PaymentMethod } from "@/types";
import {
  CityBankLogo,
  BracBankLogo,
  DbblLogo,
  BkashLogo,
  NagadLogo,
} from "@/components/ui/BankLogos";

export default function CreateOrderPage() {
  const router = useRouter();
  const { addOrder, exchangeRateBDT, serviceChargePercent } = usePortal();

  // Campaign Type
  const [postType, setPostType] = useState<"Boost Post" | "Ads Campaign" | "Promotion">("Boost Post");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [targetPlatform] = useState<"Facebook">("Facebook");
  const [primaryObjective, setPrimaryObjective] = useState<"Messages" | "Engagement" | "Traffic" | "Leads">("Messages");

  // Advertising Items list
  const [items, setItems] = useState<BoostItem[]>([
    {
      id: "item-1",
      name: "Primary Boost Creative",
      postUrl: "https://www.facebook.com/fashionhubbd/posts/",
      objective: "Messages",
      platform: "Facebook",
      dailyBudgetUSD: 5,
      durationDays: 2,
      totalBudgetUSD: 10,
    },
  ]);

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bKash");
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState<string | null>(null);

  // Live Calculations
  const totalUSD = items.reduce((sum, item) => sum + item.totalBudgetUSD, 0);
  const subtotalBDT = totalUSD * exchangeRateBDT;
  const serviceChargeBDT = Math.round((subtotalBDT * serviceChargePercent) / 100);
  const finalPayableBDT = subtotalBDT + serviceChargeBDT;

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

  // Mock Screenshot upload & OCR scanner
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setUploadedImage(fakeUrl);
      setOcrStatus("scanning");

      // Simulate real OCR scanner reading receipt
      setTimeout(() => {
        const detectedTrx = `TRX${Math.floor(100000 + Math.random() * 900000)}`;
        setTransactionId(detectedTrx);
        setOcrStatus("success");
      }, 1200);
    }
  };

  // Bank selection
  const [selectedBank, setSelectedBank] = useState<"City Bank" | "BRAC Bank" | "DBBL">("City Bank");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const bankAccounts = {
    "City Bank": {
      name: "The City Bank Ltd",
      branch: "Gulshan Avenue Branch, Dhaka",
      accountName: "Meta Ads Agency BD",
      accountNumber: "1502-9384-72001",
      routingNumber: "225271829",
      swift: "CIBLBDDH",
      tag: "CityTouch / NPSB / BEFTN",
      instructions: "Transfer via CityTouch App or any bank's NPSB/BEFTN/RTGS. Reference: Your Campaign Name or Phone.",
    },
    "BRAC Bank": {
      name: "BRAC Bank PLC",
      branch: "Banani Branch, Dhaka",
      accountName: "Meta Ads Agency BD",
      accountNumber: "2061-4892-0001",
      routingNumber: "060260424",
      swift: "BRAKBDDH",
      tag: "Astha App / NPSB / BEFTN",
      instructions: "Transfer via Astha App or any bank's NPSB instant transfer. Reference: Your Order ID.",
    },
    DBBL: {
      name: "Dutch-Bangla Bank PLC (DBBL)",
      branch: "Motijheel Foreign Exchange Branch, Dhaka",
      accountName: "Meta Ads Agency BD",
      accountNumber: "115-110-38491",
      routingNumber: "090272185",
      swift: "DBBLBDDH",
      tag: "NexusPay / Rocket / NPSB",
      instructions: "Transfer via NexusPay App, Rocket to Bank, or NPSB transfer. Reference: Your Phone Number.",
    },
  };

  const mobileAccounts = {
    bKash: {
      title: "bKash Merchant / Personal Account",
      number: "01712-345678",
      type: "Payment / Send Money",
      instructions: "Go to bKash App > Send Money or Payment > Enter Number > Amount in BDT > Reference: Use Phone Number",
    },
    Nagad: {
      title: "Nagad Merchant Account",
      number: "01898-765432",
      type: "Merchant Payment",
      instructions: "Go to Nagad App > Merchant Pay > Enter Number > Amount in BDT > Reference: Use Phone Number",
    },
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) {
      alert("Please enter a campaign name or post description.");
      return;
    }
    if (totalUSD <= 0) {
      alert("Please enter a valid budget greater than $0.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const created = addOrder({
        campaignName: campaignTitle.trim(),
        postUrl: items[0]?.postUrl || "https://facebook.com/fashionhubbd",
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
        thumbnail: "/images/winter-collection.jpg",
        items,
        notes: [
          `Client submitted boost order for ${items.length} item(s).`,
          `Target objective: ${primaryObjective} on ${targetPlatform}.`,
          `Payment submitted via ${paymentMethod}${paymentMethod === "Bank Transfer" ? ` (${selectedBank})` : ""} (${transactionId || "pending confirmation"}).`,
        ],
        isEligibleForRenew: false,
      });

      setIsSubmitting(false);
      setOrderCreatedSuccess(created.id);
    }, 1000);
  };

  if (orderCreatedSuccess) {
    return (
      <DashboardLayout pageTitle="Order Confirmed">
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

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => router.push("/my-orders")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Track in My Orders</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Create Order">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Create New Boost Order
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Configure your campaign, add your creative post URLs, and calculate your budget in BDT.
          </p>
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

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(["Boost Post", "Ads Campaign", "Promotion"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      postType === type
                        ? "bg-[#EBF2FF] text-[#0866FF] border-[#0866FF] shadow-2xs"
                        : "bg-white text-slate-600 border-[#E7ECF3] hover:border-slate-300"
                    }`}
                  >
                    {type}
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
                      <label className="text-[11px] font-medium text-slate-500 block mb-1">
                        Facebook Post URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={item.postUrl}
                        onChange={(e) => handleUpdateItem(item.id, "postUrl", e.target.value)}
                        placeholder="https://www.facebook.com/yourpage/posts/123456789"
                        className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                      />
                    </div>

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
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#EBF2FF] text-[#0866FF] text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Payment Method & Proof
              </h2>

              {/* Method Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {(["bKash", "Nagad", "Bank Transfer"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      paymentMethod === method
                        ? "bg-[#0866FF] text-white border-[#0866FF] shadow-xs"
                        : "bg-white text-slate-700 border-[#E7ECF3] hover:border-slate-300"
                    }`}
                  >
                    {method === "bKash" && <BkashLogo className="w-4 h-4" />}
                    {method === "Nagad" && <NagadLogo className="w-4 h-4" />}
                    {method === "Bank Transfer" && <Building className="w-4 h-4" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>

              {/* Bank Transfer Multi-Bank Selector */}
              {paymentMethod === "Bank Transfer" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Select Bank Account:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      3 Verified Partner Banks
                    </span>
                  </div>

                  {/* 3 Bank Selector Tabs with Logos */}
                  <div className="grid grid-cols-3 gap-2">
                    {(["City Bank", "BRAC Bank", "DBBL"] as const).map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedBank === bank
                            ? "bg-[#EBF2FF] text-[#0866FF] border-[#0866FF] shadow-2xs ring-1 ring-[#0866FF]/20"
                            : "bg-white text-slate-700 border-[#E7ECF3] hover:border-slate-300"
                        }`}
                      >
                        {bank === "City Bank" && <CityBankLogo className="w-4 h-4" />}
                        {bank === "BRAC Bank" && <BracBankLogo className="w-4 h-4" />}
                        {bank === "DBBL" && <DbblLogo className="w-4 h-4" />}
                        <span className="truncate">{bank}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Bank Account Details Card */}
                  <div className="p-4 bg-[#F6F8FC] rounded-2xl border border-[#E7ECF3] space-y-3">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E7ECF3]">
                      <div className="flex items-center gap-2.5">
                        {selectedBank === "City Bank" && <CityBankLogo className="w-8 h-8" />}
                        {selectedBank === "BRAC Bank" && <BracBankLogo className="w-8 h-8" />}
                        {selectedBank === "DBBL" && <DbblLogo className="w-8 h-8" />}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#172033]">
                            {bankAccounts[selectedBank].name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {bankAccounts[selectedBank].branch}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0866FF] bg-white border border-[#E7ECF3] px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap">
                        {bankAccounts[selectedBank].tag}
                      </span>
                    </div>

                    {/* Account Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-[#E7ECF3]">
                        <span className="text-[10px] text-slate-400 block font-medium">Account Title</span>
                        <div className="font-bold text-[#172033] mt-0.5">
                          {bankAccounts[selectedBank].accountName}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-[#E7ECF3] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Account Number</span>
                          <div className="font-mono font-bold text-[#0866FF] mt-0.5">
                            {bankAccounts[selectedBank].accountNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(bankAccounts[selectedBank].accountNumber, "acc")}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-[#EBF2FF] hover:text-[#0866FF] rounded-lg text-slate-600 transition-colors text-[11px] font-semibold border border-slate-200"
                        >
                          {copiedText === "acc" ? (
                            <Check className="w-3.5 h-3.5 text-[#12A875]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedText === "acc" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-[#E7ECF3] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Routing Number</span>
                          <div className="font-mono font-bold text-slate-800 mt-0.5">
                            {bankAccounts[selectedBank].routingNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(bankAccounts[selectedBank].routingNumber, "routing")}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-[#EBF2FF] hover:text-[#0866FF] rounded-lg text-slate-600 transition-colors text-[11px] font-semibold border border-slate-200"
                        >
                          {copiedText === "routing" ? (
                            <Check className="w-3.5 h-3.5 text-[#12A875]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedText === "routing" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-[#E7ECF3]">
                        <span className="text-[10px] text-slate-400 block font-medium">SWIFT Code</span>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">
                          {bankAccounts[selectedBank].swift}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-[#E7ECF3]/70 leading-relaxed">
                      {bankAccounts[selectedBank].instructions}
                    </p>
                  </div>
                </div>
              ) : (
                /* Mobile Banking (bKash / Nagad) Account Box */
                <div className="p-4 bg-[#F6F8FC] rounded-2xl border border-[#E7ECF3] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {paymentMethod === "bKash" ? <BkashLogo className="w-8 h-8" /> : <NagadLogo className="w-8 h-8" />}
                      <div>
                        <span className="text-xs font-bold text-[#172033]">
                          {mobileAccounts[paymentMethod].title}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {mobileAccounts[paymentMethod].type}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(mobileAccounts[paymentMethod].number, "mobile")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E7ECF3] text-xs font-mono font-bold text-[#0866FF] rounded-xl transition-colors shadow-2xs"
                    >
                      {copiedText === "mobile" ? <Check className="w-3.5 h-3.5 text-[#12A875]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{mobileAccounts[paymentMethod].number}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-[#E7ECF3]/70 leading-relaxed">
                    {mobileAccounts[paymentMethod].instructions}
                  </p>
                </div>
              )}

              {/* Screenshot Upload with Smart OCR Auto-fill */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Payment Screenshot (With Instant OCR Auto-Fill)
                </label>
                <div className="border-2 border-dashed border-[#E7ECF3] hover:border-[#0866FF]/60 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-[#F6F8FC]/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <UploadCloud className="w-6 h-6 text-[#0866FF]" />
                    <span className="text-xs font-semibold text-slate-700">
                      Click to upload receipt screenshot
                    </span>
                    <span className="text-[10px] text-slate-400">
                      JPG, PNG under 5MB. OCR will extract your Transaction ID automatically.
                    </span>
                  </div>
                </div>

                {/* OCR Feedback Badge */}
                {ocrStatus === "scanning" && (
                  <div className="flex items-center gap-2 text-xs text-[#0866FF] bg-[#EBF2FF] p-2 rounded-lg font-medium animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Scanning receipt via OCR to extract Transaction ID...
                  </div>
                )}
                {ocrStatus === "success" && (
                  <div className="flex items-center gap-2 text-xs text-[#12A875] bg-[#E8F8F2] p-2 rounded-lg font-medium">
                    <FileCheck className="w-4 h-4" />
                    OCR read successful! Transaction ID detected and filled below.
                  </div>
                )}
              </div>

              {/* Manual Transaction ID & Sender inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Transaction ID (TRX) *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. BK98X7102 or TRX109283"
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sender Account / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g. 01712-XXXXXX"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                  />
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
                    <span>Configured USD Rate</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                      Live
                    </span>
                  </span>
                  <span className="font-medium text-slate-800">1 USD = ৳{exchangeRateBDT} BDT</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>BDT Subtotal</span>
                  <span className="font-semibold text-slate-800">৳{subtotalBDT.toLocaleString()} BDT</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Service Fee ({serviceChargePercent}%)</span>
                  <span className="font-semibold text-slate-800">৳{serviceChargeBDT.toLocaleString()} BDT</span>
                </div>

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
