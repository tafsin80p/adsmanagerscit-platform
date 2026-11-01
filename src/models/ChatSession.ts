import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatSessionClient {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  avatar?: string;
}

export interface IChatSessionAgent {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface IChatSessionLastMessage {
  text: string;
  sender: "client" | "agent" | "system";
  senderName: string;
  createdAt: Date;
}

export interface IChatSession extends Document {
  sessionId: string;
  client: IChatSessionClient;
  status: "open" | "closed";
  assignedAgent?: IChatSessionAgent;
  participatingAgents: Array<{
    id?: string;
    name: string;
    email?: string;
    avatar?: string;
    lastActive: Date;
  }>;
  lastMessage?: IChatSessionLastMessage;
  unreadCountClient: number;
  unreadCountAdmin: number;
  closedAt?: Date;
  closedBy?: {
    name: string;
    email: string;
    role?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    client: {
      id: { type: String, default: "" },
      name: { type: String, default: "Guest Visitor" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      businessName: { type: String, default: "" },
      avatar: { type: String, default: "/images/profile-avatar.jpg" },
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
    assignedAgent: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
      avatar: { type: String },
    },
    participatingAgents: [
      {
        id: { type: String },
        name: { type: String },
        email: { type: String },
        avatar: { type: String },
        lastActive: { type: Date, default: Date.now },
      },
    ],
    lastMessage: {
      text: { type: String, default: "" },
      sender: { type: String, enum: ["client", "agent", "system"], default: "client" },
      senderName: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    },
    unreadCountClient: { type: Number, default: 0 },
    unreadCountAdmin: { type: Number, default: 0 },
    closedAt: { type: Date },
    closedBy: {
      name: { type: String },
      email: { type: String },
      role: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const ChatSessionModel: Model<IChatSession> =
  mongoose.models.ChatSession || mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);

export default ChatSessionModel;

