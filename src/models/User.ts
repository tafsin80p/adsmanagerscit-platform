import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone: string;
  businessName: string;
  avatar: string;
  role: "client" | "admin";
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
  createdAt: Date;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (!storedHash.includes(":")) {
    // Direct match support if seeded as plain text
    return password === storedHash;
  }
  const [salt, key] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === key;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    businessName: { type: String, default: "" },
    avatar: { type: String, default: "/images/avatar.jpg" },
    role: { type: String, enum: ["client", "admin"], default: "client" },
    connectedPage: {
      name: { type: String, default: "MIN Mart BD" },
      id: { type: String, default: "110132735345674" },
      followers: { type: String, default: "12.8K followers" },
      category: { type: String, default: "Shopping & Retail" },
      verified: { type: Boolean, default: true },
      avatar: { type: String, default: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527" },
    },
    currency: { type: String, enum: ["USD", "BDT"], default: "USD" },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
