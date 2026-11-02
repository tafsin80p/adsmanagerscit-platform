"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sliders,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  User,
  Users,
  ExternalLink,
  Check,
  X,
  CreditCard,
  Eye,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Copy,
  Layers,
  FileText,
  Building,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { Order, OrderStatus, ClientAccount, getCurrentShift, ShiftType } from "@/types";
import { AdminCreateOrderModal } from "@/components/modals/AdminCreateOrderModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ClientAvatar } from "@/components/ui/ClientAvatar";

export default function ManagerDashboardPage() {
  const {
    orders,
    payments,
    profile,
    refreshOrders,
    refreshPayments,
    exchangeRateBDT,
    updateOrderStatus,
  } = usePortal();

  // Shift & Clock state
  const [activeShift, setActiveShift] = useState<ShiftType>("Day Shift");
  const [liveBstTime, setLiveBstTime] = useState<string>("");

  useEffect(() => {
    setActiveShift(getCurrentShift());
  }, []);

  // Live BST clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setLiveBstTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clients database state for fast order creation
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Notifications and Toast
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessingOrderId, setIsProcessingOrderId] = useState<string | null>(null);

  // Tabs and Search filters
  const [activeTab, setActiveTab] = useState<"pending" | "my_shift" | "day_shift" | "night_shift" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch clients to allow instant selection
  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const res = await fetch("/api/clients?role=client");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.clients)) {
          setClients(data.clients);
        }
      }
    } catch (e) {
      console.warn("Could not fetch clients list:", e);
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Approve & Launch order
  const handleApproveOrder = async (order: Order) => {
    setIsProcessingOrderId(order.id);
    try {
      const operatorName = profile.name || "Ads Specialist";
      const operatorEmail = profile.email || "specialist@shopnocareerit.com";

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Active",
          paymentStatus: "Verified",
          confirmedBy: {
            name: operatorName,
            email: operatorEmail,
            role: "manager",
            shift: activeShift,
            confirmedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm order.");
      }

      await refreshOrders();
      await refreshPayments();
      showNotification(`Order #${order.id} approved & launched in ${activeShift}!`);
    } catch (err: unknown) {
      const error = err as Error;
      showNotification(error.message || "Failed to approve order.");
    } finally {
      setIsProcessingOrderId(null);
    }
  };

  // Scope portal orders (genuine in-app orders)
  const portalOrders = useMemo(
    () => orders.filter((o) => !o.isExternalBoost && o.source !== "facebook_page_boost"),
    [orders]
  );

  // Pending queue: orders awaiting payment verification
  const pendingQueue = useMemo(
    () =>
      portalOrders.filter(
        (o) =>
          o.status === "Pending" ||
          o.paymentStatus === "Awaiting Verification" ||
          o.paymentStatus === "Under Review" ||
          o.paymentStatus === "Unpaid"
      ),
    [portalOrders]
  );

  // Shift specific collections
  const currentShiftOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      if (o.shift) return o.shift === activeShift;
      if (o.addedBy && o.addedBy.shift) return o.addedBy.shift === activeShift;
      return false;
    });
  }, [portalOrders, activeShift]);

  const dayShiftOrders = useMemo(() => {
    return portalOrders.filter(
      (o) => o.shift === "Day Shift" || (o.addedBy && o.addedBy.shift === "Day Shift")
    );
  }, [portalOrders]);

  const nightShiftOrders = useMemo(() => {
    return portalOrders.filter(
      (o) => o.shift === "Night Shift" || (o.addedBy && o.addedBy.shift === "Night Shift")
    );
  }, [portalOrders]);

  // Total USD managed in this active shift
  const shiftSpendUSD = useMemo(
    () => currentShiftOrders.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0),
    [currentShiftOrders]
  );

  const activeRunningCount = useMemo(
    () => portalOrders.filter((o) => o.status === "Active").length,
    [portalOrders]
  );

  // Tab dataset
  const activeDataset = useMemo(() => {
    if (activeTab === "pending") return pendingQueue;
    if (activeTab === "my_shift") return currentShiftOrders;
    if (activeTab === "day_shift") return dayShiftOrders;
    if (activeTab === "night_shift") return nightShiftOrders;
    return portalOrders;
  }, [activeTab, pendingQueue, currentShiftOrders, dayShiftOrders, nightShiftOrders, portalOrders]);

  // Search filter
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeDataset;
    return activeDataset.filter((o) => {
      const cName = (o.clientName || "").toLowerCase();
      const bName = (o.businessName || "").toLowerCase();
      const cEmail = (o.clientEmail || "").toLowerCase();
      const pName = (o.facebookPageName || "").toLowerCase();
      const opName = (o.addedBy?.name || "").toLowerCase();
      const confName = (o.confirmedBy?.name || "").toLowerCase();
      const trx = (o.transactionId || "").toLowerCase();

      return (
        o.id.toLowerCase().includes(q) ||
        o.campaignName.toLowerCase().includes(q) ||
        cName.includes(q) ||
        bName.includes(q) ||
        cEmail.includes(q) ||
        pName.includes(q) ||
        opName.includes(q) ||
        confName.includes(q) ||
        trx.includes(q)
      );
    });
  }, [activeDataset, searchQuery]);

  // Filtered clients for quick-boost launcher
  const filteredClients = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 8);
    return clients
      .filter((c) => {
        const name = (c.businessName || c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const page = (c.connectedPage?.name || "").toLowerCase();
        return name.includes(q) || email.includes(q) || page.includes(q);
      })
      .slice(0, 8);
  }, [clients, clientSearchQuery]);

  const handleOpenCreateForClient = (clientId: string) => {
    setPreselectedClientId(clientId);
    setIsCreateModalOpen(true);
  };

  return (
    <AdminLayout pageTitle="Shift Campaign Management Console">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#121826] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Shift Operator Banner & Control Desk */}
        <div className="bg-gradient-to-r from-slate-900 via-[#141B2D] to-[#1E1B4B] rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden border border-white/10 shadow-2xl">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3858F6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Operator identity & Live Clock */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-white/10 border border-white/15 text-indigo-200 flex items-center gap-1.5 backdrop-blur-xs">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Campaign Operations Desk</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>BST Live: {liveBstTime || "08:00:00 AM"}</span>
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <span>Welcome, {profile.name || "Campaign Manager"}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-relaxed max-w-2xl">
                  যেকোনো ক্লায়েন্টের আইডিতে সরাসরি বুস্ট ও অ্যাড ক্যাম্পেইন সাবমিট করুন। আপনার শিফটে অ্যাড করা সকল ক্যাম্পেইন অডিট ট্যাগে অ্যাডমিন স্বয়ংক্রিয়ভাবে দেখতে পাবেন।
                </p>
              </div>

              {/* Shift Switcher Pills */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs font-bold text-slate-300 mr-1">Active Duty Shift:</span>
                <button
                  type="button"
                  onClick={() => setActiveShift("Day Shift")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeShift === "Day Shift"
                      ? "bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/30 scale-105"
                      : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>☀️ Day Shift (10 AM - 08 PM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveShift("Night Shift")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeShift === "Night Shift"
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105"
                      : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-purple-300" />
                  <span>🌙 Night Shift (07 PM - 02:30 AM)</span>
                </button>
              </div>
            </div>

            {/* Right: Primary Call to Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPreselectedClientId(undefined);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#3858F6] to-[#2542D9] hover:from-[#2F4EE8] hover:to-[#1E37B5] text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-[#3858F6]/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Create Boost for Client</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await refreshOrders();
                  await refreshPayments();
                  showNotification("All shift orders & payments refreshed!");
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Orders in My Active Shift */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                {activeShift === "Night Shift" ? <Moon className="w-5 h-5 text-purple-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeShift}
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Orders in {activeShift}</div>
              <div className="text-2xl font-black text-[#121826] mt-0.5">
                {currentShiftOrders.length} Boosts
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Day: {dayShiftOrders.length} • Night: {nightShiftOrders.length}
              </div>
            </div>
          </div>

          {/* Card 2: Shift Spend USD */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Shift Budget
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Shift Ad Spend Logged</div>
              <div className="text-2xl font-black text-[#121826] mt-0.5">
                ${shiftSpendUSD.toFixed(2)} USD
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                ≈ ৳{Math.round(shiftSpendUSD * exchangeRateBDT).toLocaleString()} BDT
              </div>
            </div>
          </div>

          {/* Card 3: Pending Approvals & Verification */}
          <div
            onClick={() => setActiveTab("pending")}
            className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-100 transition-colors">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  pendingQueue.length > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {pendingQueue.length} Pending
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Needs Verification</div>
              <div className="text-2xl font-black text-[#121826] mt-0.5 flex items-center gap-2">
                <span>{pendingQueue.length} Orders</span>
                {pendingQueue.length > 0 && (
                  <span className="text-xs font-bold text-amber-600">Review Now →</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Verify TRX & Launch Boosts
              </div>
            </div>
          </div>

          {/* Card 4: Active Delivering Campaigns */}
          <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-xs flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3858F6] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-[#3858F6]" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#3858F6] border border-blue-200">
                Delivering
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Live Campaigns</div>
              <div className="text-2xl font-black text-[#121826] mt-0.5">
                {activeRunningCount} Campaigns
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Running on Meta Networks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Quick Picker Launcher */}
        <div className="bg-white rounded-3xl p-5 border border-[#E9EDF4] shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#121826] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3858F6]" />
                <span>Quick Client Boost Launcher</span>
              </h3>
              <p className="text-xs text-slate-400">
                যেকোনো ক্লায়েন্টের নামে ক্লিক করে সরাসরি তার আইডিতে নতুন বুস্ট বা অ্যাড ক্যাম্পেইন তৈরি করুন:
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search client brand..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3858F6]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {filteredClients.map((c) => {
              const cId = c._id || c.id || c.email;
              const name = c.businessName || c.name;
              return (
                <button
                  key={cId}
                  onClick={() => handleOpenCreateForClient(cId)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] rounded-2xl text-xs font-bold text-slate-800 hover:text-[#3858F6] shrink-0 transition-all cursor-pointer shadow-3xs"
                  title={`Click to add order for ${name}`}
                >
                  <ClientAvatar
                    avatarUrl={c.avatar}
                    fallbackUrl={c.connectedPage?.avatar}
                    name={name}
                    className="w-7 h-7 rounded-lg"
                    textSize="text-[10px]"
                  />
                  <div className="text-left min-w-0">
                    <div className="truncate max-w-[120px] font-bold">{name}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                      ৳{c.dollarRate || 150}/$1
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3858F6] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Workspace: Tabbed View with Search */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-xs overflow-hidden">
          {/* Header & Tabs */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveTab("pending")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Approvals</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white text-[10px] font-black">
                  {pendingQueue.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("my_shift")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "my_shift"
                    ? "bg-[#3858F6] text-white shadow-xs"
                    : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {activeShift === "Night Shift" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span>Active Shift ({activeShift})</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white text-[10px] font-black">
                  {currentShiftOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("day_shift")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "day_shift"
                    ? "bg-[#3858F6] text-white shadow-xs"
                    : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Day Shift (☀️)</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black">
                  {dayShiftOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("night_shift")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "night_shift"
                    ? "bg-[#3858F6] text-white shadow-xs"
                    : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>Night Shift (🌙)</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black">
                  {nightShiftOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-[#F5F7FB] text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Orders ({portalOrders.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, clients, TRX..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3858F6]"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFD] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Order ID & Campaign</th>
                  <th className="py-3.5 px-4">Client Brand / Page</th>
                  <th className="py-3.5 px-4">Logged Shift & Operator</th>
                  <th className="py-3.5 px-4">Budget / USD</th>
                  <th className="py-3.5 px-4">Payment & TrxID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Shift Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 px-4 text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">No orders in this view</h4>
                        <p className="text-xs text-slate-400">
                          {activeTab === "pending"
                            ? "All pending boost orders are approved and confirmed! Great job."
                            : "No orders match the selected shift or search query."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isPending =
                      order.status === "Pending" ||
                      order.paymentStatus === "Awaiting Verification" ||
                      order.paymentStatus === "Under Review" ||
                      order.paymentStatus === "Unpaid";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* ID & Campaign */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <Image
                                src={order.thumbnail || "/images/placeholder.jpg"}
                                alt={order.campaignName}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(order.id, e)}
                                  className="font-mono font-bold text-[#3858F6] hover:underline inline-flex items-center gap-1"
                                >
                                  <span>#{order.id}</span>
                                  {copiedId === order.id && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                                </button>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {order.postType || "Boost"}
                                </span>
                              </div>
                              <div className="font-bold text-[#121826] text-xs truncate max-w-[170px]">
                                {order.campaignName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client / Page */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <ClientAvatar
                              avatarUrl={order.thumbnail}
                              name={order.businessName || order.clientName || "Direct Client"}
                              className="w-8 h-8 rounded-lg"
                              textSize="text-xs"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-[#121826] truncate max-w-[150px]">
                                {order.businessName || order.clientName || "Direct Client"}
                              </div>
                              <div className="text-[11px] text-[#3858F6] font-medium truncate max-w-[150px]">
                                {order.facebookPageName || "Connected Page"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                {order.clientEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Shift & Operator */}
                        <td className="py-3.5 px-4">
                          {order.addedBy ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  order.shift === "Night Shift" || order.addedBy.shift === "Night Shift"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                              >
                                {order.shift === "Night Shift" || order.addedBy.shift === "Night Shift" ? (
                                  <>
                                    <Moon className="w-2.5 h-2.5 text-purple-600" />
                                    <span>Night Shift</span>
                                  </>
                                ) : (
                                  <>
                                    <Sun className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Day Shift</span>
                                  </>
                                )}
                              </span>
                              <div className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]">
                                {order.addedBy.name}
                              </div>
                              {order.confirmedBy && (
                                <div className="text-[10px] text-emerald-600 font-semibold truncate max-w-[130px]">
                                  ✓ Confirmed: {order.confirmedBy.name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                👤 Client Direct
                              </span>
                              <div className="text-[10px] text-slate-400">Self Order</div>
                              {order.confirmedBy && (
                                <div className="text-[10px] text-emerald-600 font-semibold truncate max-w-[130px]">
                                  ✓ Confirmed: {order.confirmedBy.name}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Budget */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-[#121826]">
                            ${order.totalBudgetUSD.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            ৳{(order.paidAmountBDT || Math.round(order.totalBudgetUSD * exchangeRateBDT)).toLocaleString()} BDT
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {order.durationDays} days
                          </div>
                        </td>

                        {/* Payment & TrxID */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <span>{order.paymentMethod || "bKash"}</span>
                          </div>
                          <div className="text-[11px] font-mono font-bold text-slate-700 truncate max-w-[140px]">
                            {order.transactionId || "No TrxID"}
                          </div>
                          {order.screenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptUrl(order.screenshotUrl!)}
                              className="text-[10px] text-[#3858F6] font-bold hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>View Receipt</span>
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={order.status} />
                          <div className="text-[10px] font-semibold text-slate-400 mt-1">
                            Pay: {order.paymentStatus || "Verified"}
                          </div>
                        </td>

                        {/* Shift Action Button */}
                        <td className="py-3.5 px-6 text-right">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleApproveOrder(order)}
                              disabled={isProcessingOrderId === order.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isProcessingOrderId === order.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Approve & Launch</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Active Live</span>
                            </span>
                          )}
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

      {/* Admin / Manager Create Order Modal */}
      <AdminCreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialClientId={preselectedClientId}
        clients={clients}
        onOrderCreated={() => {
          showNotification(`New boost order placed in ${activeShift}!`);
          refreshOrders();
          refreshPayments();
        }}
      />

      {/* Payment Receipt Image Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#3858F6]" />
                <span>Payment Receipt Screenshot</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
              <Image
                src={selectedReceiptUrl}
                alt="Payment Receipt"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

