"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Order,
  PaymentTransaction,
  ClientProfile,
  LivePerformanceMetrics,
  OrderStatus,
} from "@/types";

interface PortalContextType {
  orders: Order[];
  payments: PaymentTransaction[];
  profile: ClientProfile;
  liveMetrics: LivePerformanceMetrics;
  exchangeRateBDT: number;
  serviceChargePercent: number;
  isSyncing: boolean;
  selectedOrderForModal: Order | null;
  isSupportModalOpen: boolean;
  selectedOrderForRenew: Order | null;
  isRenewModalOpen: boolean;
  addOrder: (order: Omit<Order, "id" | "createdAt" | "status"> & { id?: string }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  renewOrder: (orderId: string, additionalDays: number) => void;
  syncMetaMetrics: () => Promise<void>;
  setSelectedOrderForModal: (order: Order | null) => void;
  setIsSupportModalOpen: (open: boolean) => void;
  setSelectedOrderForRenew: (order: Order | null) => void;
  setIsRenewModalOpen: (open: boolean) => void;
  updateProfile: (profile: Partial<ClientProfile>) => void;
}

const initialOrders: Order[] = [
  {
    id: "AD-1001",
    campaignName: "Winter Collection",
    postUrl: "https://facebook.com/fashionhubbd/posts/109283719",
    thumbnail: "/images/winter-collection.jpg",
    postType: "Boost Post",
    platform: "Facebook",
    objective: "Messages",
    dailyBudgetUSD: 5.0,
    totalBudgetUSD: 5.0,
    durationDays: 1,
    status: "Active",
    paymentStatus: "Verified",
    paymentMethod: "bKash",
    transactionId: "BK92X1001",
    paidAmountBDT: 656,
    createdAt: "Oct 16, 2025",
    startDate: "Oct 16, 2025",
    endDate: "Oct 17, 2025",
    metrics: {
      reach: 4200,
      impressions: 6800,
      conversations: 32,
      spendUSD: 5.0,
      ctr: 2.4,
      cpm: 0.73,
      lastUpdated: "1 hour ago",
    },
    notes: [
      "Ad creative approved by Meta Ad Specialist.",
      "Optimizing for direct WhatsApp & Messenger conversations.",
    ],
    isEligibleForRenew: true,
  },
  {
    id: "AD-1002",
    campaignName: "Summer Sale",
    postUrl: "https://facebook.com/fashionhubbd/posts/108371940",
    thumbnail: "/images/summer-sale.jpg",
    postType: "Boost Post",
    platform: "Facebook",
    objective: "Traffic",
    dailyBudgetUSD: 10.0,
    totalBudgetUSD: 10.0,
    durationDays: 1,
    status: "Active",
    paymentStatus: "Verified",
    paymentMethod: "Nagad",
    transactionId: "NG78M2002",
    paidAmountBDT: 1312,
    createdAt: "Oct 12, 2025",
    startDate: "Oct 12, 2025",
    endDate: "Oct 13, 2025",
    metrics: {
      reach: 8200,
      impressions: 11800,
      conversations: 54,
      spendUSD: 10.0,
      ctr: 3.1,
      cpm: 0.85,
      lastUpdated: "1 hour ago",
    },
    notes: ["Targeting Dhaka, Chittagong, and Sylhet metropolitan areas."],
    isEligibleForRenew: true,
  },
  {
    id: "AD-1003",
    campaignName: "New Arrival",
    postUrl: "https://facebook.com/fashionhubbd/posts/107294821",
    thumbnail: "/images/new-arrival.jpg",
    postType: "Boost Post",
    platform: "Facebook",
    objective: "Engagement",
    dailyBudgetUSD: 4.0,
    totalBudgetUSD: 4.0,
    durationDays: 1,
    status: "Paused",
    paymentStatus: "Verified",
    paymentMethod: "bKash",
    transactionId: "BK44P3003",
    paidAmountBDT: 525,
    createdAt: "Oct 10, 2025",
    startDate: "Oct 10, 2025",
    endDate: "Oct 11, 2025",
    metrics: {
      reach: 3100,
      impressions: 4500,
      conversations: 18,
      spendUSD: 3.5,
      ctr: 1.9,
      cpm: 0.77,
      lastUpdated: "2 days ago",
    },
    notes: ["Paused upon client request for creative update."],
    isEligibleForRenew: true,
  },
  {
    id: "AD-1004",
    campaignName: "Flash Sale",
    postUrl: "https://facebook.com/fashionhubbd/posts/106392019",
    thumbnail: "/images/flash-sale.jpg",
    postType: "Promotion",
    platform: "Facebook",
    objective: "Messages",
    dailyBudgetUSD: 7.0,
    totalBudgetUSD: 7.0,
    durationDays: 1,
    status: "Completed",
    paymentStatus: "Verified",
    paymentMethod: "Bank Transfer",
    transactionId: "BRAC994004",
    paidAmountBDT: 918,
    createdAt: "Oct 08, 2025",
    startDate: "Oct 08, 2025",
    endDate: "Oct 09, 2025",
    metrics: {
      reach: 14800,
      impressions: 21200,
      conversations: 92,
      spendUSD: 7.0,
      ctr: 2.8,
      cpm: 0.33,
      lastUpdated: "Oct 09, 2025",
    },
    notes: ["Goal achieved. 92 high-intent client messages generated."],
    isEligibleForRenew: true,
  },
  {
    id: "AD-1005",
    campaignName: "Festive Puja Exclusive",
    postUrl: "https://facebook.com/fashionhubbd/posts/105581903",
    thumbnail: "/images/winter-collection.jpg",
    postType: "Ads Campaign",
    platform: "Facebook",
    objective: "Leads",
    dailyBudgetUSD: 15.0,
    totalBudgetUSD: 30.0,
    durationDays: 2,
    status: "Pending",
    paymentStatus: "Awaiting Verification",
    paymentMethod: "bKash",
    transactionId: "BK99P8088",
    paidAmountBDT: 3937,
    createdAt: "Oct 17, 2025",
    notes: ["Payment screenshot submitted. Our billing team is verifying the TRX."],
    isEligibleForRenew: false,
  },
  {
    id: "AD-1006",
    campaignName: "End of Season Clearance",
    postUrl: "https://facebook.com/fashionhubbd/posts/104392001",
    thumbnail: "/images/summer-sale.jpg",
    postType: "Boost Post",
    platform: "Facebook",
    objective: "Traffic",
    dailyBudgetUSD: 12.0,
    totalBudgetUSD: 36.0,
    durationDays: 3,
    status: "Completed",
    paymentStatus: "Verified",
    paymentMethod: "Nagad",
    transactionId: "NG55T1006",
    paidAmountBDT: 4725,
    createdAt: "Oct 01, 2025",
    metrics: {
      reach: 22400,
      impressions: 34100,
      conversations: 140,
      spendUSD: 36.0,
      ctr: 3.4,
      cpm: 1.05,
      lastUpdated: "Oct 04, 2025",
    },
    isEligibleForRenew: true,
  },
];

const initialPayments: PaymentTransaction[] = [
  {
    id: "TXN-8091",
    orderId: "AD-1005",
    campaignName: "Festive Puja Exclusive",
    method: "bKash",
    transactionId: "BK99P8088",
    amountUSD: 30.0,
    amountBDT: 3937,
    exchangeRate: 125,
    serviceChargeBDT: 187,
    status: "Under Review",
    date: "Oct 17, 2025 11:20 AM",
    senderNumber: "01712-889900",
  },
  {
    id: "TXN-8090",
    orderId: "AD-1001",
    campaignName: "Winter Collection",
    method: "bKash",
    transactionId: "BK92X1001",
    amountUSD: 5.0,
    amountBDT: 656,
    exchangeRate: 125,
    serviceChargeBDT: 31,
    status: "Verified",
    date: "Oct 16, 2025 04:15 PM",
    senderNumber: "01712-889900",
  },
  {
    id: "TXN-8089",
    orderId: "AD-1002",
    campaignName: "Summer Sale",
    method: "Nagad",
    transactionId: "NG78M2002",
    amountUSD: 10.0,
    amountBDT: 1312,
    exchangeRate: 125,
    serviceChargeBDT: 62,
    status: "Verified",
    date: "Oct 12, 2025 02:40 PM",
    senderNumber: "01823-456789",
  },
  {
    id: "TXN-8088",
    orderId: "AD-1003",
    campaignName: "New Arrival",
    method: "bKash",
    transactionId: "BK44P3003",
    amountUSD: 4.0,
    amountBDT: 525,
    exchangeRate: 125,
    serviceChargeBDT: 25,
    status: "Verified",
    date: "Oct 10, 2025 09:12 AM",
    senderNumber: "01712-889900",
  },
  {
    id: "TXN-8087",
    orderId: "AD-1004",
    campaignName: "Flash Sale",
    method: "Bank Transfer",
    transactionId: "BRAC994004",
    amountUSD: 7.0,
    amountBDT: 918,
    exchangeRate: 125,
    serviceChargeBDT: 43,
    status: "Verified",
    date: "Oct 08, 2025 03:00 PM",
  },
  {
    id: "TXN-8086",
    orderId: "AD-1006",
    campaignName: "End of Season Clearance",
    method: "Nagad",
    transactionId: "NG55T1006",
    amountUSD: 36.0,
    amountBDT: 4725,
    exchangeRate: 125,
    serviceChargeBDT: 225,
    status: "Verified",
    date: "Oct 01, 2025 10:45 AM",
    senderNumber: "01823-456789",
  },
];

const initialProfile: ClientProfile = {
  name: "Tafsin Ahmed",
  email: "tafsin@fashionhubbd.com",
  phone: "+880 1712-889900",
  businessName: "Fashion Hub BD",
  avatar: "/images/avatar.jpg",
  role: "Client",
  connectedPage: {
    name: "Fashion Hub Bangladesh",
    id: "FB-PAGE-9023184",
    followers: "42.8K followers",
    category: "Apparel & Clothing Store",
    verified: true,
  },
  currency: "USD",
  notifications: {
    email: true,
    sms: true,
    whatsapp: true,
  },
};

const initialLiveMetrics: LivePerformanceMetrics = {
  reach: 12400,
  impressions: 18600,
  messages: 86,
  spend: 18.5,
  reachGrowth: 18,
  impressionsGrowth: 22,
  messagesGrowth: 16,
  spendGrowth: 12,
  lastSynced: "Updated 1 hour ago",
};

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [payments, setPayments] = useState<PaymentTransaction[]>(initialPayments);
  const [profile, setProfile] = useState<ClientProfile>(initialProfile);
  const [liveMetrics, setLiveMetrics] = useState<LivePerformanceMetrics>(initialLiveMetrics);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedOrderForRenew, setSelectedOrderForRenew] = useState<Order | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Exchange and pricing config
  const exchangeRateBDT = 125;
  const serviceChargePercent = 5;

  const addOrder = (newOrderData: Omit<Order, "id" | "createdAt" | "status"> & { id?: string }): Order => {
    const nextNum = 1000 + orders.length + 1;
    const orderId = newOrderData.id || `AD-${nextNum}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

    const newOrder: Order = {
      ...newOrderData,
      id: orderId,
      createdAt: dateStr,
      status: "Pending",
      paymentStatus: newOrderData.paymentStatus || "Awaiting Verification",
      thumbnail: newOrderData.thumbnail || "/images/winter-collection.jpg",
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Also create corresponding payment transaction record
    if (newOrder.totalBudgetUSD) {
      const bdtAmount = Math.round(newOrder.totalBudgetUSD * exchangeRateBDT * (1 + serviceChargePercent / 100));
      const newTxn: PaymentTransaction = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: newOrder.id,
        campaignName: newOrder.campaignName,
        method: newOrder.paymentMethod || "bKash",
        transactionId: newOrder.transactionId || `TRX${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amountUSD: newOrder.totalBudgetUSD,
        amountBDT: bdtAmount,
        exchangeRate: exchangeRateBDT,
        serviceChargeBDT: Math.round((newOrder.totalBudgetUSD * exchangeRateBDT * serviceChargePercent) / 100),
        status: "Under Review",
        date: `${dateStr} Just now`,
      };
      setPayments((prev) => [newTxn, ...prev]);
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const renewOrder = (orderId: string, additionalDays: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const additionalBudget = order.dailyBudgetUSD * additionalDays;
          return {
            ...order,
            status: "Active",
            durationDays: order.durationDays + additionalDays,
            totalBudgetUSD: order.totalBudgetUSD + additionalBudget,
            notes: [
              ...(order.notes || []),
              `Renewed for ${additionalDays} more days ($${additionalBudget.toFixed(2)}) on ${new Date().toLocaleDateString()}`,
            ],
          };
        }
        return order;
      })
    );
  };

  const syncMetaMetrics = async () => {
    setIsSyncing(true);
    // Simulate real Meta Marketing API live sync
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLiveMetrics((prev) => ({
      ...prev,
      reach: prev.reach + Math.floor(Math.random() * 120) + 40,
      impressions: prev.impressions + Math.floor(Math.random() * 200) + 70,
      messages: prev.messages + Math.floor(Math.random() * 3),
      spend: parseFloat((prev.spend + 0.5).toFixed(2)),
      lastSynced: "Updated just now",
    }));
    setIsSyncing(false);
  };

  const updateProfile = (updates: Partial<ClientProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
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
        isSyncing,
        selectedOrderForModal,
        isSupportModalOpen,
        selectedOrderForRenew,
        isRenewModalOpen,
        addOrder,
        updateOrderStatus,
        renewOrder,
        syncMetaMetrics,
        setSelectedOrderForModal,
        setIsSupportModalOpen,
        setSelectedOrderForRenew,
        setIsRenewModalOpen,
        updateProfile,
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
