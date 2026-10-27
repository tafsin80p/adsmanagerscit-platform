import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMetaAdAccount {
  id: string;
  name: string;
  currency: string;
  accountStatus: string;
  totalSpent?: string;
  balance?: string;
  spendCap?: string;
  timezone?: string;
}

export interface IBankAccount {
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

export interface ISetting extends Document {
  key: string;
  exchangeRateBDT: number;
  serviceChargePercent: number;
  bkashCashoutPercent: number;
  nagadCashoutPercent: number;
  bkashNumber: string;
  bkashAccountType?: string;
  bkashAccountName?: string;
  bkashInstructions?: string;
  bkashActive?: boolean;
  nagadNumber: string;
  nagadAccountType?: string;
  nagadAccountName?: string;
  nagadInstructions?: string;
  nagadActive?: boolean;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber?: string;
  };
  bankAccounts?: IBankAccount[];
  metaAdAccountId?: string;
  metaAccessToken?: string;
  metaAppId?: string;
  metaPageId?: string;
  metaAccountName?: string;
  metaApiConnected?: boolean;
  metaAdAccounts?: IMetaAdAccount[];
  lastUpdated: Date;
}

const MetaAdAccountSchema = new Schema<IMetaAdAccount>(
  {
    id: { type: String, required: true },
    name: { type: String, default: "Ad Account" },
    currency: { type: String, default: "USD" },
    accountStatus: { type: String, default: "ACTIVE" },
    totalSpent: { type: String, default: "0.00" },
    balance: { type: String, default: "0.00" },
    spendCap: { type: String, default: "Unlimited" },
    timezone: { type: String, default: "Asia/Dhaka" },
  },
  { _id: false, strict: false }
);

const BankAccountSchema = new Schema<IBankAccount>(
  {
    id: { type: String, required: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    branch: { type: String, default: "" },
    routingNumber: { type: String, default: "" },
    swiftCode: { type: String, default: "" },
    tag: { type: String, default: "" },
    instructions: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false, strict: false }
);

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, default: "global_settings" },
    exchangeRateBDT: { type: Number, default: 131.25 },
    serviceChargePercent: { type: Number, default: 5 },
    bkashCashoutPercent: { type: Number, default: 1.85 },
    nagadCashoutPercent: { type: Number, default: 1.49 },
    bkashNumber: { type: String, default: "01700000000" },
    bkashAccountType: { type: String, default: "Personal (Send Money)" },
    bkashAccountName: { type: String, default: "Shopno IT / Meta Ads Agency" },
    bkashInstructions: { type: String, default: "Send money via bKash App or USSD *247#, then paste the TrxID below." },
    bkashActive: { type: Boolean, default: true },
    nagadNumber: { type: String, default: "01800000000" },
    nagadAccountType: { type: String, default: "Personal (Send Money)" },
    nagadAccountName: { type: String, default: "Shopno IT / Meta Ads Agency" },
    nagadInstructions: { type: String, default: "Send money via Nagad App or USSD *167#, then paste the TrxID below." },
    nagadActive: { type: Boolean, default: true },
    bankDetails: {
      bankName: { type: String, default: "City Bank PLC" },
      accountName: { type: String, default: "Meta Ads Agency Ltd" },
      accountNumber: { type: String, default: "1102938475001" },
      branch: { type: String, default: "Gulshan Branch, Dhaka" },
      routingNumber: { type: String, default: "225272341" },
    },
    bankAccounts: { type: [BankAccountSchema], default: [] },
    metaAdAccountId: { type: String, default: "" },
    metaAccessToken: { type: String, default: "" },
    metaAppId: { type: String, default: "" },
    metaPageId: { type: String, default: "" },
    metaAccountName: { type: String, default: "" },
    metaApiConnected: { type: Boolean, default: false },
    metaAdAccounts: [MetaAdAccountSchema],
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: false,
  }
);

if (mongoose.models && mongoose.models.Setting) {
  delete mongoose.models.Setting;
}

export const SettingModel: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);

export default SettingModel;
