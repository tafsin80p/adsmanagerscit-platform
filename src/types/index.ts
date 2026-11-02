export type OrderStatus = "Pending" | "Confirmed" | "Active" | "Paused" | "Completed" | "Rejected";

export type PaymentStatus = "Verified" | "Awaiting Verification" | "Under Review" | "Unpaid" | "Refunded" | "Failed";

export type PaymentMethod = "bKash" | "Nagad" | "Bank Transfer" | "Meta Ad Account" | "Facebook Card";

export interface BoostItem {
  id: string;
  name: string;
  postUrl: string;
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  platform: "Facebook";
  budgetType?: "daily" | "total";
  dailyBudgetUSD: number;
  durationDays: number;
  totalBudgetUSD: number;
}

export type CampaignCategory = "Boost" | "Ads" | "Promote";

export function getOrderCategory(postType?: string): CampaignCategory {
  if (!postType) return "Boost";
  const lower = postType.toLowerCase();
  if (lower.includes("ads") || lower.includes("campaign")) return "Ads";
  if (lower.includes("promot")) return "Promote";
  return "Boost";
}

export function getCategoryDisplayName(cat: CampaignCategory): string {
  switch (cat) {
    case "Boost":
      return "Ads Boost";
    case "Ads":
      return "Ads Campaign";
    case "Promote":
      return "Promote";
  }
}

export function getCategoryMetaTitle(cat: CampaignCategory): string {
  switch (cat) {
    case "Boost":
      return "Meta Ads Boost";
    case "Ads":
      return "Meta Ads Campaign";
    case "Promote":
      return "Page Promotion";
  }
}

export function getOrderPrefix(cat: CampaignCategory): string {
  switch (cat) {
    case "Boost":
      return "BOOST";
    case "Ads":
      return "AD";
    case "Promote":
      return "PROMOTE";
  }
}

export function formatOrderId(id: string, cat: CampaignCategory): string {
  const numMatch = id.match(/\d+/);
  const num = numMatch ? numMatch[0] : "1001";
  const prefix = getOrderPrefix(cat);
  return `${prefix}-${num}`;
}

export function generateMetaPrompt(order: Order, exchangeRateBDT: number = 131.25): string {
  const cat = getOrderCategory(order.postType);
  const bdtBudget = order.paidAmountBDT || Math.round(order.totalBudgetUSD * exchangeRateBDT);

  if (cat === "Boost") {
    return `🎯 [META ADS BOOST PROMPT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Order ID: #${order.id}
• Category: Ads Boost (Facebook Post Boost)
• Campaign Name: ${order.campaignName}
• Post URL: ${order.postUrl || "Facebook Feed Creative"}
• Objective: ${order.objective} (Direct WhatsApp & Messenger Engagement)
• Budget: $${order.dailyBudgetUSD.toFixed(2)}/day × ${order.durationDays} Days = $${order.totalBudgetUSD.toFixed(2)} USD (৳${bdtBudget.toLocaleString()} BDT)
• Target Audience: Bangladesh (Dhaka, Chittagong, Sylhet), Age 18–45
• Placements: Facebook Feed, Video Feeds, Stories & Reels
• Call To Action: Send Message (WhatsApp / Messenger)
• Payment Status: ${order.paymentStatus} via ${order.paymentMethod || "bKash"} (TRX: ${order.transactionId || "N/A"})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Launch Instructions:
1. Navigate to Facebook Page Ad Center.
2. Select the targeted post using the Post URL.
3. Configure the daily budget of $${order.dailyBudgetUSD.toFixed(2)} for ${order.durationDays} days.
4. Set messaging prompt to direct customer inquiries.`;
  } else if (cat === "Ads") {
    return `🎯 [META ADS CAMPAIGN PROMPT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Order ID: #${order.id}
• Category: Ads Campaign (Meta Ads Manager Campaign)
• Campaign Name: ${order.campaignName}
• Objective: ${order.objective} (Conversions, Traffic & Lead Generation)
• Duration: ${order.durationDays} Days ($${order.dailyBudgetUSD.toFixed(2)} USD / Day)
• Total Budget: $${order.totalBudgetUSD.toFixed(2)} USD (৳${bdtBudget.toLocaleString()} BDT)
• Creative Link: ${order.postUrl || "Ad Creative / Landing Page"}
• Placements: Advantage+ Placements (FB Feed, IG Feed, Audience Network, Reels)
• Optimization Goal: High-intent conversions and qualified leads
• Payment Status: ${order.paymentStatus} via ${order.paymentMethod || "bKash"} (TRX: ${order.transactionId || "N/A"})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Launch Instructions:
1. Open Meta Ads Manager -> Create New Campaign.
2. Select Objective: '${order.objective}' with Advantage Campaign Budget.
3. Configure target audience demographics & interest-based targeting.
4. Insert verified creative assets and publish ad sets.`;
  } else {
    return `🎯 [META PAGE PROMOTE PROMPT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Order ID: #${order.id}
• Category: Promote (Official Page Growth & Followers)
• Campaign Name: ${order.campaignName}
• Page URL: ${order.postUrl || "Facebook Official Business Page"}
• Primary Objective: Page Likes, Genuine Followers & Brand Awareness
• Duration: ${order.durationDays} Days ($${order.dailyBudgetUSD.toFixed(2)} USD / Day)
• Total Budget: $${order.totalBudgetUSD.toFixed(2)} USD (৳${bdtBudget.toLocaleString()} BDT)
• Audience: Bangladesh Nationwide, Interest: Online Shopping & Fashion
• Placements: Facebook Feed Follow Suggestion & Right Column
• Payment Status: ${order.paymentStatus} via ${order.paymentMethod || "bKash"} (TRX: ${order.transactionId || "N/A"})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Launch Instructions:
1. Open Meta Business Manager -> Promote Page.
2. Select Page Promotion goal to target high-affinity potential followers.
3. Schedule for ${order.durationDays} days and launch campaign.`;
  }
}

