export type OrderStatus = "Pending" | "Confirmed" | "Active" | "Paused" | "Completed" | "Rejected";

export type PaymentStatus = "Verified" | "Awaiting Verification" | "Under Review" | "Unpaid" | "Refunded" | "Failed";

export type PaymentMethod = "bKash" | "Nagad" | "Bank Transfer";

export interface BoostItem {
  id: string;
  name: string;
  postUrl: string;
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  platform: "Facebook" | "Instagram" | "Both";
  dailyBudgetUSD: number;
  durationDays: number;
  totalBudgetUSD: number;
}

export interface Order {
  id: string; // e.g. "AD-1001"
  campaignName: string;
  postUrl: string;
  thumbnail: string;
  postType: "Boost Post" | "Ads Campaign" | "Promotion";
  platform: "Facebook" | "Instagram" | "Both";
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  dailyBudgetUSD: number;
  totalBudgetUSD: number;
  durationDays: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  paidAmountBDT?: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  items?: BoostItem[];
  metrics?: {
    reach: number;
    impressions: number;
    conversations: number;
    spendUSD: number;
    ctr: number;
    cpm: number;
    lastUpdated: string;
  };
  notes?: string[];
  isEligibleForRenew?: boolean;
}

export interface PaymentTransaction {
  id: string; // e.g. "TXN-8091"
  orderId: string;
  campaignName: string;
  method: PaymentMethod;
  transactionId: string;
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  serviceChargeBDT: number;
  status: "Verified" | "Under Review" | "Failed";
  date: string;
  screenshotUrl?: string;
  senderNumber?: string;
}

export interface ClientProfile {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  avatar: string;
  role: string;
  connectedPage: {
    name: string;
    id: string;
    followers: string;
    category: string;
    verified: boolean;
  };
  currency: "USD" | "BDT";
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

export interface LivePerformanceMetrics {
  reach: number;
  impressions: number;
  messages: number;
  spend: number;
  reachGrowth: number;
  impressionsGrowth: number;
  messagesGrowth: number;
  spendGrowth: number;
  lastSynced: string;
}
