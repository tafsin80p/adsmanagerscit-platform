import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  id: string;
  orderId: string;
  campaignName: string;
  method: "bKash" | "Nagad" | "Bank Transfer";
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

const PaymentSchema = new Schema<IPayment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    campaignName: { type: String, required: true },
    method: {
      type: String,
      enum: ["bKash", "Nagad", "Bank Transfer"],
      required: true,
    },
    transactionId: { type: String, required: true },
    amountUSD: { type: Number, required: true },
    amountBDT: { type: Number, required: true },
    exchangeRate: { type: Number, required: true },
    serviceChargeBDT: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Verified", "Under Review", "Failed"],
      default: "Under Review",
    },
    date: { type: String, default: () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
    screenshotUrl: { type: String },
    senderNumber: { type: String },
  },
  {
    timestamps: true,
  }
);

export const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default PaymentModel;
