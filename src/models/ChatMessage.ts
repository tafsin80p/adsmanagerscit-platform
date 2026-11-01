import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatMessage extends Document {
  sessionId: string;
  sender: "client" | "agent" | "system";
  senderId?: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  text: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: { type: String, required: true, index: true },
    sender: {
      type: String,
      enum: ["client", "agent", "system"],
      required: true,
      index: true,
    },
    senderId: { type: String, default: "" },
    senderName: { type: String, required: true, default: "User" },
    senderAvatar: { type: String, default: "" },
    senderRole: { type: String, default: "client" },
    text: { type: String, required: true, default: "" },
    attachmentUrl: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export const ChatMessageModel: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessageModel;

