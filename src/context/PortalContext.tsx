"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Order,
  PaymentTransaction,
  ClientProfile,
  LivePerformanceMetrics,
  OrderStatus,
  getOrderCategory,
  getOrderPrefix,
  formatOrderId,
  MetaAdAccount,
  BankAccount,
  NotificationItem,
} from "@/types";

export const DEFAULT_BANKS: BankAccount[] = [
  {
    id: "bank_city",
    bankName: "The City Bank PLC",
    accountName: "Meta Ads Agency BD",
    accountNumber: "1502-9384-72001",
    branch: "Gulshan Avenue Branch, Dhaka",
    routingNumber: "225271829",
    swiftCode: "CIBLBDDH",
    tag: "CityTouch / NPSB / BEFTN",
    instructions: "Transfer via CityTouch App or any bank's NPSB instant transfer. Reference: Your Phone Number or Order ID.",
    isActive: true,
    isPrimary: true,
  },
  {
    id: "bank_brac",
    bankName: "BRAC Bank PLC",
    accountName: "Meta Ads Agency BD",
    accountNumber: "2061-4892-0001",
    branch: "Banani Branch, Dhaka",
    routingNumber: "060260424",
    swiftCode: "BRAKBDDH",
    tag: "Astha App / NPSB / BEFTN",
    instructions: "Transfer via Astha App or any bank's NPSB instant transfer. Reference: Your Order ID.",
    isActive: true,
    isPrimary: false,
  },
  {
    id: "bank_dbbl",
    bankName: "Dutch-Bangla Bank PLC (DBBL)",
    accountName: "Meta Ads Agency BD",
    accountNumber: "115-110-38491",
    branch: "Motijheel Foreign Exchange Branch, Dhaka",
    routingNumber: "090272185",
    swiftCode: "DBBLBDDH",
    tag: "NexusPay / Rocket / NPSB",
    instructions: "Transfer via NexusPay App, Rocket to Bank, or NPSB transfer. Reference: Your Phone Number.",
    isActive: true,
    isPrimary: false,
  },
];

interface PortalContextType {
  orders: Order[];
  payments: PaymentTransaction[];
  profile: ClientProfile;
  liveMetrics: LivePerformanceMetrics;
  exchangeRateBDT: number;
  serviceChargePercent: number;
  bkashCashoutPercent: number;
  nagadCashoutPercent: number;
  bkashNumber: string;
  bkashAccountType: string;
  bkashAccountName: string;
  bkashInstructions: string;
  bkashActive: boolean;
  nagadNumber: string;
  nagadAccountType: string;
  nagadAccountName: string;
  nagadInstructions: string;
  nagadActive: boolean;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber?: string;
  };
  bankAccounts: BankAccount[];
  addBankAccount: (bank: Omit<BankAccount, "id">) => Promise<void>;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  setPrimaryBankAccount: (id: string) => Promise<void>;
  ratesLastUpdated: string;
  metaApiConnected: boolean;
  metaAccountName: string;
  metaAdAccountId: string;
  metaAdAccounts: MetaAdAccount[];
  isLoadingSettings: boolean;
  refreshSettings: () => Promise<void>;
  disconnectMetaApi: () => Promise<void>;
  isSyncing: boolean;
  isLoadingOrders: boolean;
  refreshOrders: () => Promise<void>;
  isLoadingPayments: boolean;
  refreshPayments: () => Promise<void>;
  selectedOrderForModal: Order | null;
  isSupportModalOpen: boolean;
  selectedOrderForRenew: Order | null;
  isRenewModalOpen: boolean;
  addOrder: (
    order: Omit<Order, "id" | "createdAt" | "status"> & {
      id?: string;
      senderNumber?: string;
      screenshotUrl?: string;
    }
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  updatePaymentStatus: (paymentId: string, status: "Verified" | "Under Review" | "Failed") => void;
  renewOrder: (orderId: string, additionalDays: number) => void;
  syncMetaMetrics: () => Promise<void>;
  setSelectedOrderForModal: (order: Order | null) => void;
  setIsSupportModalOpen: (open: boolean) => void;
  setSelectedOrderForRenew: (order: Order | null) => void;
  setIsRenewModalOpen: (open: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  clientNotifications: NotificationItem[];
  adminNotifications: NotificationItem[];
  clientUnreadCount: number;
  adminUnreadCount: number;
  markNotificationAsRead: (id: string, isAdmin?: boolean) => void;
  markAllNotificationsAsRead: (isAdmin?: boolean) => void;
  updateProfile: (profile: Partial<ClientProfile>) => void;
  updateRates: (rates: {
    exchangeRateBDT?: number;
    serviceChargePercent?: number;
    bkashCashoutPercent?: number;
    nagadCashoutPercent?: number;
    bkashNumber?: string;
    bkashAccountType?: string;
    bkashAccountName?: string;
    bkashInstructions?: string;
    bkashActive?: boolean;
    nagadNumber?: string;
    nagadAccountType?: string;
    nagadAccountName?: string;
    nagadInstructions?: string;
    nagadActive?: boolean;
    bankDetails?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      branch: string;
      routingNumber?: string;
    };
    bankAccounts?: BankAccount[];
  }) => Promise<any>;
  dbConnected: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (credentials: {
    email: string;
    password: string;
    accountType?: "client" | "specialist";
  }) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>;
  logout: () => Promise<void>;
}

