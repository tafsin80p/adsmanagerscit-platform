"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Send,
  MessageSquare,
  Bot,
  BellRing,
  Loader2,
  Upload,
  ImagePlus,
  Eye,
  EyeOff,
  Scan,
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
    dollarBuyRateBDT,
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
    telegramBotToken,
    telegramChatId,
    telegramEnabled,
    telegramWebhookUrl,
    geminiApiKey,
    ocrEngine,
    isLoadingSettings,
    refreshSettings,
    updateRates,
    orders,
  } = usePortal();

  const adminName =
    profile.role === "Specialist" || profile.name?.toLowerCase().includes("admin")
      ? profile.name
      : "Shopno IT Admin";

  // Active top tab: "accounts" (bKash, Nagad, Banks) vs "rates" (FX & Fees) vs "telegram" (Bot & Alerts)
  const [activeTab, setActiveTab] = useState<"accounts" | "rates" | "telegram" | "ocr">("accounts");

  // Gemini Vision OCR State
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState<string>(geminiApiKey || "");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isSavingOcr, setIsSavingOcr] = useState<boolean>(false);
  const [ocrSaveFeedback, setOcrSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (geminiApiKey) setGeminiApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  const handleSaveOcr = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOcr(true);
    setOcrSaveFeedback(null);
    try {
      await updateRates({
        geminiApiKey: geminiApiKeyInput.trim(),
        ocrEngine: "gemini_ai",
      });
      setOcrSaveFeedback({
        success: true,
        message: "Gemini Vision AI key saved successfully! Receipts will now be scanned with Google Gemini 1.5 Flash.",
      });
      setTimeout(() => setOcrSaveFeedback(null), 5000);
    } catch (err: unknown) {
      const error = err as Error;
      setOcrSaveFeedback({
        success: false,
        message: error.message || "Failed to save Gemini API key.",
      });
    } finally {
      setIsSavingOcr(false);
    }
  };

  // Local Form state for Exchange Rate & Fees
  const [rate, setRate] = useState<number>(exchangeRateBDT || 150);
  const [buyRate, setBuyRate] = useState<number>(dollarBuyRateBDT || 130);
  const [bkashFee, setBkashFee] = useState<number>(bkashCashoutPercent ?? 2);
  const [nagadFee, setNagadFee] = useState<number>(nagadCashoutPercent ?? 1.5);
  const [serviceFee, setServiceFee] = useState<number>(serviceChargePercent ?? 0);

  // Telegram Integration State
  const [telegramTokenInput, setTelegramTokenInput] = useState<string>(telegramBotToken || "");
  const [telegramChatIdInput, setTelegramChatIdInput] = useState<string>(telegramChatId || "");
  const [telegramEnabledState, setTelegramEnabledState] = useState<boolean>(telegramEnabled ?? true);
  const [isTestingTelegram, setIsTestingTelegram] = useState<boolean>(false);
  const [telegramTestFeedback, setTelegramTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingTelegram, setIsSavingTelegram] = useState<boolean>(false);

  // Telegram Webhook State (for 1-click confirm/reject from Telegram)
  const [webhookUrlInput, setWebhookUrlInput] = useState<string>(telegramWebhookUrl || "");
  const [webhookInfo, setWebhookInfo] = useState<{
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
  } | null>(null);
  const [isLoadingWebhookInfo, setIsLoadingWebhookInfo] = useState<boolean>(false);
  const [isSettingWebhook, setIsSettingWebhook] = useState<boolean>(false);
  const [webhookFeedback, setWebhookFeedback] = useState<{ success: boolean; message: string } | null>(null);

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
  const [isUploadingBankLogo, setIsUploadingBankLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const bankLogoInputRef = useRef<HTMLInputElement>(null);

  const [bankForm, setBankForm] = useState<{
    bankName: string;
    logoUrl: string;
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
    logoUrl: "",
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
    if (dollarBuyRateBDT) setBuyRate(dollarBuyRateBDT);
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
    setTelegramTokenInput(telegramBotToken || "");
    setTelegramChatIdInput(telegramChatId || "");
    setTelegramEnabledState(telegramEnabled ?? true);
    showNotification("Form reset to currently active database settings.");
  };

  useEffect(() => {
    if (telegramBotToken !== undefined) setTelegramTokenInput(telegramBotToken);
    if (telegramChatId !== undefined) setTelegramChatIdInput(telegramChatId);
    if (telegramEnabled !== undefined) setTelegramEnabledState(telegramEnabled);
  }, [telegramBotToken, telegramChatId, telegramEnabled]);

  useEffect(() => {
    if (telegramWebhookUrl) {
      setWebhookUrlInput(telegramWebhookUrl);
    } else if (typeof window !== "undefined") {
      setWebhookUrlInput(`${window.location.origin}/api/telegram/webhook`);
    }
  }, [telegramWebhookUrl]);

  // Fetch webhook status whenever switching to Telegram tab
  const fetchWebhookStatus = async () => {
    setIsLoadingWebhookInfo(true);
    try {
      const res = await fetch("/api/telegram/set-webhook");
      const data = await res.json();
      if (res.ok && data.webhookInfo?.result) {
        setWebhookInfo(data.webhookInfo.result);
        if (data.webhookInfo.result.url && !telegramWebhookUrl) {
          setWebhookUrlInput(data.webhookInfo.result.url);
        }
      }
    } catch (err) {
      console.error("Error fetching Telegram webhook info:", err);
    } finally {
      setIsLoadingWebhookInfo(false);
    }
  };

  useEffect(() => {
    if (activeTab === "telegram") {
      fetchWebhookStatus();
    }
  }, [activeTab]);

  const handleRegisterWebhook = async () => {
    setIsSettingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await fetch("/api/telegram/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrlInput.trim(),
          botToken: telegramTokenInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookFeedback({
          success: true,
          message: data.message || "Telegram Webhook successfully registered! Interactive buttons are now active.",
        });
        showNotification("Telegram Webhook successfully registered!");
        await fetchWebhookStatus();
        await refreshSettings();
      } else {
        setWebhookFeedback({
          success: false,
          message: data.error || "Failed to register Telegram Webhook. Ensure the URL is an HTTPS public URL.",
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setWebhookFeedback({
        success: false,
        message: error.message || "Network error while connecting to Telegram API.",
      });
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestFeedback(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramTokenInput.trim(),
          chatId: telegramChatIdInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramTestFeedback({
          success: true,
          message: data.message || "Test alert sent to Telegram successfully!",
        });
      } else {
        setTelegramTestFeedback({
          success: false,
          message: data.error || "Failed to deliver test message. Please verify Bot Token and Chat/Group ID.",
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setTelegramTestFeedback({
        success: false,
        message: error.message || "Network error sending Telegram test alert.",
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSaveTelegram = async () => {
    setIsSavingTelegram(true);
    setTelegramTestFeedback(null);
    try {
      await updateRates({
        telegramBotToken: telegramTokenInput.trim(),
        telegramChatId: telegramChatIdInput.trim(),
        telegramEnabled: telegramEnabledState,
      });
      showNotification("Telegram notification settings saved to MongoDB Atlas!");
    } catch {
      showNotification("Failed to save Telegram settings. Please try again.");
    } finally {
      setIsSavingTelegram(false);
    }
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

  // Bank Logo Upload & Remove Handlers
  const handleBankLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBankLogo(true);
    setLogoUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "banks");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setBankForm((prev) => ({ ...prev, logoUrl: data.url }));
      } else {
        setLogoUploadError(data.error || "Failed to upload bank logo.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setLogoUploadError(error.message || "Failed to upload bank logo.");
    } finally {
      setIsUploadingBankLogo(false);
      if (bankLogoInputRef.current) {
        bankLogoInputRef.current.value = "";
      }
    }
  };

  const handleRemoveBankLogo = () => {
    setBankForm((prev) => ({ ...prev, logoUrl: "" }));
  };

  // Open modal to add a brand new bank
  const handleOpenAddBank = () => {
    setEditingBankId(null);
    setLogoUploadError(null);
    setBankForm({
      bankName: "",
      logoUrl: "",
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
    setLogoUploadError(null);
    setBankForm({
      bankName: bank.bankName,
      logoUrl: bank.logoUrl || "",
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
    setLogoUploadError(null);
    setBankForm({
      bankName: preset.name,
      logoUrl: "",
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
            logoUrl: bankForm.logoUrl.trim(),
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
        logoUrl: bankForm.logoUrl.trim(),
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
        dollarBuyRateBDT: buyRate,
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
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "accounts"
                ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E9EDF4]"
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Receiving Accounts (bKash, Nagad, Banks)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "accounts" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
            >
              2 Mobile • {bankList.length} Bank{bankList.length !== 1 ? "s" : ""}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rates")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "rates"
                ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E9EDF4]"
              }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Exchange Rates & Simulator</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "rates" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
            >
              ৳{rate}/$
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "telegram"
                ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E9EDF4]"
              }`}
          >
            <Send className="w-4 h-4" />
            <span>Telegram Bot & Group Alerts</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "telegram"
                  ? "bg-white/20 text-white"
                  : telegramBotToken && telegramChatId && telegramEnabled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
            >
              {telegramBotToken && telegramChatId ? "Active" : "Setup Bot"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ocr")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ocr"
                ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E9EDF4]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Receipt AI Scanner (OCR)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "ocr"
                  ? "bg-white/20 text-white"
                  : geminiApiKey
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {geminiApiKey ? "AI Connected" : "Free Setup"}
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
                      className={`w-10 h-5 rounded-full transition-colors relative ${bkashIsEnabled ? "bg-[#E2136E]" : "bg-slate-300"
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${bkashIsEnabled ? "translate-x-5" : ""
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
                      className={`w-10 h-5 rounded-full transition-colors relative ${nagadIsEnabled ? "bg-[#EA580C]" : "bg-slate-300"
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${nagadIsEnabled ? "translate-x-5" : ""
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
                      className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-3xs ${bank.isPrimary
                          ? "bg-white border-[#3858F6] ring-2 ring-[#3858F6]/15"
                          : bank.isActive
                            ? "bg-white border-[#E9EDF4] hover:border-slate-300"
                            : "bg-slate-50 border-slate-200 opacity-60"
                        }`}
                    >
                      {/* Top Row: Logo & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-14 h-10 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-3xs overflow-hidden">
                          {bank.logoUrl ? (
                            <img src={bank.logoUrl} alt={bank.bankName} className="w-full h-full object-contain" />
                          ) : isCity ? (
                            <CityBankLogo className="w-full h-full" />
                          ) : isBrac ? (
                            <BracBankLogo className="w-full h-full" />
                          ) : isDbbl ? (
                            <DbblLogo className="w-full h-full" />
                          ) : (
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
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bank.isActive
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
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${bank.isActive
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

                  {/* Informational banner about client-specific dollar rates */}
                  <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                    <span className="text-base leading-none">💡</span>
                    <div>
                      <span className="font-bold text-[#3858F6]">Individual Client-Specific Dollar Rates:</span>
                      <p className="text-[11px] text-blue-800/80 mt-0.5">
                        ক্লায়েন্টরা রেজিস্ট্রেশনের সময় সরাসরি তাদের রেট (যেমন ৳১৪৮ বা ৳১৫০ বা ম্যানুয়ালি) সিলেক্ট করতে পারে, অথবা আপনি &quot;Client Management&quot; থেকে যেকোনো ক্লায়েন্টের রেট নির্ধারণ করতে পারবেন। এখানে সেট করা রেটটি গ্লোবাল সিস্টেম ডিফল্ট হিসেবে সংরক্ষিত থাকে।
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
                          className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${rate === r
                              ? "bg-[#3858F6] text-white shadow-sm shadow-[#3858F6]/30"
                              : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-200 border border-[#E2E8F0]"
                            }`}
                        >
                          ৳{r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agency Dollar Buying Cost Rate & Spread */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Agency Dollar Buying Cost Rate (ডলার ক্রয় রেট)</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Spread: +৳{(rate - buyRate).toFixed(2)} Profit / USD
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-emerald-600 font-bold text-sm">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={buyRate}
                        onChange={(e) => setBuyRate(Number(e.target.value))}
                        min={50}
                        max={300}
                        step={0.25}
                        required
                        className="w-full pl-9 pr-24 py-3 bg-emerald-50/40 border border-emerald-200 rounded-2xl text-base font-extrabold text-emerald-950 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-emerald-700">
                        Buying Cost / USD
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      এই রেটের ভিত্তিতে অ্যাডমিন ড্যাশবোর্ডে প্রতিদিন, সপ্তাহ ও মাসের আসল লাভ (Net Profit) স্বয়ংক্রিয়ভাবে হিসাব করা হয়।
                    </p>
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
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded cursor-pointer ${serviceFee === v
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
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${calcBudgetUSD === b
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
                          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedGateway === gw
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
                    className={`font-mono font-bold ${differenceBDT >= 0 ? "text-emerald-400" : "text-amber-400"
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

        {/* Tab 3: Telegram Bot & Group Alerts */}
        {activeTab === "telegram" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Telegram Bot Hero Card */}
            <div className="bg-gradient-to-r from-[#0088cc] via-[#0077b5] to-[#172033] rounded-[28px] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-[#0088cc]/15">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Instant Telegram Webhook Integration</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Automated Order Alerts to Telegram Group
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                    Instantly receive real-time alerts whenever a client places an order or admin creates a campaign. Full order details, client info, BDT budget, TrxID, and payment screenshots will be sent to your team group immediately.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-start gap-2 shrink-0">
                  <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
                    Current Bot Status
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${telegramTokenInput && telegramChatIdInput && telegramEnabledState
                          ? "bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50"
                          : "bg-amber-400"
                        }`}
                    />
                    <span className="text-sm font-black text-white">
                      {telegramTokenInput && telegramChatIdInput && telegramEnabledState
                        ? "Active & Broadcasting"
                        : "Requires Token & Group ID"}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/80">
                    {telegramChatIdInput
                      ? `Broadcasting to: ${telegramChatIdInput.split(/[,;\s]+/).filter(Boolean).length} Chat/Group(s)`
                      : "No Chat or Group ID configured yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Settings (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F3F7]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#0088cc] flex items-center justify-center font-black">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-[#121826]">
                          Telegram Bot Credentials
                        </h3>
                        <p className="text-xs text-[#8A94A6]">
                          Configure your Telegram bot token and recipient chat or group IDs.
                        </p>
                      </div>
                    </div>

                    {/* Enable / Disable Switch */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs font-bold text-slate-700">Alerts:</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telegramEnabledState}
                          onChange={(e) => setTelegramEnabledState(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0088cc]"></div>
                      </div>
                    </label>
                  </div>

                  {/* Feedback Message */}
                  {telegramTestFeedback && (
                    <div
                      className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${telegramTestFeedback.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                      {telegramTestFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-semibold">{telegramTestFeedback.message}</span>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Bot Token */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Telegram Bot Token *
                        </label>
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#0088cc] hover:underline flex items-center gap-1"
                        >
                          <span>Get token from @BotFather</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="text"
                        value={telegramTokenInput}
                        onChange={(e) => setTelegramTokenInput(e.target.value)}
                        placeholder="e.g. 789218293:AAEi43U0_aBCdeFGhiJkLMnoPQrStuvwxYZ"
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-[#0088cc] focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Token provided by Telegram's official @BotFather bot when creating your bot.
                      </p>
                    </div>

                    {/* Chat ID / Group ID */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Telegram Chat ID / Group ID *
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Supports multiple IDs (comma-separated)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={telegramChatIdInput}
                        onChange={(e) => setTelegramChatIdInput(e.target.value)}
                        placeholder="e.g. -1001928374650, 589123456"
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#0088cc] focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Enter your Telegram Supergroup ID (typically starts with <code>-100</code>) or User Chat ID. Separate multiple IDs with commas to notify both your personal account and your agency group simultaneously.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F0F3F7]">
                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram || !telegramTokenInput.trim() || !telegramChatIdInput.trim()}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingTelegram ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Test Message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                          <span>Send Test Message</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveTelegram}
                      disabled={isSavingTelegram}
                      className="px-6 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-[#0088cc]/25 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSavingTelegram ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Database...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Telegram Configuration</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card 2: Interactive Telegram Webhook & 1-Click Approval */}
                <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F3F7]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-[#121826] flex items-center gap-2">
                          <span>Direct Telegram Order Approval</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Zero Login Needed
                          </span>
                        </h3>
                        <p className="text-xs text-[#8A94A6]">
                          Confirm and activate orders directly inside Telegram with one tap.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={fetchWebhookStatus}
                      disabled={isLoadingWebhookInfo}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Refresh Telegram Webhook status"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWebhookInfo ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Refresh Status</span>
                    </button>
                  </div>

                  {/* Feature Explanation Banner */}
                  <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200/70 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                    <div className="font-bold flex items-center gap-2 text-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>How 1-Click Approval Works</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                      When an order notification arrives in your Telegram group, it now includes interactive buttons:
                      <strong className="text-emerald-950"> [ ✅ Confirm & Activate Order ]</strong> and <strong className="text-rose-900"> [ ❌ Reject ]</strong>.
                      Tapping the confirm button instantly marks the order as <b>Active</b> and payment as <b>Verified</b> in MongoDB Atlas, and tags the admin who confirmed it. You don&apos;t have to log into this website!
                    </p>
                  </div>

                  {/* Webhook Feedback Message */}
                  {webhookFeedback && (
                    <div
                      className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${webhookFeedback.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                      {webhookFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-semibold">{webhookFeedback.message}</span>
                    </div>
                  )}

                  {/* Current Webhook Status Badge */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Telegram Webhook Connection
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${webhookInfo?.url
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                      >
                        {webhookInfo?.url ? "Active & Registered" : "Not Registered"}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                      {webhookInfo?.url ? (
                        <span className="text-emerald-700 font-bold">✓ {webhookInfo.url}</span>
                      ) : (
                        <span className="text-slate-400 italic">No webhook registered yet. Click &quot;Activate Webhook&quot; below to link Telegram.</span>
                      )}
                    </div>
                    {webhookInfo?.last_error_message && (
                      <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        ⚠️ Last Telegram Error: {webhookInfo.last_error_message}
                      </div>
                    )}
                  </div>

                  {/* Webhook Registration Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Telegram Webhook Endpoint URL *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={webhookUrlInput}
                        onChange={(e) => setWebhookUrlInput(e.target.value)}
                        placeholder="https://your-domain.com/api/telegram/webhook"
                        className="flex-1 px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRegisterWebhook}
                        disabled={isSettingWebhook || !webhookUrlInput.trim() || !telegramTokenInput.trim()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isSettingWebhook ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Activate Webhook</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Telegram requires an <b>HTTPS</b> public domain to send button click updates. In production (e.g. Vercel), click <b>Activate Webhook</b> once to link Telegram.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Setup Guide & Sample Preview (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 3-Minute Setup Guide */}
                <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
                  <h3 className="text-sm font-black text-[#121826] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    How to Setup Telegram in 3 Minutes
                  </h3>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#0088cc] font-black text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Create your Bot</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Open Telegram, search for <strong className="text-slate-800">@BotFather</strong>, send <code>/newbot</code>, give it a name (e.g. <em>Shopno IT Alerts</em>), and copy the HTTP API token.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#0088cc] font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Create Team Group & Add Bot</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Create a Telegram group for your agency team, add your newly created bot into the group, and grant it permission to post messages.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#0088cc] font-black text-xs flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Find your Group ID</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Add <strong className="text-slate-800">@RawDataBot</strong> to the group temporarily. It will output a message containing the group's <code>chat.id</code> (starts with <code>-100...</code>). Copy that ID and paste it in the field on the left.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#0088cc] font-black text-xs flex items-center justify-center shrink-0">
                        4
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Test & Go Live</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Click <strong className="text-slate-800">"Send Test Message"</strong>. Once verified, click <strong className="text-slate-800">"Save Telegram Configuration"</strong>. All new orders will now ping your group!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Notification Preview Card */}
                <div className="bg-[#172033] rounded-[28px] p-5 text-white space-y-3 border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-blue-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Sample Group Message Preview
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono">Telegram HTML</span>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-700/60 font-mono text-[11px] text-slate-300 space-y-1 leading-relaxed">
                    <div className="text-amber-400 font-bold">🚀 NEW META ADS ORDER RECEIVED!</div>
                    <div className="text-slate-500">━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                    <div>📦 <b>Order ID:</b> <span className="text-cyan-400">#BOOST-1006</span></div>
                    <div>🏷️ <b>Campaign:</b> Summer Eid Collection Boost</div>
                    <div>🎯 <b>Category:</b> Boost Post (Messages)</div>
                    <div>👤 <b>Client:</b> Rahim Ahmed (Min Mart BD)</div>
                    <div>💰 <b>Total Budget:</b> <span className="text-emerald-400">$35.00 USD (≈ ৳5,250 BDT)</span></div>
                    <div>💳 <b>Payment:</b> bKash • <span className="text-emerald-400">Verified</span></div>
                    <div>🆔 <b>TrxID:</b> 89JKA9812</div>
                    <div>📸 <b>Payment Proof:</b> [Receipt Photo Attached]</div>
                    <div className="text-slate-500">━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                    <div className="text-[10px] text-slate-400 italic">⚡ Shopno IT • Automated Agency Notification</div>
                  </div>

                  {/* Mock Inline Buttons */}
                  <div className="pt-1 space-y-2">
                    <div className="text-[10px] text-blue-300 font-sans font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Interactive Buttons inside Telegram:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="py-2 px-2 bg-emerald-600 text-white font-sans text-[11px] font-bold rounded-xl text-center shadow border border-emerald-400/40 select-none">
                        ✅ Confirm & Activate
                      </div>
                      <div className="py-2 px-2 bg-rose-600 text-white font-sans text-[11px] font-bold rounded-xl text-center shadow border border-rose-400/40 select-none">
                        ❌ Reject
                      </div>
                    </div>
                    <div className="py-1.5 px-3 bg-slate-800 text-blue-400 hover:text-blue-300 text-center font-sans text-[11px] font-bold rounded-xl border border-slate-700 select-none">
                      🔗 View Order in Admin
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Receipt Scanner & OCR Configuration */}
        {activeTab === "ocr" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Card */}
            <div className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-[28px] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Multimodal AI Vision & Receipt Intelligence</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Smart Payment Receipt & Bank Slip Scanner
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                    Automatically scans uploaded payment screenshots to extract bKash & Nagad TrxIDs, Bank Transfer Account Numbers, Bank Names, and Sender Mobile numbers with 99.8% precision.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-start gap-2 shrink-0">
                  <div className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                    Scanner Status
                  </div>
                  {geminiApiKey ? (
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Google Gemini 1.5 Flash Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Running on Cloud OCR Fallback</span>
                    </div>
                  )}
                  <span className="text-[11px] text-indigo-200/80">
                    {geminiApiKey ? "Full AI vision analysis enabled" : "Add Free Gemini API key below for 99.8% accuracy"}
                  </span>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: API Key Configuration Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <form
                  onSubmit={handleSaveOcr}
                  className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-[#F0F3F7] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4338ca]">
                        <Scan className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          Google Gemini Vision API Key
                        </h3>
                        <p className="text-xs text-slate-500">
                          Recommended engine for Bangladeshi mobile banking & bank slips
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      100% Free Tier
                    </span>
                  </div>

                  {ocrSaveFeedback && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                        ocrSaveFeedback.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      {ocrSaveFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{ocrSaveFeedback.message}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Gemini API Key (Google AI Studio)
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={geminiApiKeyInput}
                        onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-4 py-3 pr-20 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#4338ca] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-slate-400 hover:text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showApiKey ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Your API key is securely stored in your database settings and used directly on server uploads to scan receipt images.
                    </p>
                  </div>

                  {/* Free Key Instructions */}
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        How to get a Free Gemini Vision API Key in 30 Seconds:
                      </span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4338ca] hover:underline"
                      >
                        <span>Open AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <ol className="text-xs text-indigo-900/90 list-decimal list-inside space-y-1 pl-1">
                      <li>Go to <strong>Google AI Studio</strong> (aistudio.google.com).</li>
                      <li>Sign in with any standard Google account.</li>
                      <li>Click <strong>&quot;Get API key&quot;</strong> &rarr; <strong>&quot;Create API key&quot;</strong>.</li>
                      <li>Copy the generated key (starts with <code className="bg-indigo-100 px-1 py-0.5 rounded text-[10px] font-mono">AIzaSy...</code>) and paste it above.</li>
                      <li>Click <strong>Save OCR API Configuration</strong>.</li>
                    </ol>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Supports: JPG, PNG, WEBP, PDF (up to 10MB)
                    </span>
                    <button
                      type="submit"
                      disabled={isSavingOcr}
                      className="px-5 py-2.5 bg-[#4338ca] hover:bg-[#3730a3] text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingOcr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSavingOcr ? "Saving..." : "Save OCR API Configuration"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Multi-Engine Architecture & Capabilities (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-[28px] border border-[#E9EDF4] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    What the AI Scanner Extracts:
                  </h4>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        Trx
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          bKash & Nagad Transaction ID
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Detects 10-char bKash TrxID (e.g. <code className="font-mono text-slate-700">CKL941DK31</code>) and 8-char Nagad TrxID (e.g. <code className="font-mono text-slate-700">71AA882K</code>).
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#3858F6] flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Bank Transfer Account Number
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Detects 10 to 18-digit account numbers from City Bank, BRAC Astha, DBBL NexusPay, Islami Bank Cellfin, EBL, and MTB.
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Bank Name & Auto-Match
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Automatically identifies the bank name and auto-selects the corresponding partner bank account on the order form.
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Sender Mobile & Paid BDT Amount
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Cross-verifies the paid amount against the order total to catch incorrect transfer amounts instantly.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Engine Fallback Pipeline Card */}
                <div className="p-5 rounded-[24px] bg-slate-900 text-white space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>3-Layer Resilient Scanning Pipeline</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span>1. Google Gemini 1.5 Flash Vision</span>
                      <span className="text-emerald-400 font-bold">99.8% Precision</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>2. Cloud OCR.Space Engine</span>
                      <span className="text-blue-400 font-bold">Cloud Fallback</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>3. Local Tesseract Engine</span>
                      <span className="text-slate-400 font-bold">Offline Fallback</span>
                    </div>
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

              {/* Bank Logo Upload & Preview */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5 text-[#3858F6]" />
                    <span>Bank Logo (Optional)</span>
                  </label>
                  {bankForm.logoUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Logo Uploaded
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Logo Preview Box */}
                  <div className="w-20 h-14 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-3xs overflow-hidden">
                    {isUploadingBankLogo ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-[#3858F6]" />
                    ) : bankForm.logoUrl ? (
                      <img
                        src={bankForm.logoUrl}
                        alt="Bank Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <Building className="w-6 h-6" />
                        <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">No Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & File Input */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={bankLogoInputRef}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        onChange={handleBankLogoUpload}
                        className="hidden"
                        id="bank-logo-upload-input"
                      />
                      <label
                        htmlFor="bank-logo-upload-input"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer ${isUploadingBankLogo
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        {isUploadingBankLogo ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3858F6]" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-[#3858F6]" />
                            <span>{bankForm.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                          </>
                        )}
                      </label>

                      {bankForm.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveBankLogo}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Upload bank icon or logo (PNG, SVG, JPG, WebP). Appears on checkout and receipt.
                    </p>

                    {logoUploadError && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{logoUploadError}</span>
                      </p>
                    )}
                  </div>
                </div>
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
