"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Info,
  Smartphone,
  Unlink,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order } from "@/types";

export default function AdminMetaIntegrationPage() {
  const {
    orders,
    refreshOrders,
    refreshSettings,
    disconnectMetaApi,
    metaApiConnected,
    metaAccountName,
    metaAdAccountId,
  } = usePortal();

  // Credentials State
  const [adAccountId, setAdAccountId] = useState(metaAdAccountId || "");
  const [accessToken, setAccessToken] = useState("");
  const [appId, setAppId] = useState("");
  const [pageId, setPageId] = useState("");

  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    account?: any;
    error?: string;
  } | null>(null);

  // Multiple Discovered Ad Accounts State
  const [discoveredAccounts, setDiscoveredAccounts] = useState<any[]>([]);
  const [selectedAdAccountForCampaigns, setSelectedAdAccountForCampaigns] = useState<string>("");
  const [activeAccountDetails, setActiveAccountDetails] = useState<any>(null);
  const [newAccountIdToAdd, setNewAccountIdToAdd] = useState("");
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Campaigns list from Meta
  const [metaCampaigns, setMetaCampaigns] = useState<any[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(!metaApiConnected);

  // Linking Modal State
  const [selectedCampaignToLink, setSelectedCampaignToLink] = useState<any | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load existing settings
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.metaAdAccountId) setAdAccountId(s.metaAdAccountId);
          if (s.metaAccessToken) setAccessToken(s.metaAccessToken);
          if (s.metaAppId) setAppId(s.metaAppId);
          if (s.metaPageId) setPageId(s.metaPageId);
          if (s.metaAdAccounts && Array.isArray(s.metaAdAccounts)) {
            setDiscoveredAccounts(s.metaAdAccounts);
            if (s.metaAdAccounts.length > 0) {
              const primaryId = s.metaAdAccountId || s.metaAdAccounts[0].id;
              setSelectedAdAccountForCampaigns(primaryId);
              const found = s.metaAdAccounts.find((a: any) => a.id === primaryId);
              if (found) setActiveAccountDetails(found);
            }
          }
        }
      })
      .catch((err) => console.warn("Failed to load settings:", err));

    fetchCampaigns();
  }, []);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectMetaApi();
      setAdAccountId("");
      setAccessToken("");
      setAppId("");
      setPageId("");
      setDiscoveredAccounts([]);
      setSelectedAdAccountForCampaigns("");
      setActiveAccountDetails(null);
      setMetaCampaigns([]);
      setIsSandboxMode(true);
      setTestResult({
        success: true,
        message: "Meta Ads Manager successfully disconnected.",
      });
      setShowDisconnectModal(false);
      await refreshOrders();
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to disconnect Meta Ads Manager.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRemoveAccount = async (accId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove account ${accId}?`)) return;
    const remaining = discoveredAccounts.filter((a) => a.id !== accId);
    setDiscoveredAccounts(remaining);
    if (selectedAdAccountForCampaigns === accId) {
      const nextId = remaining[0]?.id || "";
      setSelectedAdAccountForCampaigns(nextId);
      setActiveAccountDetails(remaining[0] || null);
      if (nextId) fetchCampaigns(nextId);
      else setMetaCampaigns([]);
    }
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaAdAccounts: remaining,
        metaAdAccountId: remaining[0]?.id || "",
        metaAccountName: remaining[0]?.name || "",
        metaApiConnected: remaining.length > 0,
      }),
    });
    await refreshSettings();
  };

  const fetchCampaigns = async (accId?: string) => {
    setIsLoadingCampaigns(true);
    try {
      const targetAcc = accId || selectedAdAccountForCampaigns;
      const url = targetAcc ? `/api/meta/campaigns?adAccountId=${targetAcc}` : "/api/meta/campaigns";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setMetaCampaigns(data.campaigns);
        setIsSandboxMode(Boolean(data.isSandbox));
        if (data.selectedAccount) {
          setActiveAccountDetails(data.selectedAccount);
        }
        if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
          setDiscoveredAccounts(data.accounts);
          if (!selectedAdAccountForCampaigns) {
            setSelectedAdAccountForCampaigns(targetAcc || data.accounts[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Meta campaigns:", err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleTestConnection = async () => {
    if (!accessToken || !accessToken.trim()) {
      setTestResult({
        success: false,
        error: "Please enter your Meta System User Access Token.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/meta/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId,
          accessToken,
          appId,
          pageId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          account: data.account,
        });
        if (data.account) {
          setActiveAccountDetails(data.account);
        }
        if (data.account?.id) {
          setAdAccountId(data.account.id);
        }
        if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
          setDiscoveredAccounts(data.accounts);
          setSelectedAdAccountForCampaigns(data.account?.id || data.accounts[0].id);
        }
        setIsSandboxMode(false);
        fetchCampaigns(data.account?.id || data.accounts?.[0]?.id);
      } else {
        setTestResult({
          success: false,
          error: data.error || "Connection failed. Please verify your token and account permissions.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Network error testing Meta connection.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddExtraAccount = async () => {
    if (!newAccountIdToAdd.trim() || !accessToken) return;
    setIsAddingAccount(true);
    try {
      const res = await fetch("/api/meta/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId: newAccountIdToAdd.trim(),
          accessToken,
          appId,
          pageId,
        }),
      });
      const data = await res.json();
      if (data.success && data.accounts) {
        setDiscoveredAccounts(data.accounts);
        setNewAccountIdToAdd("");
        if (data.account) {
          setSelectedAdAccountForCampaigns(data.account.id);
          setActiveAccountDetails(data.account);
          fetchCampaigns(data.account.id);
        }
      }
    } catch (err) {
      console.warn("Failed to add extra account:", err);
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleSyncAllOrders = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        await refreshOrders();
        fetchCampaigns();
      }
    } catch (err) {
      console.warn("Sync failed:", err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleLinkCampaignToOrder = async () => {
    if (!selectedCampaignToLink || !targetOrderId) return;
    setIsLinking(true);
    try {
      const targetOrder = orders.find((o) => o.id === targetOrderId);
      const res = await fetch(`/api/orders/${targetOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaCampaignId: selectedCampaignToLink.id,
          metaAdAccountId: selectedAdAccountForCampaigns || adAccountId,
          metaAccountName: discoveredAccounts.find((a) => a.id === (selectedAdAccountForCampaigns || adAccountId))?.name || "Meta Ad Account",
          status: "Active",
          metrics: selectedCampaignToLink.insights
            ? {
                reach: selectedCampaignToLink.insights.reach,
                impressions: selectedCampaignToLink.insights.impressions,
                conversations: selectedCampaignToLink.insights.conversations,
                spendUSD: parseFloat(selectedCampaignToLink.insights.spend),
                ctr: selectedCampaignToLink.insights.ctr,
                cpm: selectedCampaignToLink.insights.cpm,
                lastUpdated: "Linked to Meta Campaign",
              }
            : targetOrder?.metrics,
        }),
      });

      if (res.ok) {
        setLinkSuccess(
          `Successfully linked Meta Campaign "${selectedCampaignToLink.name}" to Order #${targetOrderId}!`
        );
        await refreshOrders();
        setTimeout(() => {
          setSelectedCampaignToLink(null);
          setLinkSuccess(null);
        }, 2000);
      }
    } catch (err) {
      console.warn("Failed to link campaign:", err);
    } finally {
      setIsLinking(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AdminLayout pageTitle="Meta Ads Manager Integration">
      <div className="space-y-6 sm:space-y-7">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#121826] tracking-tight">
                Meta Ads Manager API
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  metaApiConnected
                    ? "bg-[#EAF8F1] text-[#10B981] border-[#10B981]/20"
                    : "bg-[#FFFBEB] text-[#D97706] border-amber-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    metaApiConnected
                      ? "bg-[#10B981] animate-pulse"
                      : "bg-[#D97706]"
                  }`}
                />
                {metaApiConnected
                  ? "Connected to Meta Graph API v19.0"
                  : "Not Connected (Real Token Required)"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A94A6] font-medium mt-1">
              Connect your specialist Meta Ads Manager account to stream verified Reach, Ad Impressions, WhatsApp leads, and Spent USD directly to client dashboards.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSyncAllOrders}
              disabled={isSyncingAll || isDisconnecting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>{isSyncingAll ? "Syncing with Meta..." : "Sync All Active Boosts"}</span>
            </button>

            {(metaApiConnected || accessToken || discoveredAccounts.length > 0) && (
              <button
                type="button"
                onClick={() => setShowDisconnectModal(true)}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Unlink className="w-3.5 h-3.5 text-rose-600" />
                <span>Disconnect Meta</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Section: Left (Credentials Form) | Right (Instructions & Active Account Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Meta Configuration Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0866FF]/10 text-[#0866FF] flex items-center justify-center font-bold">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#121826]">
                    Meta Marketing API Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Facebook & Instagram Ads Manager Account Access
                  </p>
                </div>
              </div>

              {metaApiConnected && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Verified Connection
                </span>
              )}
            </div>

            {/* Test result alert */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  testResult.success
                    ? "bg-[#EAF8F1] border-[#10B981]/30 text-[#065F46]"
                    : "bg-[#FEF2F2] border-red-200 text-red-800"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">
                    {testResult.success ? "Connection Verified!" : "Connection Failed"}
                  </div>
                  <div className="text-[11px]">{testResult.message || testResult.error}</div>
                  {testResult.account && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white/95 border border-emerald-200 text-xs space-y-2 font-sans">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                        <span className="font-extrabold text-emerald-950 text-xs">
                          {testResult.account.name}
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          {testResult.account.id}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Spent</span>
                          <span className="text-xs font-black text-rose-600">
                            ${testResult.account.totalSpent || "0.00"} {testResult.account.currency || "USD"}
                          </span>
                        </div>
                        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Balance / Fund</span>
                          <span className="text-xs font-black text-emerald-700">
                            ${testResult.account.balance || "0.00"} {testResult.account.currency || "USD"}
                          </span>
                        </div>
                        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Spend Limit</span>
                          <span className="text-xs font-black text-slate-800">
                            {testResult.account.spendCap && testResult.account.spendCap !== "Unlimited"
                              ? `$${testResult.account.spendCap}`
                              : "Unlimited"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Field 1: Meta System User Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    System User Access Token <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-discovers All Ad Accounts
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAABwz..."
                    className="w-full bg-[#F6F8FC] focus:bg-white text-xs font-mono font-medium text-[#121826] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ✨ No need to manually type Ad Account ID — all ad accounts assigned to this token will automatically load below.
                </p>
              </div>

              {/* Optional Fields: App ID & Page ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meta App ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="e.g. 192837465019"
                    className="w-full bg-[#F6F8FC] focus:bg-white text-xs font-mono text-[#121826] px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Agency Facebook Page ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="e.g. 109283746519"
                    className="w-full bg-[#F6F8FC] focus:bg-white text-xs font-mono text-[#121826] px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Disconnect Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isDisconnecting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isTesting ? "animate-pulse" : ""}`} />
                  <span>{isTesting ? "Testing Connection..." : "Test & Save Connection"}</span>
                </button>

                {(metaApiConnected || accessToken || discoveredAccounts.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setShowDisconnectModal(true)}
                    disabled={isDisconnecting || isTesting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Unlink className="w-3.5 h-3.5 text-rose-600" />
                    <span>Disconnect Integration</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                Credentials are encrypted and saved to MongoDB Atlas
              </span>
            </div>
          </div>

          {/* Right Column (5 cols): Bangla & English Setup Guide */}
          <div className="lg:col-span-5 space-y-5">
            {/* Guide Card */}
            <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#121826]">
                <HelpCircle className="w-4 h-4 text-[#0866FF]" />
                <span>How to obtain your Meta System User Token:</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#3858F6] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Go to <span className="font-bold text-slate-800">Meta Business Suite</span>:{" "}
                    <a
                      href="https://business.facebook.com/settings/system-users"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0866FF] hover:underline font-semibold inline-flex items-center gap-0.5"
                    >
                      <span>business.facebook.com/settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#3858F6] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    In <span className="font-bold text-slate-800">System Users</span>, create a system user and grant Admin access to your <strong>Ad Accounts</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#3858F6] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Click <strong>Generate New Token</strong> and select permissions:{" "}
                    <span className="bg-slate-100 text-[#0866FF] px-1 py-0.5 rounded font-mono font-bold">
                      ads_read
                    </span>
                    ,{" "}
                    <span className="bg-slate-100 text-[#0866FF] px-1 py-0.5 rounded font-mono font-bold">
                      ads_management
                    </span>
                    , and{" "}
                    <span className="bg-slate-100 text-[#0866FF] px-1 py-0.5 rounded font-mono font-bold">
                      read_insights
                    </span>
                    .
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#3858F6] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    Copy the generated token, paste it in the box on the left, and click <strong>Test & Save Connection</strong>.
                  </div>
                </div>
              </div>

              {/* What client sees */}
              <div className="p-3.5 bg-gradient-to-br from-[#F6F8FC] to-[#EEF3FB] rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>What clients will see live:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Once a Meta campaign is linked to an order, the client will see live <strong>Spend ($), Ad Views / Impressions, Reach</strong>, and <strong>WhatsApp/Messenger Leads</strong> directly on their portal in real time.
                </p>
              </div>

              {/* Multi-Account Isolation Guide */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>Multi-Account Isolation:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Even if your agency manages multiple ad accounts, each client will <strong>only see verified performance metrics for their own Facebook page</strong>. No other client will ever see campaigns belonging to others.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Ad Accounts Quick Switcher Grid */}
        <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#121826]">
                  Connected Meta Ad Accounts {discoveredAccounts.length > 0 ? `(${discoveredAccounts.length})` : ""}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {discoveredAccounts.length > 0
                    ? "Discovered under your single Facebook Access Token. Click on any account to view its active campaigns."
                    : "Connect your Facebook profile / System User token above to load your real Ad Accounts."}
                </p>
              </div>
            </div>

            {discoveredAccounts.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAccountIdToAdd}
                  onChange={(e) => setNewAccountIdToAdd(e.target.value)}
                  placeholder="Add another Ad Account ID (act_...)"
                  className="bg-[#F6F8FC] px-3 py-1.5 rounded-xl text-xs font-mono text-[#121826] border border-slate-200 focus:outline-none focus:border-[#0866FF] min-w-[220px]"
                />
                <button
                  type="button"
                  onClick={handleAddExtraAccount}
                  disabled={isAddingAccount || !newAccountIdToAdd.trim()}
                  className="px-3.5 py-1.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isAddingAccount ? "Adding..." : "+ Add Account"}
                </button>
              </div>
            )}
          </div>

          {discoveredAccounts.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-2xl bg-[#F8FAFC] border border-dashed border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#0866FF]/10 text-[#0866FF] flex items-center justify-center mx-auto mb-1">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-extrabold text-slate-800">
                Zero Demo Accounts — Only Your Real Meta Ad Accounts Will Stream
              </div>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Paste your <strong>System User Access Token</strong> in the box above and click <strong>&quot;Test & Save Connection&quot;</strong>. Your real <strong>Ad Account Name, Verified ID, and Live Balance</strong> will stream directly from Meta.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {discoveredAccounts.map((acc: any) => {
                const isSelected = (selectedAdAccountForCampaigns || adAccountId) === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setSelectedAdAccountForCampaigns(acc.id);
                      setActiveAccountDetails(acc);
                      fetchCampaigns(acc.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#F0F5FF] border-[#0866FF] shadow-sm ring-1 ring-[#0866FF]/20"
                        : "bg-[#F9FAFC] border-slate-200/80 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-[#121826] line-clamp-1">
                        {acc.name}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            acc.accountStatus === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {acc.accountStatus || "ACTIVE"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(acc.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove this ad account"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-slate-500">
                      <span>{acc.id}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(acc.id);
                        }}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedId === acc.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Dollar Figures Row on Card */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/70 text-[11px]">
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Spent</span>
                        <span className="font-extrabold text-rose-600 text-xs">
                          ${acc.totalSpent || "0.00"} {acc.currency || "USD"}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance / Fund</span>
                        <span className="font-extrabold text-emerald-600 text-xs">
                          ${acc.balance || "0.00"} {acc.currency || "USD"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">
                        Limit: <strong className="text-slate-700">{acc.spendCap && acc.spendCap !== "Unlimited" ? `$${acc.spendCap}` : "Unlimited"}</strong>
                      </span>
                      {isSelected ? (
                        <span className="font-bold text-[#0866FF] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold hover:text-[#0866FF]">
                          Switch to this →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Selected Account Live Financial Card */}
          {activeAccountDetails && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/80 border border-[#0866FF]/25 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#0866FF] text-white flex items-center justify-center font-black shadow-md shadow-[#0866FF]/25">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0866FF] bg-[#0866FF]/10 px-2 py-0.5 rounded-md">
                        Selected Ad Account Live Dollars
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {activeAccountDetails.id}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#121826] mt-0.5">
                      {activeAccountDetails.name}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Spent</div>
                    <div className="text-sm sm:text-base font-black text-rose-600 mt-0.5">
                      ${activeAccountDetails.totalSpent || "0.00"}
                    </div>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Prepaid / Balance</div>
                    <div className="text-sm sm:text-base font-black text-emerald-600 mt-0.5">
                      ${activeAccountDetails.balance || "0.00"}
                    </div>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Spend Limit</div>
                    <div className="text-sm sm:text-base font-black text-slate-800 mt-0.5">
                      {activeAccountDetails.spendCap && activeAccountDetails.spendCap !== "Unlimited"
                        ? `$${activeAccountDetails.spendCap}`
                        : "Unlimited"}
                    </div>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Currency</div>
                    <div className="text-sm sm:text-base font-black text-[#0866FF] mt-0.5">
                      {activeAccountDetails.currency || "USD"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Bottom Section: Live Campaigns in Your Meta Ads Manager */}
        <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#121826]">
                  Active Campaigns in Your Meta Ads Manager
                </h3>
                {!metaApiConnected && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Awaiting Meta Connection
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Campaigns running in your connected Ad Account. Click &quot;Link to Client Order&quot; to stream metrics to a specific client.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {discoveredAccounts.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#F5F7FB] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-semibold">Account:</span>
                  <select
                    value={selectedAdAccountForCampaigns}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedAdAccountForCampaigns(newId);
                      const found = discoveredAccounts.find((a) => a.id === newId);
                      if (found) setActiveAccountDetails(found);
                      fetchCampaigns(newId);
                    }}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[260px] truncate"
                  >
                    {discoveredAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} • Spent: ${acc.totalSpent || "0.00"} {acc.currency || "USD"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => fetchCampaigns(selectedAdAccountForCampaigns)}
                disabled={isLoadingCampaigns}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7FB] hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCampaigns ? "animate-spin" : ""}`} />
                <span>Refresh Campaigns</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFD] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Meta Campaign Name & ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Objective</th>
                  <th className="py-3.5 px-4">Daily Budget</th>
                  <th className="py-3.5 px-4">Live Reach</th>
                  <th className="py-3.5 px-4">Impressions</th>
                  <th className="py-3.5 px-4">Messages</th>
                  <th className="py-3.5 px-4">Spend USD</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoadingCampaigns ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0866FF]" />
                      <span>Fetching live campaigns from Meta Ads Manager...</span>
                    </td>
                  </tr>
                ) : metaCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No campaigns found in this Ad Account. Create a campaign in Meta Ads Manager or verify your permissions.
                    </td>
                  </tr>
                ) : (
                  metaCampaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-[#F9FAFC] transition-colors">
                      <td className="py-4 px-6 font-bold text-[#121826]">
                        <div>{camp.name}</div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 font-normal mt-0.5">
                          <span>#{camp.id}</span>
                          <button
                            onClick={() => handleCopy(camp.id)}
                            className="hover:text-[#0866FF] p-0.5"
                            title="Copy Meta Campaign ID"
                          >
                            {copiedId === camp.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            camp.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {camp.status === "ACTIVE" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {camp.objective.replace("OUTCOME_", "")}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ${camp.dailyBudget}/day
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#0866FF]">
                        {camp.insights ? camp.insights.reach.toLocaleString() : "—"}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {camp.insights ? camp.insights.impressions.toLocaleString() : "—"}
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-600">
                        {camp.insights ? camp.insights.conversations : "—"}
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900">
                        ${camp.insights ? camp.insights.spend : "0.00"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedCampaignToLink(camp);
                            if (orders.length > 0) setTargetOrderId(orders[0].id);
                          }}
                          className="px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#0866FF] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:scale-102"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Link to Order</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link Campaign Modal */}
        {selectedCampaignToLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-[28px] border border-[#E9EDF4] shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0866FF]" />
                  <h3 className="text-base font-extrabold text-[#121826]">
                    Link Meta Campaign to Client Order
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCampaignToLink(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {linkSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{linkSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-[#F6F8FC] rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Selected Meta Campaign:</div>
                <div className="font-bold text-[#121826]">{selectedCampaignToLink.name}</div>
                <div className="font-mono text-[11px] text-[#0866FF]">
                  ID: #{selectedCampaignToLink.id}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Client Order to Stream Live Metrics:
                </label>
                {orders.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No client orders found in the database. When a client places a boost order, it will appear here.
                  </p>
                ) : (
                  <select
                    value={targetOrderId}
                    onChange={(e) => setTargetOrderId(e.target.value)}
                    className="w-full bg-[#F6F8FC] text-xs font-bold text-[#121826] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0866FF] focus:outline-none cursor-pointer"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.campaignName} (${o.totalBudgetUSD} USD) [{o.status}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#0866FF] shrink-0 mt-0.5" />
                <span>
                  Once linked, the client will immediately see live Reach, Impressions, Messages, and Delivered Spend streamed directly from this Meta campaign into their dashboard!
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignToLink(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLinkCampaignToOrder}
                  disabled={isLinking || orders.length === 0}
                  className="px-4 py-2 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLinking ? "Linking..." : "Confirm & Link Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disconnect Confirmation Modal */}
        {showDisconnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-7 space-y-4 border border-[#E9EDF4] shadow-2xl animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-black text-[#121826]">
                  Disconnect Meta Ads Manager?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your Meta Marketing API token and connected ad accounts will be disconnected. You can reconnect anytime with a new token.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(false)}
                  disabled={isDisconnecting}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDisconnecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Disconnecting...</span>
                    </>
                  ) : (
                    <span>Yes, Disconnect</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
