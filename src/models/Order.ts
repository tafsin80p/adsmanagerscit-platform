import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBoostItem {
  id: string;
  name: string;
  postUrl: string;
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  platform: "Facebook";
  dailyBudgetUSD: number;
  durationDays: number;
  totalBudgetUSD: number;
}

export interface IMetrics {
  reach: number;
  impressions: number;
  conversations: number;
  spendUSD: number;
  ctr: number;
  cpm: number;
  lastUpdated: string;
}

export interface IOrder extends Document {
  id: string;
  campaignName: string;
  postUrl: string;
  thumbnail: string;
  postType: "Boost Post" | "Ads Campaign" | "Promotion" | "Boost" | "Ads" | "Promote";
  platform: "Facebook";
  objective: "Messages" | "Engagement" | "Traffic" | "Leads";
  dailyBudgetUSD: number;
  totalBudgetUSD: number;
  durationDays: number;
  status: "Pending" | "Confirmed" | "Active" | "Paused" | "Completed" | "Rejected";
  paymentStatus: "Verified" | "Awaiting Verification" | "Under Review" | "Unpaid" | "Refunded" | "Failed";
  paymentMethod?: "bKash" | "Nagad" | "Bank Transfer";
  transactionId?: string;
  paidAmountBDT?: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  items?: IBoostItem[];
  metrics?: IMetrics;
  clientEmail?: string;
  clientName?: string;
  businessName?: string;
  facebookPageName?: string;
  facebookPageId?: string;
  metaAdAccountId?: string;
  metaAccountName?: string;
  metaCampaignId?: string;
  metaAdId?: string;
  notes?: string[];
  isEligibleForRenew?: boolean;
  screenshotUrl?: string;
  source?: "portal_order" | "facebook_page_boost";
  isExternalBoost?: boolean;
}

const BoostItemSchema = new Schema<IBoostItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    postUrl: { type: String, default: "" },
    objective: { type: String, enum: ["Messages", "Engagement", "Traffic", "Leads"], default: "Messages" },
    platform: { type: String, default: "Facebook" },
    dailyBudgetUSD: { type: Number, default: 0 },
    durationDays: { type: Number, default: 1 },
    totalBudgetUSD: { type: Number, default: 0 },
  },
  { _id: false }
);

const MetricsSchema = new Schema<IMetrics>(
  {
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    conversations: { type: Number, default: 0 },
    spendUSD: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    lastUpdated: { type: String, default: "Just now" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    id: { type: String, required: true, unique: true, index: true },
    campaignName: { type: String, required: true },
    postUrl: { type: String, default: "" },
    thumbnail: { type: String, default: "/images/placeholder.jpg" },
    postType: {
      type: String,
      enum: ["Boost Post", "Ads Campaign", "Promotion", "Boost", "Ads", "Promote"],
      default: "Boost Post",
    },
    platform: { type: String, default: "Facebook" },
    objective: {
      type: String,
      enum: ["Messages", "Engagement", "Traffic", "Leads"],
      default: "Messages",
    },
    dailyBudgetUSD: { type: Number, required: true, default: 0 },
    totalBudgetUSD: { type: Number, required: true, default: 0 },
    durationDays: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Active", "Paused", "Completed", "Rejected"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Verified", "Awaiting Verification", "Under Review", "Unpaid", "Refunded", "Failed"],
      default: "Unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["bKash", "Nagad", "Bank Transfer"],
    },
    transactionId: { type: String },
    paidAmountBDT: { type: Number, default: 0 },
    createdAt: { type: String, default: () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
    startDate: { type: String },
    endDate: { type: String },
    items: [BoostItemSchema],
    metrics: MetricsSchema,
    clientEmail: { type: String, default: "" },
    clientName: { type: String, default: "" },
    businessName: { type: String, default: "" },
    facebookPageName: { type: String, default: "" },
    facebookPageId: { type: String, default: "" },
    metaAdAccountId: { type: String, default: "" },
    metaAccountName: { type: String, default: "" },
    metaCampaignId: { type: String, default: "" },
    metaAdId: { type: String, default: "" },
    notes: [{ type: String }],
    isEligibleForRenew: { type: Boolean, default: false },
    screenshotUrl: { type: String },
    source: {
      type: String,
      enum: ["portal_order", "facebook_page_boost"],
      default: "portal_order",
    },
    isExternalBoost: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default OrderModel;
