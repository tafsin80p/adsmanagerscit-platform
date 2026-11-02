"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Headphones,
  Camera,
  UploadCloud,
  Sliders,
  Sun,
  Moon,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { Order, ClientAccount } from "@/types";
import { AdminCreateOrderModal } from "@/components/modals/AdminCreateOrderModal";
import { ClientAvatar, getAvatarGradient, getAvatarInitials } from "@/components/ui/ClientAvatar";

export default function AdminClientsPage() {
  const { profile, orders, exchangeRateBDT, setSelectedOrderForModal } = usePortal();

  // Dynamic Clients state from MongoDB Atlas
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Clients" | "Managers" | "Support Agents" | "Admins" | "Active" | "Pending">("All");
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Copy feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for New User / Client onboarding
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    dollarRate: 150,
    role: "client" as "client" | "admin" | "representative" | "manager",
    assignedShift: "Day Shift" as "Day Shift" | "Night Shift" | "Rotational",
    pageName: "",
    pageCategory: "Apparel & Clothing Store",
    pageFollowers: "25.0K followers",
    avatar: "",
    password: "client123",
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUploadFileForEdit = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setEditingClient((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            avatar: data.url,
            connectedPage: prev.connectedPage
              ? { ...prev.connectedPage, avatar: data.url }
              : {
                  name: prev.businessName || prev.name,
                  followers: "10K followers",
                  category: "Shopping & Retail",
                  verified: true,
                  avatar: data.url,
                },
          };
        });
        showNotification("Profile logo uploaded! Click 'Save Changes' to update.");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: unknown) {
      const e = err as Error;
      showNotification(e.message || "Failed to upload image.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUploadFileForAdd = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setFormData((prev) => ({ ...prev, avatar: data.url }));
        showNotification("Profile logo uploaded successfully!");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: unknown) {
      const e = err as Error;
      showNotification(e.message || "Failed to upload image.");
    } finally {
      setIsUploadingAvatar(false);
    }
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

  // Onboard New User / Client / Support Representative Handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showNotification("Please provide user name and email.");
      return;
    }

    const isStaff = formData.role === "representative" || formData.role === "admin" || formData.role === "manager";
    if (!isStaff && !formData.businessName.trim()) {
      showNotification("Please provide Brand / Business Name for the client.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        assignedShift: (formData.role === "manager" || formData.role === "representative") ? (formData.assignedShift || "Day Shift") : undefined,
        password: formData.password.trim() || "staff123",
        businessName: isStaff
          ? (formData.businessName.trim() || (formData.role === "representative" ? "Support Representative" : formData.role === "manager" ? "Ads Campaign Manager" : "Platform Admin"))
          : formData.businessName.trim(),
        phone: isStaff ? "" : formData.phone.trim(),
        dollarRate: isStaff ? 150 : (Number(formData.dollarRate) || 150),
        pageName: isStaff ? "" : formData.pageName.trim(),
        pageCategory: formData.role === "manager" ? "Campaigns & Shifts" : isStaff ? "Customer Support" : formData.pageCategory.trim(),
        pageFollowers: formData.role === "manager" ? (formData.assignedShift || "Day Shift") : isStaff ? "Staff Member" : formData.pageFollowers.trim(),
        avatar: formData.avatar ? formData.avatar.trim() : undefined,
      };

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user account.");
      }

      showNotification(
        formData.role === "representative"
          ? `Support representative '${formData.name}' created successfully!`
          : formData.role === "manager"
          ? `Ads Campaign Manager '${formData.name}' (${formData.assignedShift}) onboarded successfully!`
          : formData.role === "admin"
          ? `Admin '${formData.name}' created successfully!`
          : `Client account '${formData.name}' onboarded successfully!`
      );
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        businessName: "",
        email: "",
        phone: "",
        dollarRate: 150,
        role: "client",
        assignedShift: "Day Shift",
        pageName: "",
        pageCategory: "Apparel & Clothing Store",
        pageFollowers: "25.0K followers",
        avatar: "",
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

    const isStaff = editingClient.role === "representative" || editingClient.role === "admin" || editingClient.role === "manager";
    if (!editingClient.name?.trim() || !editingClient.email?.trim()) {
      showNotification("Please provide user name and email.");
      return;
    }
    if (!isStaff && !editingClient.businessName?.trim()) {
      showNotification("Please provide Brand Name for the client.");
      return;
    }

    setIsSubmitting(true);
    try {
      const id = editingClient._id || editingClient.id || editingClient.email;
      const payload: Record<string, any> = {
        name: editingClient.name.trim(),
        email: editingClient.email.trim(),
        role: editingClient.role || "client",
        assignedShift: (editingClient.role === "manager" || editingClient.role === "representative") ? (editingClient.assignedShift || "Day Shift") : undefined,
        businessName: isStaff
          ? (editingClient.businessName?.trim() || (editingClient.role === "representative" ? "Support Representative" : editingClient.role === "manager" ? "Ads Campaign Manager" : "Platform Admin"))
          : editingClient.businessName.trim(),
        phone: isStaff ? "" : (editingClient.phone?.trim() || ""),
        dollarRate: isStaff ? 150 : (Number(editingClient.dollarRate) || 150),
        avatar: editingClient.avatar || editingClient.connectedPage?.avatar || "",
        connectedPage: isStaff
          ? undefined
          : {
              ...editingClient.connectedPage,
              avatar: editingClient.avatar || editingClient.connectedPage?.avatar || "",
            },
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
  // Matches by clientEmail, brand/businessName, clientName, connected Facebook Page, or keywords
  const getClientOrders = (client: ClientAccount): Order[] => {
    const brandLower = (client.businessName || "").toLowerCase().trim();
    const ownerLower = (client.name || "").toLowerCase().trim();
    const emailLower = (client.email || "").toLowerCase().trim();
    const pageNameLower = (client.connectedPage?.name || "").toLowerCase().trim();
    const pageId = client.connectedPage?.id;

    return orders.filter((o) => {
      // 1. Direct email match
      if (o.clientEmail && o.clientEmail.toLowerCase().trim() === emailLower) return true;

      // 2. Direct business / brand name match
      if (brandLower && o.businessName && o.businessName.toLowerCase().trim() === brandLower) return true;

      // 3. Direct client name match
      if (ownerLower && o.clientName && o.clientName.toLowerCase().trim() === ownerLower) return true;

      // 4. Connected Facebook page match
      if (pageNameLower && o.facebookPageName && o.facebookPageName.toLowerCase().trim() === pageNameLower) return true;
      if (pageId && o.facebookPageId && o.facebookPageId === pageId) return true;

      // 5. If client is primary brand (Fashion Hub, Min Mart BD or Tafsin)
      if (
        (brandLower.includes("fashion hub") ||
          brandLower.includes("min mart") ||
          ownerLower.includes("tafsin") ||
          emailLower === "tafsin@fashionhubbd.com") &&
        (!o.clientEmail || o.clientEmail === "tafsin@fashionhubbd.com")
      ) {
        return true;
      }

      // 6. Otherwise match against orders whose campaignName or postUrl contains brand keywords
      const cLower = (o.campaignName || "").toLowerCase();
      const pLower = (o.postUrl || "").toLowerCase();
      if (brandLower && (cLower.includes(brandLower) || pLower.includes(brandLower))) return true;
      if (ownerLower && cLower.includes(ownerLower)) return true;

      return false;
    });
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
            : filterType === "Managers"
            ? client.role === "manager"
            : filterType === "Support Agents"
            ? client.role === "representative"
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
              {(["All", "Clients", "Managers", "Support Agents", "Admins", "Active", "Pending"] as const).map((ft) => (
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
                    : ft === "Managers"
                    ? "🎯 Ads Managers"
                    : ft === "Support Agents"
                    ? "🎧 Support Agents"
                    : ft === "Admins"
                    ? "🛡️ Admins"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className="bg-white rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Top & Information Body */}
                  <div className="p-5 space-y-4">
                    {/* Header: Avatar, Name, Badges, Dollar Rate */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <ClientAvatar
                          avatarUrl={client.avatar}
                          fallbackUrl={client.connectedPage?.avatar}
                          name={client.role === "representative" ? client.name : (client.businessName || client.name)}
                          className="w-12 h-12 rounded-2xl"
                          textSize="text-base"
                        />

                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-extrabold text-sm sm:text-base text-[#121826] truncate"
                            title={client.role === "representative" ? client.name : (client.businessName || client.name)}
                          >
                            {client.role === "representative" ? client.name : (client.businessName || client.name)}
                          </h3>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {client.role === "admin" ? (
                              <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <ShieldCheck className="w-3 h-3 text-purple-600" />
                                <span>Super Admin</span>
                              </span>
                            ) : client.role === "manager" ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                  <Sliders className="w-3 h-3 text-indigo-600" />
                                  <span>Ads Manager</span>
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                                  client.assignedShift === "Night Shift"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : client.assignedShift === "Rotational"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {client.assignedShift === "Night Shift" ? "🌙 Night Shift" : client.assignedShift === "Rotational" ? "🔄 Rotational" : "☀️ Day Shift"}
                                </span>
                              </div>
                            ) : client.role === "representative" ? (
                              <span className="text-[10px] font-black bg-blue-50 text-[#3858F6] border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <Headphones className="w-3 h-3 text-[#3858F6]" />
                                <span>Support Agent</span>
                              </span>
                            ) : (
                              <>
                                <span className="text-[10px] font-bold bg-[#EAF8F1] text-[#10B981] border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Client</span>
                                </span>
                                {client.connectedPage?.verified && (
                                  <span className="text-[10px] font-bold bg-[#EFF6FF] text-[#3858F6] border border-[#BFDBFE] px-1.5 py-0.5 rounded-full shrink-0">
                                    Verified
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dollar Rate Badge for Client */}
                      {client.role === "client" || !client.role ? (
                        <div
                          className="px-2 py-1 rounded-xl text-xs font-black bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1 shrink-0 shadow-3xs"
                          title="Assigned Client Dollar Conversion Rate"
                        >
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <span>৳{client.dollarRate || 150}/$1</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Contact & Profile Details Box */}
                    <div className="text-xs space-y-1.5 bg-[#F8FAFC] p-3 rounded-2xl border border-[#F0F3F7]">
                      <div className="flex items-center justify-between gap-1 text-slate-600">
                        <span className="text-slate-400 font-medium text-[11px] shrink-0">Email:</span>
                        <div className="flex items-center gap-1 truncate font-semibold text-slate-800 text-[11px]">
                          <span className="truncate">{client.email}</span>
                          <button
                            onClick={(e) => handleCopy(client.email, `email-${clientId}`, e)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0 cursor-pointer"
                            title="Copy email"
                          >
                            {copiedText === `email-${clientId}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {client.role === "client" || !client.role ? (
                        <>
                          <div className="flex items-center justify-between gap-1 text-slate-600">
                            <span className="text-slate-400 font-medium text-[11px] shrink-0">Owner:</span>
                            <span className="font-semibold text-slate-800 text-[11px] truncate">
                              {client.name} {client.phone ? `(${client.phone})` : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-slate-600">
                            <span className="text-slate-400 font-medium text-[11px] shrink-0">Page:</span>
                            <span
                              className="font-semibold text-slate-800 text-[11px] truncate"
                              title={client.connectedPage?.name || "Meta Page"}
                            >
                              {client.connectedPage?.name || "Meta Page"}
                            </span>
                          </div>
                        </>
                      ) : client.role === "manager" ? (
                        <div className="text-[11px] font-bold text-indigo-700 pt-0.5 flex items-center gap-1.5">
                          <Sliders className="w-3 h-3 text-indigo-600" />
                          <span>Campaign Specialist • {client.assignedShift || "Day Shift"}</span>
                        </div>
                      ) : client.role === "representative" ? (
                        <div className="text-[11px] font-bold text-[#3858F6] pt-0.5 flex items-center gap-1">
                          <Headphones className="w-3 h-3" />
                          <span>Customer Care Support Representative</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-purple-700 pt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>System Platform Administrator</span>
                        </div>
                      )}
                    </div>

                    {/* Quick 2x2 Metrics Box */}
                    {client.role === "manager" ? (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Role:</span>
                          <span className="font-extrabold text-indigo-700 text-xs">Campaign Manager</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Work Shift:</span>
                          <span className="font-extrabold text-slate-800 text-xs">{client.assignedShift || "Day Shift"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Assigned Desk:</span>
                          <span className="font-extrabold text-[#3858F6] text-xs">Client Boost Desk</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Payments:</span>
                          <span className="font-extrabold text-emerald-600 text-xs">Confirm & Launch</span>
                        </div>
                      </div>
                    ) : client.role === "representative" ? (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Assigned Desk:</span>
                          <span className="font-extrabold text-[#3858F6] text-xs">Live Chat Desk</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Lookup:</span>
                          <span className="font-extrabold text-slate-800 text-xs">Orders Search</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Account Access:</span>
                          <span className="font-extrabold text-emerald-600 text-xs">Online Agent</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Support Queue:</span>
                          <span className="font-extrabold text-slate-800 text-xs">Active Staff</span>
                        </div>
                      </div>
                    ) : client.role === "admin" ? (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Access:</span>
                          <span className="font-extrabold text-purple-700 text-xs">Super Admin</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Desk:</span>
                          <span className="font-extrabold text-slate-800 text-xs">Full Control</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Settings & Rates:</span>
                          <span className="font-extrabold text-emerald-600 text-xs">Global Master</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Status:</span>
                          <span className="font-extrabold text-purple-700 text-xs">Active Admin</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#FBFBFE] p-3 rounded-2xl border border-[#F0F3F7]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Portal Orders:</span>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {clientPortalOrders.length} ({runningPortalAds.length} Active)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Page Boosts:</span>
                          <span className="font-extrabold text-[#3858F6] text-xs">
                            {clientPageBoosts.length} Synced
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Approvals:</span>
                          <span
                            className={`font-extrabold text-xs ${
                              pendingOrdersList.length > 0 ? "text-amber-600 font-black" : "text-slate-800"
                            }`}
                          >
                            {pendingOrdersList.length} Pending
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Page Followers:</span>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {client.connectedPage?.followers || "12.8K"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions & Expandable Orders */}
                  <div className="bg-[#FAFBFD] p-3.5 border-t border-[#F0F3F7] space-y-3">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      {/* Left: Communication & Quick Order */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {client.role === "client" || !client.role ? (
                          <>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                                  client.name
                                )},%20regarding%20your%20Meta%20Ads%20boost%20campaigns.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white transition-colors shadow-3xs cursor-pointer"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {cleanPhone && (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-3xs cursor-pointer"
                                title="Call Phone"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setOrderModalClientId(client._id || client.id || client.email);
                                setIsCreateOrderModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#3858F6] border border-blue-200 text-xs font-bold transition-colors cursor-pointer shadow-3xs"
                              title="Create order for this client"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Order</span>
                            </button>

                            <button
                              onClick={() => setExpandedClientId(isExpanded ? null : clientId)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                isExpanded
                                  ? "bg-[#3858F6] text-white border-[#3858F6]"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                              title="Toggle Campaigns"
                            >
                              <span>Ads ({clientOrders.length})</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </>
                        ) : null}
                      </div>

                      {/* Right: Edit & Delete */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setEditPassword("");
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingClient(client)}
                          disabled={client.email?.toLowerCase() === profile.email?.toLowerCase()}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            client.email?.toLowerCase() === profile.email?.toLowerCase()
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300"
                          }`}
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Section inside the Grid Card */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-extrabold text-[#121826]">
                          <span>In-App Orders ({clientPortalOrders.length})</span>
                          <Link
                            href="/admin/orders"
                            className="text-[11px] font-bold text-[#3858F6] hover:underline"
                          >
                            All Orders →
                          </Link>
                        </div>

                        {clientPortalOrders.length === 0 ? (
                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-400 text-center">
                            No in-app portal orders placed yet.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {clientPortalOrders.map((ad) => (
                              <div
                                key={ad.id}
                                className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs gap-2 shadow-3xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[10px] text-[#3858F6] bg-blue-50 px-1.5 py-0.2 rounded">
                                      {ad.id}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-800 truncate block">
                                      {ad.campaignName}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    ${ad.totalBudgetUSD.toFixed(2)} USD • {ad.postType}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    ad.status === "Active"
                                      ? "bg-[#EAF8F1] text-[#10B981]"
                                      : ad.status === "Pending"
                                      ? "bg-[#FFFBEB] text-[#D97706]"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {ad.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Connected FB Page Boosts */}
                        <div className="pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>FB Page Boosts ({clientPageBoosts.length})</span>
                            </span>
                          </div>

                          {clientPageBoosts.length === 0 ? (
                            <div className="p-2 rounded-xl bg-white border border-slate-200 text-center text-[10px] text-slate-400">
                              No external page boosts synced yet.
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                              {clientPageBoosts.map((ad) => (
                                <div
                                  key={ad.id}
                                  className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-3xs"
                                >
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-bold text-slate-800 truncate block">
                                      {ad.campaignName}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ${ad.dailyBudgetUSD}/day • Reach: {ad.metrics?.reach ? `${(ad.metrics.reach / 1000).toFixed(1)}K` : "Live"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForModal(ad)}
                                    className="text-[10px] font-bold text-[#3858F6] hover:underline shrink-0"
                                  >
                                    Inspect
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboard / Create User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    formData.role === "manager"
                      ? "bg-indigo-50 text-indigo-600"
                      : formData.role === "representative"
                      ? "bg-blue-50 text-[#3858F6]"
                      : formData.role === "admin"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-[#EEF2FF] text-[#3858F6]"
                  }`}
                >
                  {formData.role === "manager" ? (
                    <Sliders className="w-4 h-4" />
                  ) : formData.role === "representative" ? (
                    <Headphones className="w-4 h-4" />
                  ) : formData.role === "admin" ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Building className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#121826]">
                    {formData.role === "manager"
                      ? "Create Ads Campaign Manager"
                      : formData.role === "representative"
                      ? "Create Support Representative"
                      : formData.role === "admin"
                      ? "Create Administrator Account"
                      : "Onboard New Client Brand"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formData.role === "manager"
                      ? "Register shift specialist to manage boosts and verify payments"
                      : formData.role === "representative"
                      ? "Register customer support agent for Live Chat"
                      : formData.role === "admin"
                      ? "Register administrator with full platform control"
                      : "Register e-commerce client into MongoDB Atlas"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              {/* Account Role & Access Level Dropdown at TOP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Role & Access Level *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                >
                  <option value="client">Client (E-Commerce Brand Portal)</option>
                  <option value="manager">🎯 Ads Campaign Manager (Day/Night Shift Operator)</option>
                  <option value="representative">🎧 Support Representative (Customer Care Agent)</option>
                  <option value="admin">🛡️ Super Admin (Full Platform Access)</option>
                </select>
              </div>

              {/* Informational banner when manager is selected */}
              {(formData.role === "manager" || formData.role === "representative") && (
                <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-2.5 text-xs text-indigo-950">
                  <div className="flex items-start gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-900">
                        {formData.role === "manager" ? "Ads Campaign Manager Shift Mode" : "Support Representative Working Shift"}
                      </span>
                      <p className="text-[11px] text-indigo-800/90 mt-0.5 leading-relaxed">
                        ডে শিফট সকাল ১০:০০ টা থেকে রাত ০৮:০০ টা এবং নাইট শিফট সন্ধ্যা ০৭:০০ টা থেকে রাত ০২:৩০ টা পর্যন্ত কার্যকর থাকবে।
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      Assigned Working Shift (দায়িত্বপ্রাপ্ত শিফট) *
                    </label>
                    <select
                      value={formData.assignedShift}
                      onChange={(e) => setFormData({ ...formData, assignedShift: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                    >
                      <option value="Day Shift">☀️ Day Shift (10:00 AM - 08:00 PM BST)</option>
                      <option value="Night Shift">🌙 Night Shift (07:00 PM - 02:30 AM BST)</option>
                      <option value="Rotational">🔄 Rotational Shift (উভয় শিফটে শিফটিং)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Informational banner when representative is selected */}
              {formData.role === "representative" && (
                <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Headphones className="w-4 h-4 text-[#3858F6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#3858F6]">Customer Support Representative Mode</span>
                    <p className="text-[11px] text-blue-800/80 mt-0.5">
                      কাস্টমার সাপোর্ট এজেন্টের জন্য শুধু নাম, অফিসিয়াল ইমেইল ও পাসওয়ার্ড প্রদান করুন। ফেসবুক পেজ বা ব্র্যান্ড ইনফরমেশন প্রয়োজন নেই।
                    </p>
                  </div>
                </div>
              )}

              {/* Client-only field: Brand / Business Name */}
              {formData.role === "client" && (
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
              )}

              {/* Profile Logo Upload */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200/90 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Profile Picture / Brand Logo (ঐচ্ছিক লোগো বা ছবি)
                </label>
                <div className="flex items-center gap-3">
                  <ClientAvatar
                    avatarUrl={formData.avatar}
                    name={formData.businessName || formData.name || "Brand"}
                    className="w-12 h-12 rounded-xl"
                    textSize="text-sm"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-[#3858F6]" />
                        ) : (
                          <Camera className="w-3 h-3 text-[#3858F6]" />
                        )}
                        <span>{isUploadingAvatar ? "Uploading..." : "Upload Logo"}</span>
                      </button>
                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, avatar: "" }))}
                          className="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFileForAdd(file);
                      }}
                    />
                    <input
                      type="url"
                      placeholder="Or paste image URL (https://...)"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.role === "client"
                      ? "Owner Full Name *"
                      : "Representative / Staff Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formData.role === "client" ? "e.g. Mahin Ahmed" : "e.g. Support Specialist"
                    }
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.role === "client"
                      ? "Email Address *"
                      : "Official Work Email *"}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={
                      formData.role === "client"
                        ? "mahin@brand.com"
                        : "support@shopnocareer.com"
                    }
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>
              </div>

              {/* Password & WhatsApp (WhatsApp only for client) */}
              {formData.role === "client" ? (
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
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="client123"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter staff login password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6]"
                  />
                </div>
              )}

              {/* Facebook Page & Dollar Rate fields (Client only) */}
              {formData.role === "client" && (
                <>
                  {/* Assigned Dollar Rate Field */}
                  <div className="p-3.5 bg-gradient-to-br from-[#F5F9FF] to-[#EEF4FF] border border-[#D0E2FF] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#3858F6]" />
                        <span>Client Dollar Rate (ডলার রেট) *</span>
                      </label>
                      <span className="text-xs font-extrabold text-[#3858F6] bg-blue-100/80 px-2 py-0.5 rounded-md">
                        ৳{formData.dollarRate || 150} / USD
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dollarRate: 148 })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                          formData.dollarRate === 148
                            ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        ৳148 / USD
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dollarRate: 150 })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                          formData.dollarRate === 150
                            ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        ৳150 / USD
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          step="any"
                          value={formData.dollarRate || 150}
                          onChange={(e) =>
                            setFormData({ ...formData, dollarRate: Number(e.target.value) || 150 })
                          }
                          placeholder="Custom Rate"
                          className="w-full py-1.5 px-2 bg-white text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:border-[#3858F6] focus:outline-none text-center"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      এই ক্লায়েন্টের জন্য ডলার রেট নির্ধারণ করুন (148 বা 150 সিলেক্ট করুন অথবা কাস্টম রেট লিখুন)।
                    </p>
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
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F3F7]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Processing..."
                    : formData.role === "representative"
                    ? "Create Support Representative"
                    : formData.role === "admin"
                    ? "Create Administrator"
                    : "Register Client Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    editingClient.role === "representative"
                      ? "bg-blue-50 text-[#3858F6]"
                      : editingClient.role === "admin"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-[#EEF2FF] text-[#3858F6]"
                  }`}
                >
                  {editingClient.role === "representative" ? (
                    <Headphones className="w-4 h-4" />
                  ) : editingClient.role === "admin" ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Edit2 className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#121826]">
                    {editingClient.role === "representative"
                      ? "Edit Support Representative"
                      : editingClient.role === "admin"
                      ? "Edit Administrator"
                      : "Edit Client Brand"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingClient.role === "representative"
                      ? "Update support specialist credentials"
                      : editingClient.role === "admin"
                      ? "Update admin account and access level"
                      : "Update account credentials and brand details"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              {/* Account Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role & Access Level</label>
                <select
                  value={editingClient.role || "client"}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, role: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                >
                  <option value="client">Client (E-Commerce Brand)</option>
                  <option value="manager">🎯 Ads Campaign Manager (Day/Night Shift Operator)</option>
                  <option value="representative">🎧 Support Representative (Customer Care Agent)</option>
                  <option value="admin">🛡️ Super Admin / Platform Specialist</option>
                </select>
              </div>

              {/* Informational banner & Shift Selector when manager is selected */}
              {(editingClient.role === "manager" || editingClient.role === "representative") && (
                <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-2.5 text-xs text-indigo-950">
                  <div className="flex items-start gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-900">
                        {editingClient.role === "manager" ? "Ads Campaign Manager Desk Mode" : "Support Representative Working Shift"}
                      </span>
                      <p className="text-[11px] text-indigo-800/90 mt-0.5">
                        ডে শিফট সকাল ১০:০০ টা থেকে রাত ০৮:০০ টা এবং নাইট শিফট সন্ধ্যা ০৭:০০ টা থেকে রাত ০২:৩০ টা পর্যন্ত কার্যকর থাকবে।
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      Assigned Working Shift (দায়িত্বপ্রাপ্ত শিফট) *
                    </label>
                    <select
                      value={editingClient.assignedShift || "Day Shift"}
                      onChange={(e) => setEditingClient({ ...editingClient, assignedShift: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                    >
                      <option value="Day Shift">☀️ Day Shift (10:00 AM - 08:00 PM BST)</option>
                      <option value="Night Shift">🌙 Night Shift (07:00 PM - 02:30 AM BST)</option>
                      <option value="Rotational">🔄 Rotational Shift (উভয় শিফটে শিফটিং)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Informational banner when representative is selected */}
              {editingClient.role === "representative" && (
                <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Headphones className="w-4 h-4 text-[#3858F6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#3858F6]">Customer Support Representative Mode</span>
                    <p className="text-[11px] text-blue-800/80 mt-0.5">
                      এই ইউজারের শুধুমাত্র লাইভ চ্যাট ও অর্ডার সার্চ এক্সেস রয়েছে। কোনো ফেসবুক পেজ বা ব্র্যান্ড ইনফরমেশন প্রয়োজন নেই।
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Avatar & Logo Uploader */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200/90 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Profile Picture / Brand Logo (প্রোফাইল ছবি / লোগো)
                </label>
                <div className="flex items-center gap-3">
                  <ClientAvatar
                    avatarUrl={editingClient.avatar}
                    fallbackUrl={editingClient.connectedPage?.avatar}
                    name={editingClient.businessName || editingClient.name}
                    className="w-14 h-14 rounded-2xl"
                    textSize="text-lg"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3858F6]" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-[#3858F6]" />
                        )}
                        <span>{isUploadingAvatar ? "Uploading..." : "Upload Logo / Photo"}</span>
                      </button>
                      {(editingClient.avatar || editingClient.connectedPage?.avatar) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClient((prev) => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                avatar: "",
                                connectedPage: prev.connectedPage
                                  ? { ...prev.connectedPage, avatar: "" }
                                  : {
                                      name: prev.businessName || prev.name,
                                      followers: "10K followers",
                                      category: "Shopping & Retail",
                                      verified: true,
                                      avatar: "",
                                    },
                              };
                            });
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFileForEdit(file);
                      }}
                    />
                    <input
                      type="url"
                      placeholder="Or paste image URL (https://...)"
                      value={editingClient.avatar || ""}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        setEditingClient((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            avatar: newUrl,
                            connectedPage: prev.connectedPage
                              ? { ...prev.connectedPage, avatar: newUrl }
                              : {
                                  name: prev.businessName || prev.name,
                                  followers: "10K followers",
                                  category: "Shopping & Retail",
                                  verified: true,
                                  avatar: newUrl,
                                },
                          };
                        });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Name (Client only) */}
              {editingClient.role === "client" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={editingClient.businessName || ""}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                  />
                </div>
              )}

              {/* Name & Phone */}
              {editingClient.role === "client" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name *</label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (WhatsApp)</label>
                    <input
                      type="text"
                      value={editingClient.phone || ""}
                      onChange={(e) =>
                        setEditingClient({ ...editingClient, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#121826]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingClient.role === "representative" ? "Representative Name *" : "Administrator Name *"}
                  </label>
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
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
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

              {/* Dollar Rate Setting (Client only) */}
              {editingClient.role === "client" && (
                <div className="p-3.5 bg-gradient-to-br from-[#F5F9FF] to-[#EEF4FF] border border-[#D0E2FF] rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#3858F6]" />
                      <span>Assigned Dollar Rate (ডলার রেট) *</span>
                    </label>
                    <span className="text-xs font-extrabold text-[#3858F6] bg-blue-100/80 px-2 py-0.5 rounded-md">
                      ৳{editingClient.dollarRate || 150} / USD
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingClient({ ...editingClient, dollarRate: 148 })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                        editingClient.dollarRate === 148
                          ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ৳148 / USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingClient({ ...editingClient, dollarRate: 150 })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                        editingClient.dollarRate === 150
                          ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ৳150 / USD
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        step="any"
                        value={editingClient.dollarRate || 150}
                        onChange={(e) =>
                          setEditingClient({
                            ...editingClient,
                            dollarRate: Number(e.target.value) || 150,
                          })
                        }
                        placeholder="Custom Rate"
                        className="w-full py-1.5 px-2 bg-white text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:border-[#3858F6] focus:outline-none text-center"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    রেট পরিবর্তন করলে এই ক্লায়েন্টের পরবর্তী সকল অর্ডার ও কনভার্সন এই রেট অনুযায়ী হিসাব হবে।
                  </p>
                </div>
              )}

              {/* Connected Facebook Page (Client only) */}
              {editingClient.role === "client" && (
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
              )}

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
                  className="px-5 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
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