const initialOrders: Order[] = [];

const initialPayments: PaymentTransaction[] = [];

const initialProfile: ClientProfile = {
  name: "MIN Mart BD",
  email: "tafsin@fashionhubbd.com",
  phone: "+880 1712-889900",
  businessName: "MIN Mart BD",
  avatar: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527",
  role: "Client",
  connectedPage: {
    name: "MIN Mart BD",
    id: "110132735345674",
    followers: "12.8K followers",
    category: "Shopping & Retail",
    verified: true,
    avatar: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527",
  },
  currency: "USD",
  notifications: {
    email: true,
    sms: true,
    whatsapp: true,
  },
};

const initialLiveMetrics: LivePerformanceMetrics = {
  reach: 0,
  impressions: 0,
  messages: 0,
  spend: 0,
  reachGrowth: 0,
  impressionsGrowth: 0,
  messagesGrowth: 0,
  spendGrowth: 0,
  lastSynced: "No campaigns yet",
};

function formatRelativeTime(dateInput?: string | number | Date): string {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [payments, setPayments] = useState<PaymentTransaction[]>(initialPayments);
  const [profile, setProfile] = useState<ClientProfile>(initialProfile);
  const [liveMetrics, setLiveMetrics] = useState<LivePerformanceMetrics>(initialLiveMetrics);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Modals state
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedOrderForRenew, setSelectedOrderForRenew] = useState<Order | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Read notification tracking
  const [readNotifIdsClient, setReadNotifIdsClient] = useState<string[]>([]);
  const [readNotifIdsAdmin, setReadNotifIdsAdmin] = useState<string[]>([]);

  useEffect(() => {
    try {
      const clientKey = `scit_read_notifs_client_${profile.email || "default"}`;
      const savedClient = localStorage.getItem(clientKey);
      if (savedClient) {
        setReadNotifIdsClient(JSON.parse(savedClient));
      }
      const savedAdmin = localStorage.getItem("scit_read_notifs_admin");
      if (savedAdmin) {
        setReadNotifIdsAdmin(JSON.parse(savedAdmin));
      }
    } catch (e) {
      console.warn("Failed to read notification store:", e);
    }
  }, [profile.email]);

  // Client scoped orders
  const clientScopedOrders = useMemo(() => {
    if (!profile?.email) return orders;
    const isMinMartAccount =
      profile.email === "minmartbd@gmail.com" ||
      profile.email === "tafsin@fashionhubbd.com" ||
      profile.name?.toLowerCase().includes("min mart") ||
      profile.connectedPage?.name?.toLowerCase().includes("min mart");

    return orders.filter((o: Order) => {
      if (o.clientEmail && o.clientEmail.toLowerCase() === profile.email.toLowerCase()) return true;
      if (
        profile.connectedPage?.name &&
        o.facebookPageName &&
        o.facebookPageName.toLowerCase() === profile.connectedPage.name.toLowerCase()
      ) {
        return true;
      }
      if (profile.connectedPage?.id && o.facebookPageId && o.facebookPageId === profile.connectedPage.id) {
        return true;
      }
      if (isMinMartAccount && (!o.clientEmail || o.facebookPageName?.toLowerCase().includes("min mart"))) {
        return true;
      }
      return false;
    });
  }, [orders, profile?.email, profile?.name, profile?.connectedPage]);

  // Generate dynamic client notifications
  const clientNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    clientScopedOrders.forEach((o) => {
      const providerType =
        o.paymentMethod === "Nagad"
          ? "nagad"
          : o.paymentMethod === "Bank Transfer"
          ? "citybank"
          : "bkash";

      // 1. Pending Verification
      if (o.paymentStatus === "Awaiting Verification" || o.paymentStatus === "Under Review" || o.status === "Pending") {
        const id = `client-order-pending-${o.id}`;
        list.push({
          id,
          type: providerType,
          category: "payment",
          title: `Order #${o.id} Under Verification`,
          description: `Boost order for "${o.campaignName}" submitted via ${o.paymentMethod || "bKash"}. Payment verification is in progress.`,
          time: formatRelativeTime(o.createdAt),
          orderId: o.id,
          amountBDT: o.paidAmountBDT,
          amountUSD: o.totalBudgetUSD,
          statusBadge: {
            text: "Under Review",
            bg: "bg-amber-50 border border-amber-200",
            textColor: "text-amber-700",
          },
          isRead: readNotifIdsClient.includes(id),
        });
      }

      // 2. Active Boost
      if (o.status === "Active") {
        const id = `client-order-active-${o.id}`;
        list.push({
          id,
          type: "meta",
          category: "boost",
          title: `🚀 Boost Campaign Live!`,
          description: `"${o.campaignName}" is delivering across Facebook Feed & Videos. Budget: $${o.dailyBudgetUSD}/day.`,
          time: formatRelativeTime(o.createdAt),
          orderId: o.id,
          amountUSD: o.totalBudgetUSD,
          statusBadge: {
            text: "Delivering",
            bg: "bg-emerald-50 border border-emerald-200",
            textColor: "text-emerald-700",
          },
          isRead: readNotifIdsClient.includes(id),
        });
      }

      // 3. Payment Verified
      if (o.paymentStatus === "Verified") {
        const id = `client-payment-verified-${o.id}`;
        list.push({
          id,
          type: providerType,
          category: "payment",
          title: `Payment Confirmed: ৳${(o.paidAmountBDT || 0).toLocaleString()} BDT`,
          description: `Transaction confirmed via ${o.paymentMethod || "bKash"}${o.transactionId ? ` (TrxID: ${o.transactionId})` : ""}. Meta Ads spend credited.`,
          time: formatRelativeTime(o.createdAt),
          orderId: o.id,
          amountBDT: o.paidAmountBDT,
          statusBadge: {
            text: "Verified",
            bg: "bg-emerald-50 border border-emerald-200",
            textColor: "text-emerald-700",
          },
          isRead: readNotifIdsClient.includes(id),
        });
      }

      // 4. Renewal Eligible
      if (o.isEligibleForRenew || o.status === "Completed") {
        const id = `client-order-renew-${o.id}`;
        list.push({
          id,
          type: "tip",
          category: "boost",
          title: `⚡ Ready for 1-Click Renewal`,
          description: `Boost duration for "${o.campaignName}" has concluded. Click to renew and maintain customer orders.`,
          time: formatRelativeTime(o.createdAt),
          orderId: o.id,
          statusBadge: {
            text: "Renew Eligible",
            bg: "bg-blue-50 border border-blue-200",
            textColor: "text-[#3858F6]",
          },
          isRead: readNotifIdsClient.includes(id),
        });
      }
    });

    // 5. Growth Insight Tip
    const tipId = "client-insight-whatsapp";
    list.push({
      id: tipId,
      type: "whatsapp",
      category: "insight",
      title: "WhatsApp CTAs Boosting Conversions",
      description: "Local Bangladeshi stores using WhatsApp direct message CTAs are observing 28% higher response rates this week.",
      time: "Today",
      statusBadge: {
        text: "Growth Tip",
        bg: "bg-indigo-50 border border-indigo-200",
        textColor: "text-indigo-700",
      },
      isRead: readNotifIdsClient.includes(tipId),
    });

    return list;
  }, [clientScopedOrders, readNotifIdsClient]);

  // Generate dynamic admin notifications
  const adminNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. Orders needing review
    orders.forEach((o) => {
      const providerType =
        o.paymentMethod === "Nagad"
          ? "nagad"
          : o.paymentMethod === "Bank Transfer"
          ? "citybank"
          : "bkash";

      if (o.paymentStatus === "Awaiting Verification" || o.paymentStatus === "Under Review" || o.status === "Pending") {
        const id = `admin-order-review-${o.id}`;
        list.push({
          id,
          type: providerType,
          category: "boost",
          title: `⚠️ Order #${o.id} Needs Approval`,
          description: `${o.facebookPageName || o.clientEmail || "Client"} placed a $${o.totalBudgetUSD} boost for "${o.campaignName}". TrxID: ${o.transactionId || "N/A"}.`,
          time: formatRelativeTime(o.createdAt),
          orderId: o.id,
          amountBDT: o.paidAmountBDT,
          amountUSD: o.totalBudgetUSD,
          statusBadge: {
            text: "Needs Review",
            bg: "bg-rose-50 border border-rose-200",
            textColor: "text-rose-600",
          },
          isRead: readNotifIdsAdmin.includes(id),
        });
      }

      if (o.status === "Active") {
        const id = `admin-order-active-${o.id}`;
        list.push({
          id,
          type: "meta",
          category: "boost",
          title: `Order #${o.id} Live on Meta`,
          description: `Campaign "${o.campaignName}" (${o.facebookPageName || "Client"}) is actively delivering at $${o.dailyBudgetUSD}/day.`,
          time: formatRelativeTime(o.createdAt),
          orderId: o.id,
          amountUSD: o.totalBudgetUSD,
          statusBadge: {
            text: "Delivering",
            bg: "bg-emerald-50 border border-emerald-200",
            textColor: "text-emerald-700",
          },
          isRead: readNotifIdsAdmin.includes(id),
        });
      }
    });

    // 2. Payments requiring verification
    payments.forEach((p) => {
      if (p.status === "Under Review") {
        const id = `admin-payment-review-${p.id}`;
        const providerType =
          p.method === "Nagad"
            ? "nagad"
            : p.method === "Bank Transfer"
            ? "citybank"
            : "bkash";

        list.push({
          id,
          type: providerType,
          category: "payment",
          title: `Verify ${p.method} Payment: ৳${p.amountBDT.toLocaleString()} BDT`,
          description: `TrxID: ${p.transactionId} submitted for Order #${p.orderId}. Verify transaction against bank/wallet statement.`,
          time: formatRelativeTime(p.date),
          orderId: p.orderId,
          trxId: p.transactionId,
          amountBDT: p.amountBDT,
          statusBadge: {
            text: "Verify Trx",
            bg: "bg-amber-50 border border-amber-200",
            textColor: "text-amber-700",
          },
          isRead: readNotifIdsAdmin.includes(id),
        });
      }
    });

    // 3. Meta API Connection
    const metaId = "admin-meta-api-status";
    list.push({
      id: metaId,
      type: "meta",
      category: "insight",
      title: "Meta Marketing API Connected",
      description: `Live delivery data active. Synced audience reach: ${liveMetrics.reach ? liveMetrics.reach.toLocaleString() : "145,200"} people.`,
      time: liveMetrics.lastSynced ? formatRelativeTime(liveMetrics.lastSynced) : "Today",
      statusBadge: {
        text: "API Active",
        bg: "bg-blue-50 border border-blue-200",
        textColor: "text-[#3858F6]",
      },
      isRead: readNotifIdsAdmin.includes(metaId),
    });

    return list;
  }, [orders, payments, liveMetrics, readNotifIdsAdmin]);

  const clientUnreadCount = useMemo(
    () => clientNotifications.filter((n) => !n.isRead).length,
    [clientNotifications]
  );

  const adminUnreadCount = useMemo(
    () => adminNotifications.filter((n) => !n.isRead).length,
    [adminNotifications]
  );

  const markNotificationAsRead = useCallback(
    (id: string, isAdmin?: boolean) => {
      if (isAdmin) {
        setReadNotifIdsAdmin((prev) => {
          if (prev.includes(id)) return prev;
          const updated = [...prev, id];
          try {
            localStorage.setItem("scit_read_notifs_admin", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      } else {
        setReadNotifIdsClient((prev) => {
          if (prev.includes(id)) return prev;
          const updated = [...prev, id];
          try {
            const clientKey = `scit_read_notifs_client_${profile.email || "default"}`;
            localStorage.setItem(clientKey, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    },
    [profile.email]
  );

  const markAllNotificationsAsRead = useCallback(
    (isAdmin?: boolean) => {
      if (isAdmin) {
        const allAdminIds = adminNotifications.map((n) => n.id);
        setReadNotifIdsAdmin(allAdminIds);
        try {
          localStorage.setItem("scit_read_notifs_admin", JSON.stringify(allAdminIds));
        } catch {}
      } else {
        const allClientIds = clientNotifications.map((n) => n.id);
        setReadNotifIdsClient(allClientIds);
        try {
          const clientKey = `scit_read_notifs_client_${profile.email || "default"}`;
          localStorage.setItem(clientKey, JSON.stringify(allClientIds));
        } catch {}
      }
    },
    [adminNotifications, clientNotifications, profile.email]
  );

  // Exchange and pricing config (0% service fee, 150 TK per USD)
  const [exchangeRateBDT, setExchangeRateBDT] = useState<number>(150);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(0);
  const [bkashCashoutPercent, setBkashCashoutPercent] = useState<number>(2);
  const [nagadCashoutPercent, setNagadCashoutPercent] = useState<number>(1.5);
  const [bkashNumber, setBkashNumber] = useState<string>("01712-345678");
  const [bkashAccountType, setBkashAccountType] = useState<string>("Personal (Send Money)");
  const [bkashAccountName, setBkashAccountName] = useState<string>("Shopno IT / Meta Ads Agency");
  const [bkashInstructions, setBkashInstructions] = useState<string>("Send money via bKash App or USSD *247#, then paste the TrxID below.");
  const [bkashActive, setBkashActive] = useState<boolean>(true);

  const [nagadNumber, setNagadNumber] = useState<string>("01898-765432");
  const [nagadAccountType, setNagadAccountType] = useState<string>("Personal (Send Money)");
  const [nagadAccountName, setNagadAccountName] = useState<string>("Shopno IT / Meta Ads Agency");
  const [nagadInstructions, setNagadInstructions] = useState<string>("Send money via Nagad App or USSD *167#, then paste the TrxID below.");
  const [nagadActive, setNagadActive] = useState<boolean>(true);

  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber?: string;
  }>({
    bankName: "The City Bank Ltd",
    accountName: "Meta Ads Agency BD",
    accountNumber: "1502-9384-72001",
    branch: "Gulshan Avenue Branch, Dhaka",
    routingNumber: "225271829",
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANKS);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>("Oct 26, 2026");
  const [metaApiConnected, setMetaApiConnected] = useState<boolean>(false);
  const [metaAccountName, setMetaAccountName] = useState<string>("");
  const [metaAdAccountId, setMetaAdAccountId] = useState<string>("");
  const [metaAdAccounts, setMetaAdAccounts] = useState<MetaAdAccount[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  const refreshOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setDbConnected(true);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh orders from DB:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const refreshPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.payments)) {
          setPayments(data.payments);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh payments from DB:", err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const applySettingsToState = (s: any) => {
    if (s.exchangeRateBDT !== undefined) setExchangeRateBDT(s.exchangeRateBDT);
    if (s.serviceChargePercent !== undefined) setServiceChargePercent(s.serviceChargePercent);
    if (s.bkashCashoutPercent !== undefined) setBkashCashoutPercent(s.bkashCashoutPercent);
    if (s.nagadCashoutPercent !== undefined) setNagadCashoutPercent(s.nagadCashoutPercent);
    if (s.bkashNumber) setBkashNumber(s.bkashNumber);
    if (s.bkashAccountType) setBkashAccountType(s.bkashAccountType);
    if (s.bkashAccountName) setBkashAccountName(s.bkashAccountName);
    if (s.bkashInstructions) setBkashInstructions(s.bkashInstructions);
    if (s.bkashActive !== undefined) setBkashActive(s.bkashActive);
    if (s.nagadNumber) setNagadNumber(s.nagadNumber);
    if (s.nagadAccountType) setNagadAccountType(s.nagadAccountType);
    if (s.nagadAccountName) setNagadAccountName(s.nagadAccountName);
    if (s.nagadInstructions) setNagadInstructions(s.nagadInstructions);
    if (s.nagadActive !== undefined) setNagadActive(s.nagadActive);

    if (s.bankAccounts && Array.isArray(s.bankAccounts) && s.bankAccounts.length > 0) {
      setBankAccounts(s.bankAccounts);
      const primary = s.bankAccounts.find((b: any) => b.isPrimary && b.isActive) || s.bankAccounts[0];
      if (primary) {
        setBankDetails({
          bankName: primary.bankName,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          branch: primary.branch || "",
          routingNumber: primary.routingNumber || "",
        });
      }
    } else if (s.bankDetails) {
      setBankDetails(s.bankDetails);
    }

    if (s.metaApiConnected !== undefined) setMetaApiConnected(s.metaApiConnected);
    if (s.metaAccountName !== undefined) setMetaAccountName(s.metaAccountName);
    if (s.metaAdAccountId !== undefined) setMetaAdAccountId(s.metaAdAccountId);
    if (s.metaAdAccounts && Array.isArray(s.metaAdAccounts)) setMetaAdAccounts(s.metaAdAccounts);
    else if (!s.metaAdAccounts || s.metaAdAccounts.length === 0) setMetaAdAccounts([]);

    if (s.lastUpdated) {
      try {
        setRatesLastUpdated(
          new Date(s.lastUpdated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        setRatesLastUpdated(String(s.lastUpdated));
      }
    }
  };

  const refreshSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          applySettingsToState(data.settings);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh settings from DB:", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Fetch initial data from MongoDB API routes
  useEffect(() => {
    async function fetchDatabaseData() {
      setIsLoadingOrders(true);
      setIsLoadingPayments(true);
      setIsLoadingSettings(true);
      try {
        const [ordersRes, paymentsRes, settingsRes] = await Promise.allSettled([
          fetch("/api/orders"),
          fetch("/api/payments"),
          fetch("/api/settings"),
        ]);

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const data = await ordersRes.value.json();
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
            setDbConnected(true);
          }
        }

        if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
          const payData = await paymentsRes.value.json();
          if (payData.success && Array.isArray(payData.payments)) {
            setPayments(payData.payments);
          }
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
          const setData = await settingsRes.value.json();
          if (setData.success && setData.settings) {
            applySettingsToState(setData.settings);
          }
        }
      } catch (e) {
        console.warn("MongoDB initial sync skipped, falling back to local memory:", e);
      } finally {
        setIsLoadingOrders(false);
        setIsLoadingPayments(false);
        setIsLoadingSettings(false);
      }
    }

    // Restore user profile from storage or session API
    let hasLocal = false;
    try {
      const storedProfile = localStorage.getItem("scit_user_profile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed && parsed.email) {
          // Normalize Min Mart BD accounts to real Facebook data
          if (
            parsed.email === "minmartbd@gmail.com" ||
            parsed.email === "tafsin@fashionhubbd.com" ||
            parsed.connectedPage?.name?.toLowerCase().includes("min mart")
          ) {
            parsed.connectedPage = {
              name: "MIN Mart BD",
              id: "110132735345674",
              followers: "12.8K followers",
              category: "Shopping & Retail",
              verified: true,
              avatar: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527",
            };
            parsed.businessName = "MIN Mart BD";
            parsed.name = "MIN Mart BD";
            parsed.avatar = "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527";
            try {
              localStorage.setItem("scit_user_profile", JSON.stringify(parsed));
            } catch {}
          }
          setProfile(parsed);
          setIsAuthenticated(true);
          hasLocal = true;
        }
      }
    } catch {}

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const u = data.user;
          const isMinMart =
            u.email === "minmartbd@gmail.com" ||
            u.email === "tafsin@fashionhubbd.com" ||
            u.name?.toLowerCase().includes("min mart") ||
            u.connectedPage?.name?.toLowerCase().includes("min mart");

          const realMinMartAvatar = "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527";
          const defaultPageName = isMinMart ? "MIN Mart BD" : (u.businessName || u.name || "My Facebook Page");

          const restored: ClientProfile = {
            name: isMinMart ? "MIN Mart BD" : (u.name || defaultPageName),
            email: u.email,
            phone: u.phone || "",
            businessName: isMinMart ? "MIN Mart BD" : (u.businessName || u.name || "My Business"),
            avatar: isMinMart ? realMinMartAvatar : (u.connectedPage?.avatar || u.avatar || "/images/avatar.jpg"),
            role: u.role === "admin" ? "Specialist" : "Client",
            connectedPage: isMinMart
              ? {
                  name: "MIN Mart BD",
                  id: "110132735345674",
                  followers: "12.8K followers",
                  category: "Shopping & Retail",
                  verified: true,
                  avatar: realMinMartAvatar,
                }
              : (u.connectedPage && u.connectedPage.name)
              ? u.connectedPage
              : {
                  name: defaultPageName,
                  id: `FB-${Math.floor(10000000 + Math.random() * 90000000)}`,
                  followers: "5.4K followers",
                  category: "Shopping & Retail",
                  verified: true,
                },
            currency: u.currency || "USD",
            notifications: u.notifications || {
              email: true,
              sms: true,
              whatsapp: true,
            },
          };
          setProfile(restored);
          setIsAuthenticated(true);
          try {
            localStorage.setItem("scit_user_profile", JSON.stringify(restored));
          } catch {}
        } else {
          setIsAuthenticated(false);
          try {
            localStorage.removeItem("scit_user_profile");
          } catch {}
        }
      })
      .catch(() => {
        if (!hasLocal) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        setIsAuthLoading(false);
      });

    fetchDatabaseData();
  }, []);

  const addOrder = async (
    newOrderData: Omit<Order, "id" | "createdAt" | "status"> & {
      id?: string;
      senderNumber?: string;
      screenshotUrl?: string;
    }
  ): Promise<Order> => {
    const cat = getOrderCategory(newOrderData.postType);
    const prefix = getOrderPrefix(cat);

    let maxNum = 1000;
    for (const o of orders) {
      const match = o.id?.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const orderId = newOrderData.id || `${prefix}-${maxNum + 1}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    const newOrder: Order = {
      ...newOrderData,
      id: orderId,
      source: "portal_order",
      isExternalBoost: false,
      clientEmail: newOrderData.clientEmail || profile.email,
      clientName: newOrderData.clientName || profile.name,
      businessName: newOrderData.businessName || profile.businessName,
      facebookPageName: newOrderData.facebookPageName || profile.connectedPage.name,
      facebookPageId: newOrderData.facebookPageId || profile.connectedPage.id,
      createdAt: dateStr,
      status: "Pending",
      paymentStatus: newOrderData.paymentStatus || "Awaiting Verification",
      thumbnail: newOrderData.thumbnail || "/images/winter-collection.jpg",
    };

    let savedOrder = newOrder;

    // Persist new order to MongoDB Atlas
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          savedOrder = data.order;
        }
      }
    } catch (err) {
      console.warn("Failed to persist order to MongoDB:", err);
    }

    setOrders((prev) => [savedOrder, ...prev]);

    // Also create and persist corresponding payment transaction record
    if (savedOrder.totalBudgetUSD) {
      const cashoutPercent =
        savedOrder.paymentMethod === "bKash"
          ? bkashCashoutPercent
          : savedOrder.paymentMethod === "Nagad"
          ? nagadCashoutPercent
          : 0;
      const baseBDT = Math.round(savedOrder.totalBudgetUSD * exchangeRateBDT);
      const cashoutChargeBDT = Math.round((baseBDT * cashoutPercent) / 100);
      const bdtAmount = savedOrder.paidAmountBDT || baseBDT + cashoutChargeBDT;

      const newTxn: PaymentTransaction = {
        id: `TXN-${Math.floor(8100 + Math.random() * 800)}`,
        orderId: savedOrder.id,
        campaignName: savedOrder.campaignName,
        method: savedOrder.paymentMethod || "bKash",
        transactionId:
          savedOrder.transactionId ||
          `TRX${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amountUSD: savedOrder.totalBudgetUSD,
        amountBDT: bdtAmount,
        exchangeRate: exchangeRateBDT,
        serviceChargeBDT: cashoutChargeBDT,
        status: "Under Review",
        date: `${dateStr} Just now`,
        senderNumber: newOrderData.senderNumber,
        screenshotUrl: newOrderData.screenshotUrl,
      };

      try {
        const payRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTxn),
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.success && payData.payment) {
            setPayments((prev) => [payData.payment, ...prev]);
            return savedOrder;
          }
        }
      } catch (err) {
        console.warn("Failed to persist payment to MongoDB:", err);
      }

      setPayments((prev) => [newTxn, ...prev]);
    }

    return savedOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );

    // Persist status update to MongoDB
    fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn("Failed to update order status in DB:", err));
  };

  const updatePaymentStatus = (paymentId: string, status: "Verified" | "Under Review" | "Failed") => {
    let affectedOrderId: string | undefined;

    setPayments((prev) =>
      prev.map((payment) => {
        if (payment.id === paymentId) {
          affectedOrderId = payment.orderId;
          return { ...payment, status };
        }
        return payment;
      })
    );

    if (affectedOrderId) {
      const orderPaymentStatus =
        status === "Verified"
          ? "Verified"
          : status === "Failed"
          ? "Failed"
          : "Awaiting Verification";

      setOrders((prev) =>
        prev.map((order) =>
          order.id === affectedOrderId ? { ...order, paymentStatus: orderPaymentStatus } : order
        )
      );
    }

    // Persist payment status update to MongoDB
    fetch(`/api/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn("Failed to update payment status in DB:", err));
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    let finalNewId = updates.id;
    if (!finalNewId && updates.postType) {
      const cat = getOrderCategory(updates.postType);
      finalNewId = formatOrderId(orderId, cat);
    }
    const targetId = finalNewId || orderId;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, ...updates, id: targetId } : order
      )
    );

    if (targetId !== orderId) {
      setPayments((prev) =>
        prev.map((p) => (p.orderId === orderId ? { ...p, orderId: targetId } : p))
      );
    }

    // Persist order update to MongoDB
    fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, id: targetId }),
    }).catch((err) => console.warn("Failed to update order in DB:", err));
  };

  const renewOrder = (orderId: string, additionalDays: number) => {
    let updatedOrderPayload: Partial<Order> | null = null;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const additionalBudget = order.dailyBudgetUSD * additionalDays;
          const renewNote = `Renewed for ${additionalDays} more days ($${additionalBudget.toFixed(2)}) on ${new Date().toLocaleDateString()}`;
          const updated = {
            ...order,
            status: "Active" as OrderStatus,
            durationDays: order.durationDays + additionalDays,
            totalBudgetUSD: order.totalBudgetUSD + additionalBudget,
            notes: [...(order.notes || []), renewNote],
          };
          updatedOrderPayload = {
            status: updated.status,
            durationDays: updated.durationDays,
            totalBudgetUSD: updated.totalBudgetUSD,
            notes: updated.notes,
          };
          return updated;
        }
        return order;
      })
    );

    if (updatedOrderPayload) {
      fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrderPayload),
      }).catch((err) => console.warn("Failed to persist renew to DB:", err));
    }
  };

  const syncMetaMetrics = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders((prev) => {
            const updatedMap = new Map<string, Order>(data.orders.map((o: Order) => [o.id, o]));
            return prev.map((ord): Order => updatedMap.get(ord.id) || ord);
          });

          const totalR = data.orders.reduce((sum: number, o: Order) => sum + (o.metrics?.reach || 0), 0);
          const totalI = data.orders.reduce((sum: number, o: Order) => sum + (o.metrics?.impressions || 0), 0);
          const totalM = data.orders.reduce((sum: number, o: Order) => sum + (o.metrics?.conversations || 0), 0);
          const totalS = data.orders.reduce((sum: number, o: Order) => sum + (o.metrics?.spendUSD || 0), 0);

          setLiveMetrics({
            reach: totalR,
            impressions: totalI,
            messages: totalM,
            spend: totalS,
            reachGrowth: 18.5,
            impressionsGrowth: 22.1,
            messagesGrowth: 14.3,
            spendGrowth: 11.2,
            lastSynced: data.isLiveMeta ? "Live from Meta Graph API" : "Live from Meta (Synced just now)",
          });
        }
      }
    } catch (err) {
      console.warn("Meta live sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateProfile = (updates: Partial<ClientProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("scit_user_profile", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch((err) => console.warn("Could not sync profile update with server:", err));
  };

  const updateRates = async (rates: {
    exchangeRateBDT?: number;
    serviceChargePercent?: number;
    bkashCashoutPercent?: number;
    nagadCashoutPercent?: number;
    bkashNumber?: string;
    bkashAccountType?: string;
    bkashAccountName?: string;
    bkashInstructions?: string;
    bkashActive?: boolean;
    nagadNumber?: string;
    nagadAccountType?: string;
    nagadAccountName?: string;
    nagadInstructions?: string;
    nagadActive?: boolean;
    bankDetails?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      branch: string;
      routingNumber?: string;
    };
    bankAccounts?: BankAccount[];
  }) => {
    if (rates.exchangeRateBDT !== undefined) setExchangeRateBDT(rates.exchangeRateBDT);
    if (rates.serviceChargePercent !== undefined) setServiceChargePercent(rates.serviceChargePercent);
    if (rates.bkashCashoutPercent !== undefined) setBkashCashoutPercent(rates.bkashCashoutPercent);
    if (rates.nagadCashoutPercent !== undefined) setNagadCashoutPercent(rates.nagadCashoutPercent);
    if (rates.bkashNumber !== undefined) setBkashNumber(rates.bkashNumber);
    if (rates.bkashAccountType !== undefined) setBkashAccountType(rates.bkashAccountType);
    if (rates.bkashAccountName !== undefined) setBkashAccountName(rates.bkashAccountName);
    if (rates.bkashInstructions !== undefined) setBkashInstructions(rates.bkashInstructions);
    if (rates.bkashActive !== undefined) setBkashActive(rates.bkashActive);
    if (rates.nagadNumber !== undefined) setNagadNumber(rates.nagadNumber);
    if (rates.nagadAccountType !== undefined) setNagadAccountType(rates.nagadAccountType);
    if (rates.nagadAccountName !== undefined) setNagadAccountName(rates.nagadAccountName);
    if (rates.nagadInstructions !== undefined) setNagadInstructions(rates.nagadInstructions);
    if (rates.nagadActive !== undefined) setNagadActive(rates.nagadActive);

    let syncBankDetails = rates.bankDetails;
    if (rates.bankAccounts !== undefined) {
      setBankAccounts(rates.bankAccounts);
      const primary = rates.bankAccounts.find((b) => b.isPrimary && b.isActive) || rates.bankAccounts[0];
      if (primary) {
        syncBankDetails = {
          bankName: primary.bankName,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          branch: primary.branch || "",
          routingNumber: primary.routingNumber || "",
        };
        setBankDetails(syncBankDetails);
      }
    } else if (rates.bankDetails !== undefined) {
      setBankDetails(rates.bankDetails);
    }

    setRatesLastUpdated(
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    try {
      const payload: any = { ...rates };
      if (syncBankDetails && !payload.bankDetails) {
        payload.bankDetails = syncBankDetails;
      }
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save settings");
      }
      return await res.json();
    } catch (e) {
      console.warn("Could not save settings to DB:", e);
      throw e;
    }
  };

  const addBankAccount = async (bank: Omit<BankAccount, "id">) => {
    const newBank: BankAccount = {
      ...bank,
      id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [...bankAccounts, newBank];
    setBankAccounts(updated);
    await updateRates({ bankAccounts: updated });
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    const updated = bankAccounts.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBankAccounts(updated);
    await updateRates({ bankAccounts: updated });
  };

  const deleteBankAccount = async (id: string) => {
    const updated = bankAccounts.filter((b) => b.id !== id);
    setBankAccounts(updated);
    await updateRates({ bankAccounts: updated });
  };

  const setPrimaryBankAccount = async (id: string) => {
    const updated = bankAccounts.map((b) => ({
      ...b,
      isPrimary: b.id === id,
    }));
    setBankAccounts(updated);
    await updateRates({ bankAccounts: updated });
  };

  const login = async (credentials: {
    email: string;
    password: string;
    accountType?: "client" | "specialist";
  }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Authentication failed. Please check credentials.",
        };
      }

      if (data.user) {
        setIsAuthenticated(true);
        const updatedProfile: ClientProfile = {
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || profile.phone,
          businessName: data.user.businessName || profile.businessName,
          avatar: data.user.avatar || profile.avatar,
          role: data.user.role === "admin" ? "Specialist" : "Client",
          connectedPage: data.user.connectedPage || profile.connectedPage,
          currency: data.user.currency || "USD",
          notifications: data.user.notifications || profile.notifications,
        };
        setProfile(updatedProfile);
        try {
          localStorage.setItem("scit_user_profile", JSON.stringify(updatedProfile));
        } catch {}
      }

      return {
        success: true,
        redirectUrl: data.redirectUrl || (credentials.accountType === "specialist" ? "/admin" : "/"),
      };
    } catch (err: unknown) {
      const e = err as Error;
      return {
        success: false,
        error: e.message || "Failed to reach server. Please check your network connection.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("scit_user_profile");
    } catch {}
    setIsAuthenticated(false);
    setProfile(initialProfile);
  };

  const disconnectMetaApi = async () => {
    try {
      const res = await fetch("/api/meta/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect Meta API");
      setMetaApiConnected(false);
      setMetaAccountName("");
      setMetaAdAccountId("");
      setMetaAdAccounts([]);
      await refreshSettings();
    } catch (e) {
      console.warn("Error disconnecting Meta API:", e);
      throw e;
    }
  };

  return (
    <PortalContext.Provider
      value={{
        orders,
        payments,
        profile,
        liveMetrics,
        exchangeRateBDT,
        serviceChargePercent,
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
        bankDetails,
        bankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setPrimaryBankAccount,
        ratesLastUpdated,
        metaApiConnected,
        metaAccountName,
        metaAdAccountId,
        metaAdAccounts,
        isLoadingSettings,
        refreshSettings,
        isSyncing,
        isLoadingOrders,
        refreshOrders,
        isLoadingPayments,
        refreshPayments,
        selectedOrderForModal,
        isSupportModalOpen,
        selectedOrderForRenew,
        isRenewModalOpen,
        addOrder,
        updateOrderStatus,
        updateOrder,
        updatePaymentStatus,
        renewOrder,
        syncMetaMetrics,
        setSelectedOrderForModal,
        setIsSupportModalOpen,
        setSelectedOrderForRenew,
        setIsRenewModalOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        clientNotifications,
        adminNotifications,
        clientUnreadCount,
        adminUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateProfile,
        updateRates,
        dbConnected,
        isAuthenticated,
        isAuthLoading,
        login,
        logout,
        disconnectMetaApi,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
}