export interface Order {
  id: string; // e.g. "AD-1001"
  campaignName: string;
  postUrl: string;
  thumbnail: string;
  postType: "Boost Post" | "Ads Campaign" | "Promotion" | "Boost" | "Ads" | "Promote";
  platform: "Facebook";
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  dailyBudgetUSD: number;
  totalBudgetUSD: number;
  durationDays: number;
  budgetType?: "daily" | "total";
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
  clientEmail?: string;
  clientName?: string;
  businessName?: string;
  facebookPageName?: string;
  facebookPageId?: string;
  metaAdAccountId?: string;
  metaAccountName?: string;
  metaCampaignId?: string;
  metaAdId?: string;
  isEligibleForRenew?: boolean;
  screenshotUrl?: string;
  source?: "portal_order" | "facebook_page_boost";
  isExternalBoost?: boolean;
  addedBy?: OrderAuditUser;
  confirmedBy?: OrderAuditUser;
  shift?: ShiftType | string;
}

export type ShiftType = "Day Shift" | "Night Shift";

export const SHIFT_SCHEDULE = {
  day: {
    name: "Day Shift" as const,
    start: "10:00 AM",
    end: "08:00 PM",
    label: "☀️ Day Shift (10:00 AM - 08:00 PM BST)",
    shortLabel: "10 AM - 08 PM",
  },
  night: {
    name: "Night Shift" as const,
    start: "07:00 PM",
    end: "02:30 AM",
    label: "🌙 Night Shift (07:00 PM - 02:30 AM BST)",
    shortLabel: "07 PM - 02:30 AM",
  },
  rotational: {
    name: "Rotational" as const,
    label: "🔄 Rotational Shift (রোটেশনাল / উভয় শিফটে শিফটিং)",
    shortLabel: "Rotational",
  },
} as const;

export interface OrderAuditUser {
  name: string;
  email: string;
  role: string;
  shift?: ShiftType | string;
  avatar?: string;
  at?: string;
  confirmedAt?: string;
}

/**
 * Calculates current working shift according to platform schedule:
 * - Day Shift: 10:00 AM to 08:00 PM
 * - Night Shift: 07:00 PM to 02:30 AM
 */
export function getCurrentShift(date?: Date): ShiftType {
  const d = date ?? new Date();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Night shift active from 19:00 (7:00 PM = 1140 mins) through midnight until 02:30 AM (150 mins)
  if (timeInMinutes >= 19 * 60 || timeInMinutes <= 2 * 60 + 30) {
    return "Night Shift";
  }

  // Day shift active from 10:00 AM (600 mins) to 07:00 PM (1140 mins)
  if (timeInMinutes >= 10 * 60 && timeInMinutes < 19 * 60) {
    return "Day Shift";
  }

  // Early morning buffer (02:31 AM - 09:59 AM):
  // Before 06:00 AM counts as late night wrap-up; from 06:00 AM onward leads into day shift
  return timeInMinutes < 6 * 60 ? "Night Shift" : "Day Shift";
}

export interface MetaAdAccount {
  id: string; // e.g. "act_1029384756"
  name: string;
  currency: string;
  accountStatus: string;
  totalSpent?: string;
  timezone?: string;
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
  assignedShift?: ShiftType | "Rotational";
  connectedPage: {
    name: string;
    id: string;
    followers: string;
    category: string;
    verified: boolean;
    avatar?: string;
  };
  currency: "USD" | "BDT";
  dollarRate?: number;
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

export interface ClientAccount {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  avatar?: string;
  role: "client" | "admin" | "representative" | "manager";
  assignedShift?: "Day Shift" | "Night Shift" | "Rotational";
  connectedPage: {
    name: string;
    id?: string;
    followers: string;
    category: string;
    verified: boolean;
    avatar?: string;
  };
  currency?: "USD" | "BDT";
  dollarRate?: number;
  createdAt?: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  accountStatus: string;
  totalSpent?: string;
  balance?: string;
  spendCap?: string;
  timezone?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber?: string;
  swiftCode?: string;
  tag?: string;
  instructions?: string;
  isActive: boolean;
  isPrimary?: boolean;
  logoUrl?: string;
}

export interface NotificationItem {
  id: string;
  type: "bkash" | "citybank" | "nagad" | "brac" | "dbbl" | "meta" | "whatsapp" | "tip" | "system";
  category: "payment" | "boost" | "insight" | "account";
  title: string;
  description: string;
  time: string;
  orderId?: string;
  trxId?: string;
  amountBDT?: number;
  amountUSD?: number;
  statusBadge?: {
    text: string;
    bg: string;
    textColor: string;
  };
  isRead: boolean;
  link?: string;
}

