"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Info,
  Save,
  RefreshCw,
  Wallet,
  Smartphone,
  Building,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Layers,
  Check,
  Plus,
  Trash2,
  Edit3,
  Star,
  Copy,
  AlertCircle,
  CreditCard,
  X,
  Phone,
  ArrowUpDown,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal, DEFAULT_BANKS } from "@/context/PortalContext";
import { BankAccount } from "@/types";
import {
  BkashLogo,
  NagadLogo,
  CityBankLogo,
  BracBankLogo,
  DbblLogo,
} from "@/components/ui/BankLogos";

export default function AdminExchangeRatesPage() {
  const {
    profile,
    exchangeRateBDT,
    bkashCashoutPercent,
    nagadCashoutPercent,
    serviceChargePercent,
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
    bankDetails,
    bankAccounts: contextBankAccounts,
    ratesLastUpdated,
    isLoadingSettings,
    refreshSettings,
    updateRates,
    orders,
  } = usePortal();

  const adminName =
    profile.role === "Specialist" || profile.name?.toLowerCase().includes("admin")
      ? profile.name
      : "Shopno IT Admin";

  // Active top tab: "accounts" (bKash, Nagad, Banks) vs "rates" (FX & Fees)
  const [activeTab, setActiveTab] = useState<"accounts" | "rates">("accounts");

  // Local Form state for Exchange Rate & Fees
  const [rate, setRate] = useState<number>(exchangeRateBDT || 150);
  const [bkashFee, setBkashFee] = useState<number>(bkashCashoutPercent ?? 2);
  const [nagadFee, setNagadFee] = useState<number>(nagadCashoutPercent ?? 1.5);
  const [serviceFee, setServiceFee] = useState<number>(serviceChargePercent ?? 0);

  // bKash Account State
  const [bkashPhone, setBkashPhone] = useState<string>(bkashNumber || "01712-345678");
  const [bkashType, setBkashType] = useState<string>(bkashAccountType || "Personal (Send Money)");
  const [bkashName, setBkashName] = useState<string>(bkashAccountName || "Shopno IT / Meta Ads Agency");
  const [bkashNote, setBkashNote] = useState<string>(
    bkashInstructions || "Send money via bKash App or USSD *247#, then paste the TrxID below."
  );
  const [bkashIsEnabled, setBkashIsEnabled] = useState<boolean>(bkashActive ?? true);

  // Nagad Account State
  const [nagadPhone, setNagadPhone] = useState<string>(nagadNumber || "01898-765432");
  const [nagadType, setNagadType] = useState<string>(nagadAccountType || "Personal (Send Money)");
  const [nagadName, setNagadName] = useState<string>(nagadAccountName || "Shopno IT / Meta Ads Agency");
  const [nagadNote, setNagadNote] = useState<string>(
    nagadInstructions || "Send money via Nagad App or USSD *167#, then paste the TrxID below."
  );
  const [nagadIsEnabled, setNagadIsEnabled] = useState<boolean>(nagadActive ?? true);

  // Bank Accounts List State
  const [bankList, setBankList] = useState<BankAccount[]>(
    contextBankAccounts && contextBankAccounts.length > 0 ? contextBankAccounts : DEFAULT_BANKS
  );

  // Modal State for Adding or Editing Bank Account
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber: string;
    swiftCode: string;
    tag: string;
    instructions: string;
    isActive: boolean;
    isPrimary: boolean;
  }>({
    bankName: "",
    accountName: "Shopno IT / Meta Ads Agency BD",
    accountNumber: "",
    branch: "Dhaka Branch",
    routingNumber: "",
    swiftCode: "",
    tag: "NPSB / BEFTN / Online Banking",
    instructions: "Transfer via internet banking or NPSB instant transfer. Reference: Order ID or Phone.",
    isActive: true,
    isPrimary: false,
  });

  // Modal State for Confirming Deletion of a Bank Account
  const [bankToDelete, setBankToDelete] = useState<BankAccount | null>(null);

  // Simulator test inputs
  const [calcBudgetUSD, setCalcBudgetUSD] = useState<number>(10);
  const [selectedGateway, setSelectedGateway] = useState<"bKash" | "Nagad" | "Bank">("bKash");

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Synchronize form when context data finishes loading from MongoDB
  useEffect(() => {
    if (exchangeRateBDT) setRate(exchangeRateBDT);
    if (bkashCashoutPercent !== undefined) setBkashFee(bkashCashoutPercent);
    if (nagadCashoutPercent !== undefined) setNagadFee(nagadCashoutPercent);
    if (serviceChargePercent !== undefined) setServiceFee(serviceChargePercent);

    if (bkashNumber) setBkashPhone(bkashNumber);
    if (bkashAccountType) setBkashType(bkashAccountType);
    if (bkashAccountName) setBkashName(bkashAccountName);
    if (bkashInstructions) setBkashNote(bkashInstructions);
    if (bkashActive !== undefined) setBkashIsEnabled(bkashActive);

    if (nagadNumber) setNagadPhone(nagadNumber);
    if (nagadAccountType) setNagadType(nagadAccountType);
    if (nagadAccountName) setNagadName(nagadAccountName);
    if (nagadInstructions) setNagadNote(nagadInstructions);
    if (nagadActive !== undefined) setNagadIsEnabled(nagadActive);

    if (contextBankAccounts && contextBankAccounts.length > 0) {
      setBankList(contextBankAccounts);
    }
  }, [
    exchangeRateBDT,
    bkashCashoutPercent,
    nagadCashoutPercent,
    serviceChargePercent,
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
    contextBankAccounts,
  ]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Re-sync directly with MongoDB
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSettings();
      showNotification("Settings successfully re-synchronized with MongoDB Atlas!");
    } catch {
      showNotification("Failed to refresh settings from database.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Reset form to active context values
  const handleReset = () => {
    setRate(exchangeRateBDT);
    setBkashFee(bkashCashoutPercent);
    setNagadFee(nagadCashoutPercent);
    setServiceFee(serviceChargePercent);
    setBkashPhone(bkashNumber);
    setBkashType(bkashAccountType || "Personal (Send Money)");
    setBkashName(bkashAccountName || "Shopno IT / Meta Ads Agency");
    setBkashNote(bkashInstructions || "");
    setBkashIsEnabled(bkashActive ?? true);

    setNagadPhone(nagadNumber);
    setNagadType(nagadAccountType || "Personal (Send Money)");
    setNagadName(nagadAccountName || "Shopno IT / Meta Ads Agency");
    setNagadNote(nagadInstructions || "");
    setNagadIsEnabled(nagadActive ?? true);

    if (contextBankAccounts && contextBankAccounts.length > 0) {
      setBankList(contextBankAccounts);
    }
    showNotification("Form reset to currently active database settings.");
  };

  // Live calculations for simulator
  const gatewayPercent =
    selectedGateway === "bKash" ? bkashFee : selectedGateway === "Nagad" ? nagadFee : 0;
  const baseBDT = Math.round(calcBudgetUSD * rate);
  const gatewayChargeBDT = Math.round((baseBDT * gatewayPercent) / 100);
  const serviceChargeBDT = Math.round((baseBDT * serviceFee) / 100);
  const totalClientBDT = baseBDT + gatewayChargeBDT + serviceChargeBDT;

  // Comparison with standard ৳125 baseline rate
  const baselineBDT = Math.round(calcBudgetUSD * 125);
  const differenceBDT = baseBDT - baselineBDT;

  // Active orders metrics
  const activeOrdersCount = orders.filter((o) => o.status === "Active").length;
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;

  // Open modal to add a brand new bank
  const handleOpenAddBank = () => {
    setEditingBankId(null);
    setBankForm({
      bankName: "",
      accountName: "Shopno IT / Meta Ads Agency BD",
      accountNumber: "",
      branch: "Gulshan Branch, Dhaka",
      routingNumber: "",
      swiftCode: "",
      tag: "NPSB / BEFTN / Online Banking",
      instructions: "Transfer via online banking app or NPSB. Reference: Your Order ID or Phone Number.",
      isActive: true,
      isPrimary: bankList.length === 0,
    });
    setIsBankModalOpen(true);
  };

  // Open modal with pre-filled details to edit existing bank
  const handleOpenEditBank = (bank: BankAccount) => {
    setEditingBankId(bank.id);
    setBankForm({
      bankName: bank.bankName,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      branch: bank.branch || "",
      routingNumber: bank.routingNumber || "",
      swiftCode: bank.swiftCode || "",
      tag: bank.tag || "NPSB / BEFTN",
      instructions: bank.instructions || "",
      isActive: bank.isActive ?? true,
      isPrimary: bank.isPrimary ?? false,
    });
    setIsBankModalOpen(true);
  };

  // Quick preset bank template button clicked
  const handleApplyPresetTemplate = (preset: {
    name: string;
    swift: string;
    tag: string;
    branch: string;
    instructions: string;
  }) => {
    setEditingBankId(null);
    setBankForm({
      bankName: preset.name,
      accountName: "Shopno IT / Meta Ads Agency BD",
      accountNumber: "",
      branch: preset.branch,
      routingNumber: "",
      swiftCode: preset.swift,
      tag: preset.tag,
      instructions: preset.instructions,
      isActive: true,
      isPrimary: bankList.length === 0,
    });
    setIsBankModalOpen(true);
  };

  // Save Bank Modal (Add or Edit)
  const handleSaveBankModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim()) {
      alert("Please enter a Bank Name.");
      return;
    }
    if (!bankForm.accountNumber.trim()) {
      alert("Please enter the Account Number.");
      return;
    }

    let updatedList: BankAccount[];

    if (editingBankId) {
      // Edit existing bank
      updatedList = bankList.map((b) => {
        if (b.id === editingBankId) {
          return {
            ...b,
            bankName: bankForm.bankName.trim(),
            accountName: bankForm.accountName.trim(),
            accountNumber: bankForm.accountNumber.trim(),
            branch: bankForm.branch.trim(),
            routingNumber: bankForm.routingNumber.trim(),
            swiftCode: bankForm.swiftCode.trim(),
            tag: bankForm.tag.trim(),
            instructions: bankForm.instructions.trim(),
            isActive: bankForm.isActive,
            isPrimary: bankForm.isPrimary,
          };
        }
        // If this bank is set to primary, clear primary on other banks
        return bankForm.isPrimary ? { ...b, isPrimary: false } : b;
      });
    } else {
      // Add new bank
      const newBank: BankAccount = {
        id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        bankName: bankForm.bankName.trim(),
        accountName: bankForm.accountName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        branch: bankForm.branch.trim(),
        routingNumber: bankForm.routingNumber.trim(),
        swiftCode: bankForm.swiftCode.trim(),
        tag: bankForm.tag.trim(),
        instructions: bankForm.instructions.trim(),
        isActive: bankForm.isActive,
        isPrimary: bankForm.isPrimary || bankList.length === 0,
      };

      updatedList = bankForm.isPrimary
        ? [...bankList.map((b) => ({ ...b, isPrimary: false })), newBank]
        : [...bankList, newBank];
    }

    setBankList(updatedList);
    setIsBankModalOpen(false);

    // Save directly to MongoDB Atlas
    try {
      await updateRates({ bankAccounts: updatedList });
      showNotification(
        editingBankId
          ? `Bank account '${bankForm.bankName}' updated successfully!`
          : `New bank account '${bankForm.bankName}' added successfully!`
      );
    } catch {
      showNotification("Saved locally. Could not sync with MongoDB Atlas.");
    }
  };

  // Toggle active/inactive for bank account
  const handleToggleBankActive = async (bankId: string) => {
    const updated = bankList.map((b) => (b.id === bankId ? { ...b, isActive: !b.isActive } : b));
    setBankList(updated);
    try {
      await updateRates({ bankAccounts: updated });
      showNotification("Bank status updated successfully.");
    } catch {}
  };

  // Set as primary bank account
  const handleSetPrimaryBank = async (bankId: string) => {
    const updated = bankList.map((b) => ({
      ...b,
      isPrimary: b.id === bankId,
    }));
    setBankList(updated);
    try {
      await updateRates({ bankAccounts: updated });
      showNotification("Primary receiving bank account set.");
    } catch {}
  };

  // Confirm delete bank account
  const handleConfirmDeleteBank = async () => {
    if (!bankToDelete) return;
    const updated = bankList.filter((b) => b.id !== bankToDelete.id);
    // If deleted bank was primary, set first remaining bank as primary
    if (bankToDelete.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setBankList(updated);
    setBankToDelete(null);

    try {
      await updateRates({ bankAccounts: updated });
      showNotification(`Bank '${bankToDelete.bankName}' deleted successfully.`);
    } catch {}
  };

  // Save all settings to MongoDB Atlas
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rate <= 0) {
      showNotification("Exchange rate must be greater than 0 BDT.");
      return;
    }

    setIsSaving(true);
    try {
      // Find primary bank
      const primaryBank =
        bankList.find((b) => b.isPrimary && b.isActive) ||
        bankList.find((b) => b.isActive) ||
        bankList[0];

      await updateRates({
        exchangeRateBDT: rate,
        bkashCashoutPercent: bkashFee,
        nagadCashoutPercent: nagadFee,
        serviceChargePercent: serviceFee,
        bkashNumber: bkashPhone.trim(),
        bkashAccountType: bkashType,
        bkashAccountName: bkashName.trim(),
        bkashInstructions: bkashNote.trim(),
        bkashActive: bkashIsEnabled,
        nagadNumber: nagadPhone.trim(),
        nagadAccountType: nagadType,
        nagadAccountName: nagadName.trim(),
        nagadInstructions: nagadNote.trim(),
        nagadActive: nagadIsEnabled,
        bankAccounts: bankList,
        bankDetails: primaryBank
          ? {
              bankName: primaryBank.bankName,
              accountName: primaryBank.accountName,
              accountNumber: primaryBank.accountNumber,
              branch: primaryBank.branch || "",
              routingNumber: primaryBank.routingNumber || "",
            }
          : undefined,
      });
      showNotification("All payment accounts and rates published live to MongoDB Atlas!");
    } catch {
      showNotification("Failed to save settings. Please verify database connection.");
    } finally {
      setIsSaving(false);
    }
  };

  // Pre-set FX rates
  const ratePresets = [125, 130, 135, 140, 150];

  // Common Bank Presets for 1-click addition
  const BANK_PRESETS = [
    {
      name: "Islami Bank Bangladesh PLC",
      swift: "IBBLBDDH",
      tag: "CellFin / NPSB / iBanking",
      branch: "Dilkusha Principal Branch, Dhaka",
      instructions: "Transfer instantly via CellFin app or any bank's NPSB instant transfer.",
    },
    {
      name: "Eastern Bank PLC (EBL)",
      swift: "EBLBDDH",
      tag: "EBL Connect / NPSB / BEFTN",
      branch: "Gulshan Branch, Dhaka",
      instructions: "Transfer via EBL Connect app or NPSB instant fund transfer.",
    },
    {
      name: "Sonali Bank PLC",
      swift: "BSONBDDH",
      tag: "Sonali eSheba / NPSB",
      branch: "Motijheel Principal Office, Dhaka",
      instructions: "Transfer via Sonali eSheba app or any bank's NPSB transfer.",
    },
    {
      name: "Pubali Bank PLC",
      swift: "PUBLBDDH",
      tag: "PI Banking / NPSB",
      branch: "Head Office Branch, Dhaka",
      instructions: "Transfer via PI Banking or NPSB instant transfer.",
    },
  ];

  return (
    <AdminLayout pageTitle="Payment Accounts & Rates">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#121826] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight">
                Payment Accounts & Currency Settings
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8F1] text-[#10B981] text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Active Rate: ৳{exchangeRateBDT}/$1 USD
              </span>
            </div>
            <p className="text-xs text-[#8A94A6]">
              Add and update official bKash, Nagad, and Bank Accounts shown to clients on checkout. Managed in real-time with MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl border border-[#E9EDF4] text-xs font-bold text-slate-700 hover:bg-[#F6F8FC] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-2xs"
              title="Reload latest configuration from MongoDB"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync DB"}</span>
            </button>

            <button
              onClick={handleOpenAddBank}
              className="px-4 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#3858F6]/25"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bank Account</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Accounts vs Rates */}
        <div className="flex items-center gap-2 border-b border-[#E9EDF4] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("accounts")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "accounts"
                ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E9EDF4]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Receiving Accounts (bKash, Nagad, Banks)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "accounts" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              2 Mobile • {bankList.length} Bank{bankList.length !== 1 ? "s" : ""}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rates")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "rates"
                ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E9EDF4]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Exchange Rates & Simulator</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "rates" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              ৳{rate}/$
            </span>
          </button>
        </div>

        {/* Tab 1: Receiving Accounts (bKash, Nagad, Bank Accounts) */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            {/* Section 1: Mobile Banking Accounts (bKash & Nagad) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* bKash Official Account Card */}
              <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded-xl bg-[#FFF0F5] border border-[#FBCFE8] p-1 flex items-center justify-center shrink-0">
                      <BkashLogo className="w-full h-full" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#121826] text-base flex items-center gap-2">
                        <span>bKash Official Account</span>
                        <span className="text-[10px] text-[#E2136E] bg-[#FFF0F5] px-2 py-0.5 rounded-full font-bold border border-[#FBCFE8]">
                          {bkashFee}% Fee
                        </span>
                      </h3>
                      <p className="text-xs text-[#8A94A6]">Client checkout payment details</p>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-bold text-slate-600">
                      {bkashIsEnabled ? "Active" : "Disabled"}
                    </span>
                    <input
                      type="checkbox"
                      checked={bkashIsEnabled}
                      onChange={(e) => setBkashIsEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        bkashIsEnabled ? "bg-[#E2136E]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                          bkashIsEnabled ? "translate-x-5" : ""
                        }`}
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  {/* bKash Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official bKash Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={bkashPhone}
                        onChange={(e) => setBkashPhone(e.target.value)}
                        placeholder="e.g. 01712-345678"
                        required
                        className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#E2136E] focus:ring-4 focus:ring-[#E2136E]/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(bkashPhone, "bkash_num")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold px-2 py-1 bg-white rounded-lg border border-slate-200 cursor-pointer"
                      >
                        {copiedKey === "bkash_num" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Account Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Account Type
                      </label>
                      <select
                        value={bkashType}
                        onChange={(e) => setBkashType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#E2136E] cursor-pointer"
                      >
                        <option value="Personal (Send Money)">Personal (Send Money)</option>
                        <option value="Merchant (Payment)">Merchant (Make Payment)</option>
                        <option value="Agent (Cash In)">Agent (Cash In)</option>
                      </select>
                    </div>

                    {/* Cashout Fee */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        bKash Fee (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          max={15}
                          value={bkashFee}
                          onChange={(e) => setBkashFee(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#E2136E]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account Title / Business Name
                    </label>
                    <input
                      type="text"
                      value={bkashName}
                      onChange={(e) => setBkashName(e.target.value)}
                      placeholder="Shopno IT / Meta Ads Agency BD"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#E2136E]"
                    />
                  </div>

                  {/* Instructions for Client */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Client Checkout Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={bkashNote}
                      onChange={(e) => setBkashNote(e.target.value)}
                      placeholder="Open bKash App > Send Money > enter exact amount and your phone in reference..."
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#E2136E] resize-none"
                    />
                  </div>

                  {/* Checkout Preview Box */}
                  <div className="p-3 rounded-xl bg-[#FFF5F8] border border-[#FCE7F3] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2136E] block">
                      Client Preview On Checkout:
                    </span>
                    <div className="text-xs font-bold text-slate-800">
                      {bkashPhone} • <span className="text-slate-600 font-normal">{bkashType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic truncate">{bkashNote}</p>
                  </div>
                </div>
              </div>

              {/* Nagad Official Account Card */}
              <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] p-1 flex items-center justify-center shrink-0">
                      <NagadLogo className="w-full h-full" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#121826] text-base flex items-center gap-2">
                        <span>Nagad Official Account</span>
                        <span className="text-[10px] text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-full font-bold border border-[#FED7AA]">
                          {nagadFee}% Fee
                        </span>
                      </h3>
                      <p className="text-xs text-[#8A94A6]">Client checkout payment details</p>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-bold text-slate-600">
                      {nagadIsEnabled ? "Active" : "Disabled"}
                    </span>
                    <input
                      type="checkbox"
                      checked={nagadIsEnabled}
                      onChange={(e) => setNagadIsEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        nagadIsEnabled ? "bg-[#EA580C]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                          nagadIsEnabled ? "translate-x-5" : ""
                        }`}
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  {/* Nagad Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Nagad Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nagadPhone}
                        onChange={(e) => setNagadPhone(e.target.value)}
                        placeholder="e.g. 01898-765432"
                        required
                        className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#EA580C] focus:ring-4 focus:ring-[#EA580C]/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(nagadPhone, "nagad_num")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold px-2 py-1 bg-white rounded-lg border border-slate-200 cursor-pointer"
                      >
                        {copiedKey === "nagad_num" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Account Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Account Type
                      </label>
                      <select
                        value={nagadType}
                        onChange={(e) => setNagadType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#EA580C] cursor-pointer"
                      >
                        <option value="Personal (Send Money)">Personal (Send Money)</option>
                        <option value="Merchant (Payment)">Merchant (Make Payment)</option>
                        <option value="Agent (Cash In)">Agent (Cash In)</option>
                      </select>
                    </div>

                    {/* Cashout Fee */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nagad Fee (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          max={15}
                          value={nagadFee}
                          onChange={(e) => setNagadFee(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#EA580C]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account Title / Business Name
                    </label>
                    <input
                      type="text"
                      value={nagadName}
                      onChange={(e) => setNagadName(e.target.value)}
                      placeholder="Shopno IT / Meta Ads Agency BD"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#EA580C]"
                    />
                  </div>

                  {/* Instructions for Client */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Client Checkout Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={nagadNote}
                      onChange={(e) => setNagadNote(e.target.value)}
                      placeholder="Open Nagad App > Send Money > enter exact amount and your phone in reference..."
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#EA580C] resize-none"
                    />
                  </div>

                  {/* Checkout Preview Box */}
                  <div className="p-3 rounded-xl bg-[#FFF8F0] border border-[#FFEDD5] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C] block">
                      Client Preview On Checkout:
                    </span>
                    <div className="text-xs font-bold text-slate-800">
                      {nagadPhone} • <span className="text-slate-600 font-normal">{nagadType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic truncate">{nagadNote}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Bank Accounts Management (Add, Update, Remove, Set Primary) */}
            <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F3F7] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#121826] text-base flex items-center gap-2">
                      <span>Official Partner Bank Accounts</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3858F6]">
                        {bankList.length} Total
                      </span>
                    </h3>
                    <p className="text-xs text-[#8A94A6]">
                      Clients can choose any of these partner banks for direct BDT fund transfer.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleOpenAddBank}
                    className="px-4 py-2 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#3858F6]/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Bank Account</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Bank Presets Bar */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Sparkles className="w-3.5 h-3.5 text-[#3858F6]" />
                    <span>Quick Bank Templates (1-Click Fill):</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Auto-fills official SWIFT code & transfer app tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BANK_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPresetTemplate(preset)}
                      className="px-3 py-1.5 bg-white hover:bg-[#EEF2FF] hover:text-[#3858F6] hover:border-[#3858F6]/40 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-3 h-3 text-[#3858F6]" />
                      <span>{preset.name.replace(" PLC", "")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankList.map((bank) => {
                  const lower = bank.bankName.toLowerCase();
                  const isCity = lower.includes("city");
                  const isBrac = lower.includes("brac");
                  const isDbbl = lower.includes("dutch") || lower.includes("dbbl");

                  return (
                    <div
                      key={bank.id}
                      className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-3xs ${
                        bank.isPrimary
                          ? "bg-white border-[#3858F6] ring-2 ring-[#3858F6]/15"
                          : bank.isActive
                          ? "bg-white border-[#E9EDF4] hover:border-slate-300"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Top Row: Logo & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-14 h-10 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-3xs">
                          {isCity && <CityBankLogo className="w-full h-full" />}
                          {isBrac && <BracBankLogo className="w-full h-full" />}
                          {isDbbl && <DbblLogo className="w-full h-full" />}
                          {!isCity && !isBrac && !isDbbl && (
                            <Building className="w-6 h-6 text-[#3858F6]" />
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {bank.isPrimary && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Primary
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              bank.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {bank.isActive ? "Active on Checkout" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="font-extrabold text-sm text-[#121826] truncate" title={bank.bankName}>
                          {bank.bankName}
                        </h4>
                        <div className="text-xs text-slate-500 truncate" title={bank.branch}>
                          {bank.branch || "Head Office / Corporate Branch"}
                        </div>

                        <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200/80 space-y-1 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Account No:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(bank.accountNumber, `bank_${bank.id}`)}
                              className="font-mono font-bold text-[#121826] hover:text-[#3858F6] flex items-center gap-1 cursor-pointer"
                              title="Click to copy account number"
                            >
                              <span>{bank.accountNumber}</span>
                              <Copy className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Title:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={bank.accountName}>
                              {bank.accountName}
                            </span>
                          </div>
                          {bank.routingNumber && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[10px] font-bold uppercase text-slate-400">Routing:</span>
                              <span className="font-mono text-slate-600">{bank.routingNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditBank(bank)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#EEF2FF] hover:text-[#3858F6] text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {!bank.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryBank(bank.id)}
                            className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Set as the default primary bank"
                          >
                            <Star className="w-3 h-3" />
                            <span>Make Primary</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleBankActive(bank.id)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            bank.isActive
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {bank.isActive ? "Disable" : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setBankToDelete(bank)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Bank Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white p-5 rounded-[24px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  All changes made above will instantly stream to the client checkout page.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#3858F6] hover:bg-[#2542D9] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#3858F6]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving to MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save All Payment Accounts</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Exchange Rates & Pricing Simulator */}
        {activeTab === "rates" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Exchange Rate Controls & Service Fees (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleSaveAll} className="space-y-6">
                {/* FX Rate Card */}
                <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
                  <div className="flex items-center gap-3 border-b border-[#F0F3F7] pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                      <DollarSign className="w-5 h-5 stroke-[2.4]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#121826] text-base">
                        USD to BDT Exchange Rate
                      </h3>
                      <p className="text-xs text-[#8A94A6]">
                        Core conversion rate used for calculating boost budget BDT amounts
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Active Conversion Rate (BDT per 1 USD)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        min={50}
                        max={300}
                        step={0.25}
                        required
                        className="w-full pl-9 pr-24 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-base font-extrabold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6] focus:ring-4 focus:ring-[#3858F6]/10 transition-all font-mono"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400">
                        BDT / $1 USD
                      </span>
                    </div>

                    {/* Rate Preset Quick Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
                      {ratePresets.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRate(r)}
                          className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                            rate === r
                              ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/30"
                              : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-200 border border-[#E2E8F0]"
                          }`}
                        >
                          ৳{r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agency Service Charge */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Agency Service Charge (%)</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Currently 0% Promo</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={serviceFee}
                        onChange={(e) => setServiceFee(Number(e.target.value))}
                        min={0}
                        max={25}
                        step={0.1}
                        className="w-full pl-4 pr-9 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#121826] focus:outline-none focus:bg-white focus:border-[#3858F6] focus:ring-4 focus:ring-[#3858F6]/10 transition-all font-mono"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[0, 5, 10].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setServiceFee(v)}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded cursor-pointer ${
                            serviceFee === v
                              ? "bg-[#3858F6] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {v === 0 ? "0% (Free)" : `${v}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Reset Form</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-[#3858F6] hover:bg-[#2542D9] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#3858F6]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Saving to MongoDB...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Apply Settings Live</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Live Rate Simulator & Platform Impact (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Interactive Calculator Card */}
              <div className="bg-[#12151D] text-white p-6 sm:p-7 rounded-[28px] border border-white/10 shadow-xl relative overflow-hidden space-y-5">
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#3858F6]/25 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Calculator className="w-4 h-4 text-[#60A5FA]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Live Rate Simulator</h4>
                      <p className="text-[11px] text-slate-400">Instant test breakdown with new values</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#34D399] bg-[#10B981]/20 px-2 py-0.5 rounded-full">
                    Real-time
                  </span>
                </div>

                {/* Calculator Inputs */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Test Ad Budget (USD):
                      </label>
                      <span className="text-xs font-mono font-bold text-[#60A5FA]">
                        ${calcBudgetUSD} USD
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        value={calcBudgetUSD}
                        onChange={(e) => setCalcBudgetUSD(Math.max(1, Number(e.target.value)))}
                        className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#60A5FA] font-mono"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[5, 10, 20, 50, 100, 500].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setCalcBudgetUSD(b)}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                            calcBudgetUSD === b
                              ? "bg-[#3858F6] text-white"
                              : "bg-white/10 text-slate-300 hover:bg-white/15"
                          }`}
                        >
                          ${b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Select Payment Gateway:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["bKash", "Nagad", "Bank"] as const).map((gw) => (
                        <button
                          key={gw}
                          type="button"
                          onClick={() => setSelectedGateway(gw)}
                          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            selectedGateway === gw
                              ? "bg-[#3858F6] text-white shadow-md shadow-[#3858F6]/30"
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {gw === "Bank" ? "Bank Transfer" : gw}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calculated Breakdown Box */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Conversion (${calcBudgetUSD} × ৳{rate}):</span>
                    <span className="font-mono font-bold text-white">৳{baseBDT.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gateway Cashout ({gatewayPercent}%):</span>
                    <span className="font-mono font-bold text-[#F59E0B]">
                      ৳{gatewayChargeBDT.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Agency Service Fee ({serviceFee}%):</span>
                    <span className="font-mono font-bold text-[#34D399]">
                      ৳{serviceChargeBDT.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/15">
                    <div>
                      <span className="font-bold text-white block">Client Total Checkout:</span>
                      <span className="text-[10px] text-slate-400">Locked at checkout</span>
                    </div>
                    <span className="text-lg font-black text-[#60A5FA] font-mono">
                      ৳{totalClientBDT.toLocaleString()} BDT
                    </span>
                  </div>
                </div>

                {/* Baseline Comparison Insight */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Versus ৳125 Baseline:</span>
                  <span
                    className={`font-mono font-bold ${
                      differenceBDT >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {differenceBDT >= 0
                      ? `+৳${differenceBDT.toLocaleString()} (+${((differenceBDT / baselineBDT) * 100).toFixed(1)}%)`
                      : `-৳${Math.abs(differenceBDT).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Platform Impact & Audit Trail Card */}
              <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-[#3858F6]" />
                  <span>Live Platform Impact</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Campaigns
                    </span>
                    <span className="text-lg font-black text-[#121826] font-mono mt-0.5 block">
                      {activeOrdersCount}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pending Orders
                    </span>
                    <span className="text-lg font-black text-amber-600 font-mono mt-0.5 block">
                      {pendingOrdersCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0F3F7] text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Last Modified:</span>
                    <span className="font-semibold text-slate-700">{ratesLastUpdated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Updated By:</span>
                    <span className="font-semibold text-slate-700">{adminName} (Super Admin)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage Engine:</span>
                    <span className="font-bold text-emerald-600">MongoDB Atlas (SettingModel)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Bank Account */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsBankModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingBankId ? "Edit Partner Bank Account" : "Add New Partner Bank Account"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    This account will be available on the client checkout page
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBankModal} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g. The City Bank PLC or Islami Bank Bangladesh"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                />
              </div>

              {/* Account Title & Account Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Name / Title *
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    placeholder="e.g. Shopno Career IT"
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    placeholder="e.g. 1502-9384-72001"
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                  />
                </div>
              </div>

              {/* Branch & Routing Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    placeholder="e.g. Gulshan Branch, Dhaka"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Routing Number (9 Digits)
                  </label>
                  <input
                    type="text"
                    value={bankForm.routingNumber}
                    onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })}
                    placeholder="e.g. 225271829"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                  />
                </div>
              </div>

              {/* SWIFT & Transfer Tag Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={bankForm.swiftCode}
                    onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                    placeholder="e.g. CIBLBDDH"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer Tag / Supported Apps
                  </label>
                  <input
                    type="text"
                    value={bankForm.tag}
                    onChange={(e) => setBankForm({ ...bankForm, tag: e.target.value })}
                    placeholder="e.g. CityTouch / NPSB / BEFTN"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none"
                  />
                </div>
              </div>

              {/* Client Deposit Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Deposit Instructions
                </label>
                <textarea
                  rows={2}
                  value={bankForm.instructions}
                  onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                  placeholder="Transfer via internet banking app or NPSB. Reference: Order ID or Phone Number."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#3858F6] focus:outline-none resize-none"
                />
              </div>

              {/* Checkboxes: Active & Primary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankForm.isPrimary}
                    onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-[#3858F6] focus:ring-[#3858F6]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Set as Primary Receiving Bank Account ⭐
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankForm.isActive}
                    onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#3858F6] focus:ring-[#3858F6]"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Active & Available for Client Checkout
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold shadow-md shadow-[#3858F6]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingBankId ? "Update Bank Account" : "Add Bank Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Bank Account */}
      {bankToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setBankToDelete(null)} />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-10 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Delete Bank Account?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{bankToDelete.bankName}</strong> ({bankToDelete.accountNumber})? Clients will no longer see this bank on checkout.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBankToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBank}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
