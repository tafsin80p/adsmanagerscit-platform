export type OrderStatus = "Pending" | "Confirmed" | "Active" | "Paused" | "Completed" | "Rejected";

export type PaymentStatus = "Verified" | "Awaiting Verification" | "Under Review" | "Unpaid" | "Refunded" | "Failed";

export type PaymentMethod = "bKash" | "Nagad" | "Bank Transfer" | "Meta Ad Account" | "Facebook Card";

export interface BoostItem {
  id: string;
  name: string;
  postUrl: string;
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  platform: "Facebook";
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
  connectedPage: {
    name: string;
    id: string;
    followers: string;
    category: string;
    verified: boolean;
    avatar?: string;
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

export interface ClientAccount {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  avatar?: string;
  role: "client" | "admin";
  connectedPage: {
    name: string;
    id?: string;
    followers: string;
    category: string;
    verified: boolean;
    avatar?: string;
  };
  currency?: "USD" | "BDT";
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

