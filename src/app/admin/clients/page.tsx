"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Building,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Megaphone,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  FileText,
  ShoppingBag,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { Order, ClientAccount } from "@/types";
import { AdminCreateOrderModal } from "@/components/modals/AdminCreateOrderModal";

// Helper to generate consistent avatar gradient based on brand name
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-[#3858F6] to-[#2542D9]",
    "from-[#10B981] to-[#059669]",
    "from-[#EC4899] to-[#BE185D]",
    "from-[#8B5CF6] to-[#6D28D9]",
    "from-[#F59E0B] to-[#D97706]",
    "from-[#06B6D4] to-[#0891B2]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getAvatarInitials(name: string): string {
  if (!name) return "CL";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AdminClientsPage() {
  const { profile, orders, exchangeRateBDT, setSelectedOrderForModal } = usePortal();

  // Dynamic Clients state from MongoDB Atlas
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Clients" | "Admins" | "Active" | "Pending">("All");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "orders">("newest");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [orderModalClientId, setOrderModalClientId] = useState("");
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [deletingClient, setDeletingClient] = useState<ClientAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for New User / Client onboarding
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    role: "client" as "client" | "admin",
    pageName: "",
    pageCategory: "Apparel & Clothing Store",
    pageFollowers: "25.0K followers",
    password: "client123",
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch users & clients from MongoDB Atlas API
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clients?role=all");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.clients)) {
          setClients(data.clients);
          // Expand first client by default if not set
          if (!expandedClientId && data.clients.length > 0) {
            setExpandedClientId(data.clients[0]._id || data.clients[0].id || "client-0");
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch clients from MongoDB:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchClients();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchClients();
      showNotification("User directory synchronized with live MongoDB Atlas!");
    } catch {
      showNotification("Failed to refresh user directory.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Onboard New User / Client Handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showNotification("Please provide user name and email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user account.");
      }

      showNotification(`User account '${formData.name}' onboarded successfully!`);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        businessName: "",
        email: "",
        phone: "",
        role: "client",
        pageName: "",
        pageCategory: "Apparel & Clothing Store",
        pageFollowers: "25.0K followers",
        password: "client123",
      });
      await fetchClients();
    } catch (err: unknown) {
      const error = err as Error;
      showNotification(error.message || "Failed to onboard user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update User Handler
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSubmitting(true);
    try {
      const id = editingClient._id || editingClient.id || editingClient.email;
      const payload: Record<string, any> = {
        name: editingClient.name,
        email: editingClient.email,
        businessName: editingClient.businessName,
        phone: editingClient.phone,
        role: editingClient.role || "client",
        connectedPage: editingClient.connectedPage,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update user.");
      }

      showNotification(`User '${editingClient.name || editingClient.businessName}' updated successfully!`);
      setEditingClient(null);
      setEditPassword("");
      await fetchClients();
    } catch (err: unknown) {
      const error = err as Error;
      showNotification(error.message || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User Handler
  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    if (deletingClient.email?.toLowerCase() === profile.email?.toLowerCase()) {
      showNotification("You cannot delete your own currently logged-in admin account!");
      setDeletingClient(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const id = deletingClient._id || deletingClient.id || deletingClient.email;
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete user account.");
      }

      showNotification(`User '${deletingClient.name || deletingClient.businessName}' deleted successfully.`);
      setDeletingClient(null);
      await fetchClients();
    } catch (err: unknown) {
      const error = err as Error;
      showNotification(error.message || "Failed to delete user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get matching orders for a client
  // Links primary Fashion Hub / Min Mart BD orders, or matches by brand name in campaignName / postUrl
  const getClientOrders = (client: ClientAccount): Order[] => {
    const brandLower = (client.businessName || "").toLowerCase();
    const ownerLower = (client.name || "").toLowerCase();

    // If client is primary brand (Fashion Hub, Min Mart BD or Tafsin)
    if (
      brandLower.includes("fashion hub") ||
      brandLower.includes("min mart") ||
      ownerLower.includes("tafsin") ||
      client.email === "tafsin@fashionhubbd.com"
    ) {
      return orders;
    }

    // Otherwise match against orders whose campaignName or postUrl contains brand keywords
    const matched = orders.filter((o) => {
      const cLower = o.campaignName.toLowerCase();
      const pLower = o.postUrl.toLowerCase();
      return (
        (brandLower && (cLower.includes(brandLower) || pLower.includes(brandLower))) ||
        (ownerLower && cLower.includes(ownerLower))
      );
    });

    return matched;
  };

  const getClientPortalOrders = (client: ClientAccount): Order[] => {
    return getClientOrders(client).filter((o) => !o.isExternalBoost && o.source !== "facebook_page_boost");
  };

  const getClientPageBoosts = (client: ClientAccount): Order[] => {
    return getClientOrders(client).filter((o) => o.isExternalBoost || o.source === "facebook_page_boost");
  };

  // Filtered and Sorted Clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const clientOrders = getClientOrders(client);
        const portalOrders = getClientPortalOrders(client);
        const activePortalCount = portalOrders.filter((o) => o.status === "Active").length;
        const pendingPortalCount = portalOrders.filter(
          (o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification"
        ).length;

        const q = searchQuery.toLowerCase();
        const matchesSearch =
          (client.businessName || "").toLowerCase().includes(q) ||
          (client.name || "").toLowerCase().includes(q) ||
          (client.connectedPage?.name || "").toLowerCase().includes(q) ||
          (client.phone || "").includes(q) ||
          (client.email || "").toLowerCase().includes(q);

        const matchesFilter =
          filterType === "All"
            ? true
            : filterType === "Clients"
            ? client.role === "client" || !client.role
            : filterType === "Admins"
            ? client.role === "admin"
            : filterType === "Active"
            ? activePortalCount > 0
            : pendingPortalCount > 0;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.businessName || a.name).localeCompare(b.businessName || b.name);
        }
        if (sortBy === "orders") {
          return getClientOrders(b).length - getClientOrders(a).length;
        }
        // Newest by default
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      });
  }, [clients, orders, searchQuery, filterType, sortBy]);

  // Totals across all clients
  const totalClientsCount = clients.length;
  const portalOrdersList = orders.filter((o) => !o.isExternalBoost && o.source !== "facebook_page_boost");
  const pageBoostsList = orders.filter((o) => o.isExternalBoost || o.source === "facebook_page_boost");
  const totalActiveAdsCount = portalOrdersList.filter((o) => o.status === "Active").length;
  const totalPendingOrdersCount = portalOrdersList.filter(
    (o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification"
  ).length;
  const totalDeliveredSpendUSD = portalOrdersList.reduce((sum, o) => sum + (o.totalBudgetUSD || 0), 0);
  const totalDeliveredSpendBDT = Math.round(totalDeliveredSpendUSD * exchangeRateBDT);

  return (
    <AdminLayout pageTitle="Client Accounts & Brand Portfolio">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#121826] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight">
                User & Client Accounts Management
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#3858F6] text-xs font-black">
                <span>{portalOrdersList.length} Portal Orders</span>
              </span>
              {pageBoostsList.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8F1] text-[#10B981] text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>{pageBoostsList.length} Connected FB Page Boosts</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {totalClientsCount} Registered Users
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium">
              Manage credentials, edit profile information, change passwords, and remove/delete accounts directly from live MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Live Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isMounted ? (isRefreshing || isLoading) : false}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#EEF2F6] border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Synchronize directory with MongoDB Atlas"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3858F6] ${
                  isMounted && (isRefreshing || isLoading) ? "animate-spin" : ""
                }`}
              />
              <span>{isMounted && (isRefreshing || isLoading) ? "Syncing..." : "Sync Live DB"}</span>
            </button>

            {/* Create Order Button */}
            <button
              onClick={() => {
                setOrderModalClientId("");
                setIsCreateOrderModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>+ Create Order</span>
            </button>

            {/* Add New User / Client Onboarding Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] active:scale-[0.99] text-white rounded-xl text-xs font-black shadow-md shadow-[#3858F6]/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create / Onboard User</span>
            </button>
          </div>
        </div>

        {/* 4 Dynamic Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Running Ads */}
          <div className="bg-[#3858F6] text-white p-6 rounded-[28px] shadow-xl shadow-[#3858F6]/25 flex flex-col justify-between min-h-[140px] relative overflow-hidden card-lift">
            <div className="flex items-center justify-between z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Megaphone className="w-5 h-5 stroke-[2.3]" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white flex items-center gap-1">
                Portal Orders
              </span>
            </div>
            <div className="z-10 mt-3">
              <div className="text-xs text-white/80 font-medium">Active Portal Boosts</div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                {totalActiveAdsCount} Active Boosts
              </div>
              <div className="text-[11px] text-white/70 font-medium mt-1 truncate">
                {portalOrdersList.length} Portal Orders{pageBoostsList.length > 0 ? ` • ${pageBoostsList.length} FB Page Boosts Synced` : " • 0 FB Boosts"}
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Onboarded Brands */}
          <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] card-lift">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#10B981]">
                MongoDB Active
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#8A94A6] font-medium">Onboarded Client Brands</div>
              <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalClientsCount} Brands
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1">
                Verified Meta Business Pages
              </div>
            </div>
          </div>

          {/* Card 3: Pending Review Requests */}
          <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] card-lift">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  totalPendingOrdersCount > 0
                    ? "bg-[#FEF3C7] text-[#D97706]"
                    : "bg-[#EAF8F1] text-[#10B981]"
                }`}
              >
                {totalPendingOrdersCount > 0 ? "Action Needed" : "All Clear"}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#8A94A6] font-medium">Pending Verifications</div>
              <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight mt-0.5">
                {totalPendingOrdersCount} Orders
              </div>
              <div className="text-[11px] text-[#8A94A6] font-medium mt-1">
                {totalPendingOrdersCount > 0
                  ? "Awaiting specialist approval & launch"
                  : "Zero unverified orders"}
              </div>
            </div>
          </div>

          {/* Card 4: Total Portfolio Spend */}
          <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px] card-lift">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF8F1] text-[#10B981] flex items-center justify-center">
                <DollarSign className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#3858F6] font-mono">
                ৳{exchangeRateBDT}/$1
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#8A94A6] font-medium">Total Portfolio Ad Spend</div>
              <div className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight mt-0.5">
                ${totalDeliveredSpendUSD.toFixed(0)} <span className="text-xs font-semibold text-slate-400">USD</span>
              </div>
              <div className="text-[11px] text-[#10B981] font-bold mt-1">
                ৳{totalDeliveredSpendBDT.toLocaleString()} BDT Total Billing
              </div>
            </div>
          </div>
        </div>

        {/* Filter, Search, and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E9EDF4] shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand name, owner, page, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-xs text-[#121826] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3858F6] font-medium"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#F5F7FB] p-1 rounded-xl border border-slate-200">
              {(["All", "Clients", "Admins", "Active", "Pending"] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterType === ft
                      ? "bg-white text-[#3858F6] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {ft === "All"
                    ? "All Users"
                    : ft === "Clients"
                    ? "Clients Only"
                    : ft === "Admins"
                    ? "Admins Only"
                    : ft === "Active"
                    ? "Active Boosts"
                    : "Pending"}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Added</option>
              <option value="name">Brand Name (A-Z)</option>
              <option value="orders">Most Boost Orders</option>
            </select>
          </div>
        </div>

        {/* Client Accounts Master Cards List */}
        {!isMounted || isLoading ? (
          <div className="bg-white p-12 rounded-[28px] border border-[#E9EDF4] text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#3858F6]/20 border-t-[#3858F6] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading client directory from MongoDB Atlas...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white p-12 rounded-[28px] border border-[#E9EDF4] text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-800">No client accounts match your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or click &apos;Onboard New Brand&apos; to register a client.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredClients.map((client) => {
              const clientOrders = getClientOrders(client);
              const clientPortalOrders = getClientPortalOrders(client);
              const clientPageBoosts = getClientPageBoosts(client);
              const runningPortalAds = clientPortalOrders.filter((o) => o.status === "Active");
              const pendingOrdersList = clientPortalOrders.filter(
                (o) => o.status === "Pending" || o.paymentStatus === "Awaiting Verification"
              );
              const completedCount = clientPortalOrders.filter((o) => o.status === "Completed").length;
              const totalClientSpendUSD = clientPortalOrders.reduce(
                (sum, o) => sum + (o.totalBudgetUSD || 0),
                0
              );
              const totalClientSpendBDT = Math.round(totalClientSpendUSD * exchangeRateBDT);

              const clientId = client._id || client.id || "client";
              const isExpanded = expandedClientId === clientId;
              const avatarInitials = getAvatarInitials(client.businessName || client.name);
              const avatarGradient = getAvatarGradient(client.businessName || client.name);

              const cleanPhone = (client.phone || "").replace(/[^0-9]/g, "");

              return (
                <div
                  key={clientId}
                  className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Client Main Header Row */}
                  <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[#F0F3F7]">
                    {/* Left: Brand Identity & Contact */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}
                      >
                        {avatarInitials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base sm:text-lg text-[#121826] truncate">
                            {client.businessName || client.name}
                          </h3>
                          {client.role === "admin" ? (
                            <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>Super Admin</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-[#EAF8F1] text-[#10B981] border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Client Account</span>
                            </span>
                          )}
                          {client.connectedPage?.verified && (
                            <span className="text-[10px] font-bold bg-[#EFF6FF] text-[#3858F6] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              Verified Page
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            Email: <strong className="text-slate-800">{client.email}</strong>
                            <button
                              onClick={(e) => handleCopy(client.email, `email-${clientId}`, e)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title="Copy email"
                            >
                              {copiedText === `email-${clientId}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            Owner: <strong>{client.name}</strong> ({client.phone || "No phone"})
                          </span>
                          <span>•</span>
                          <span>
                            Page: <strong>{client.connectedPage?.name || "Meta Page"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions, Badges & WhatsApp */}
                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                      {/* Live Running Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                            runningPortalAds.length > 0
                              ? "bg-[#EAF8F1] border-[#10B981]/40 text-[#059669]"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              runningPortalAds.length > 0 ? "bg-[#10B981] animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>
                            {runningPortalAds.length > 0
                              ? `${runningPortalAds.length} Portal Active`
                              : "0 Portal Orders"}
                          </span>
                        </div>

                        {clientPageBoosts.length > 0 && (
                          <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{clientPageBoosts.length} FB Page Boosts Connected</span>
                          </div>
                        )}
                      </div>

                      {/* Pending Pill if any */}
                      {pendingOrdersList.length > 0 && (
                        <Link
                          href="/admin/pending"
                          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#FFFBEB] border border-amber-200 text-[#D97706] hover:bg-[#FEF3C7] transition-colors"
                        >
                          {pendingOrdersList.length} Pending Approval
                        </Link>
                      )}

                      {/* Direct WhatsApp Client Button */}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                            client.name
                          )},%20regarding%20your%20Meta%20Ads%20boost%20campaigns%20for%20${encodeURIComponent(
                            client.businessName
                          )}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      {/* Direct Phone Call Button */}
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Call phone"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      {/* Create Order Button */}
                      <button
                        onClick={() => {
                          setOrderModalClientId(client._id || client.id || client.email);
                          setIsCreateOrderModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#3858F6] border border-blue-200 text-xs font-bold transition-colors cursor-pointer shadow-3xs"
                        title="Create new order for this client"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">+ Order</span>
                      </button>

                      {/* Edit User Button */}
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setEditPassword("");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Edit user details & password"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Delete User Button */}
                      <button
                        onClick={() => setDeletingClient(client)}
                        disabled={client.email?.toLowerCase() === profile.email?.toLowerCase()}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          client.email?.toLowerCase() === profile.email?.toLowerCase()
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 shadow-2xs"
                        }`}
                        title={
                          client.email?.toLowerCase() === profile.email?.toLowerCase()
                            ? "You cannot delete your own logged-in admin account"
                            : "Delete user account from MongoDB"
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>

                      {/* Expand/Collapse Accordion Button */}
                      <button
                        onClick={() => setExpandedClientId(isExpanded ? null : clientId)}
                        className="p-2 rounded-xl bg-[#F5F7FB] hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        aria-label="Toggle campaigns"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 4 Quick Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 sm:px-7 py-4 bg-[#FBFBFE] border-b border-[#F0F3F7] text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Portal In-App Orders:</span>
                      <div className="font-extrabold text-[#121826] text-sm mt-0.5">
                        {clientPortalOrders.length} Orders (0 Active)
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Connected Page Boosts:</span>
                      <div className="font-extrabold text-[#3858F6] text-sm mt-0.5">
                        {clientPageBoosts.length} Campaigns Synced
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Pending Approvals:</span>
                      <div className="font-extrabold text-[#D97706] text-sm mt-0.5">
                        {pendingOrdersList.length} In Review
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Page Followers:</span>
                      <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {client.connectedPage?.followers || "12.8K"}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section: Running and Past Ads */}
                  {isExpanded && (
                    <div className="p-6 sm:p-7 space-y-5 animate-in fade-in duration-150 bg-white">
                      {/* Section 1: In-App Portal Orders */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-[#3858F6]" />
                            <h4 className="font-extrabold text-sm text-[#121826]">
                              In-App Portal Orders ({clientPortalOrders.length})
                            </h4>
                          </div>
                        </div>

                        {clientPortalOrders.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                            <span>This client has not placed any boost orders through this software yet.</span>
                            <span className="text-[11px] font-bold text-slate-400">Queue Empty (0 Orders)</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clientPortalOrders.map((ad) => (
                              <div
                                key={ad.id}
                                className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-xs text-[#3858F6] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                                      {ad.id}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF8F1] text-[#10B981]">
                                      {ad.status}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-sm text-[#121826] mt-2 truncate">
                                    {ad.campaignName}
                                  </h5>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Connected Facebook Page Boosts */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h4 className="font-extrabold text-sm text-[#121826]">
                              Connected Facebook Page Boosts ({clientPageBoosts.length})
                            </h4>
                            <span className="text-[11px] font-bold text-slate-400">
                              (Direct from Meta Ads Manager for {client.connectedPage?.name || "Min Mart BD"})
                            </span>
                          </div>

                          <Link
                            href="/admin/orders"
                            className="text-xs font-bold text-[#3858F6] hover:underline flex items-center gap-1"
                          >
                            <span>View All in Master Table</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        {clientPageBoosts.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                            No external Facebook page boosts synced yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clientPageBoosts.map((ad) => (
                              <div
                                key={ad.id}
                                className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-xs text-[#3858F6] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                                        {ad.id}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                        FB Page
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                        ad.status === "Active"
                                          ? "bg-[#EAF8F1] text-[#10B981]"
                                          : ad.status === "Pending"
                                          ? "bg-[#FFFBEB] text-[#D97706]"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {ad.status === "Active" && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                      )}
                                      <span>{ad.status}</span>
                                    </span>
                                  </div>

                                  <h5 className="font-bold text-sm text-[#121826] mt-2 truncate">
                                    {ad.campaignName}
                                  </h5>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Goal: <strong>{ad.objective}</strong> • {ad.platform}
                                  </div>

                                  {/* Metrics */}
                                  <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-white border border-slate-100 text-[11px]">
                                    <div>
                                      <div className="text-slate-400">Budget:</div>
                                      <div className="font-bold text-slate-800">${ad.dailyBudgetUSD}/day</div>
                                    </div>
                                    <div>
                                      <div className="text-slate-400">Reach:</div>
                                      <div className="font-bold text-[#3858F6]">
                                        {ad.metrics?.reach ? `${(ad.metrics.reach / 1000).toFixed(1)}K` : "Live"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-slate-400">Inquiries:</div>
                                      <div className="font-bold text-[#10B981]">
                                        {ad.metrics?.conversations || 0}+
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400">
                                    {ad.durationDays} Days duration
                                  </span>
                                  <button
                                    onClick={() => setSelectedOrderForModal(ad)}
                                    className="text-xs font-bold text-[#3858F6] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Inspect Order</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboard New Client Brand Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#121826]">Onboard New Client Brand</h3>
                  <p className="text-xs text-slate-400">Register e-commerce client into MongoDB Atlas</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trendy Lifestyle BD"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahin Ahmed"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mahin@brand.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+880 1712-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    placeholder="client123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0F3F7]">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Connected Facebook Page Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trendy Lifestyle Bangladesh Official"
                  value={formData.pageName}
                  onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#3858F6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Page Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apparel & Clothing"
                    value={formData.pageCategory}
                    onChange={(e) => setFormData({ ...formData, pageCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#3858F6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Page Followers
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 35.0K followers"
                    value={formData.pageFollowers}
                    onChange={(e) => setFormData({ ...formData, pageFollowers: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#3858F6]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F3F7]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Onboarding..." : "Register Client Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#121826]">Edit Client Brand</h3>
                  <p className="text-xs text-slate-400">Update account credentials</p>
                </div>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={editingClient.businessName}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={editingClient.role || "client"}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, role: e.target.value as "client" | "admin" })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                  >
                    <option value="client">Client (E-Commerce Brand)</option>
                    <option value="admin">Super Admin / Agency Specialist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={editingClient.name}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingClient.phone}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingClient.email}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep current)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave empty to keep existing password.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Connected Facebook Page
                </label>
                <input
                  type="text"
                  value={editingClient.connectedPage?.name || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      connectedPage: {
                        ...editingClient.connectedPage,
                        name: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F3F7]">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-7 space-y-4 border border-slate-200 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 stroke-[2.3]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-lg text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>&apos;{deletingClient.name || deletingClient.businessName}&apos;</strong> ({deletingClient.email}) from MongoDB Atlas?
              </p>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] text-left leading-relaxed">
                ⚠️ This user account and their login credentials will be permanently erased.
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Order Modal */}
      <AdminCreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        initialClientId={orderModalClientId}
        clients={clients}
        onOrderCreated={(newOrder) => {
          showNotification(
            `Order #${newOrder.id} created successfully for ${
              newOrder.clientName || newOrder.clientEmail
            }!`
          );
          fetchClients();
        }}
      />
    </AdminLayout>
  );
}
