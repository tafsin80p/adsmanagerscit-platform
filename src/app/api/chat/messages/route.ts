import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ChatMessageModel, ChatSessionModel, UserModel } from "@/models";
import { cookies } from "next/headers";

function parseSession(cookieValue?: string) {
  if (!cookieValue) return null;
  try {
    const jsonStr = Buffer.from(cookieValue, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// GET /api/chat/messages?sessionId=...&role=client|agent&markRead=true
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const role = searchParams.get("role") || "client";
    const markRead = searchParams.get("markRead") === "true";

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    const messages = await ChatMessageModel.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    const session = await ChatSessionModel.findOne({ sessionId });

    // Mark as read for the viewing party
    if (markRead && session) {
      if (role === "client" && session.unreadCountClient > 0) {
        session.unreadCountClient = 0;
        await session.save();
        await ChatMessageModel.updateMany(
          { sessionId, sender: "agent", isRead: false },
          { $set: { isRead: true } }
        );
      } else if (role === "agent" && session.unreadCountAdmin > 0) {
        session.unreadCountAdmin = 0;
        await session.save();
        await ChatMessageModel.updateMany(
          { sessionId, sender: "client", isRead: false },
          { $set: { isRead: true } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      messages,
      session,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/chat/messages
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      sessionId,
      text,
      attachmentUrl,
      sender = "client",
      senderName,
      senderAvatar,
      senderRole,
      clientMeta,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    if (!text?.trim() && !attachmentUrl) {
      return NextResponse.json({ success: false, error: "Message content cannot be empty" }, { status: 400 });
    }

    // Determine current user if logged in
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("scit_auth_session")?.value;
    const authSession = parseSession(sessionCookie);

    let resolvedSenderName = senderName || (sender === "client" ? "Customer" : "Support Specialist");
    let resolvedSenderAvatar = senderAvatar || "";
    let resolvedSenderRole = senderRole || (sender === "client" ? "client" : "agent");
    let resolvedSenderId = "";

    if (authSession?.email) {
      const user = await UserModel.findOne({ email: authSession.email }).lean();
      if (user) {
        resolvedSenderName = user.name || resolvedSenderName;
        resolvedSenderAvatar = user.avatar || resolvedSenderAvatar;
        resolvedSenderId = String(user._id || "");
        if (sender === "agent" && user.role === "admin") {
          resolvedSenderRole = "Specialist";
        }
      }
    }

    let session = await ChatSessionModel.findOne({ sessionId });

    // If session doesn't exist yet, auto-create it
    if (!session) {
      session = await ChatSessionModel.create({
        sessionId,
        client: {
          name: clientMeta?.name || resolvedSenderName,
          email: clientMeta?.email || "",
          phone: clientMeta?.phone || "",
          businessName: clientMeta?.businessName || "",
          avatar: clientMeta?.avatar || resolvedSenderAvatar || "/images/profile-avatar.jpg",
        },
        status: "open",
        unreadCountClient: 0,
        unreadCountAdmin: 0,
      });
    }

    // CRITICAL USER REQUIREMENT:
    // If the client sends a message and the session was closed ("problem solved hoyle end chat dile end hobe, abr jodi message dy oikhan thake start hobe")
    // Reopen the conversation automatically!
    let reopenMessageDoc = null;
    if (sender === "client" && session.status === "closed") {
      session.status = "open";
      session.closedAt = undefined;
      session.closedBy = undefined;

      reopenMessageDoc = await ChatMessageModel.create({
        sessionId,
        sender: "system",
        senderName: "Support Team",
        senderRole: "system",
        text: `🔄 Conversation reopened by client. An available specialist will respond shortly.`,
        isRead: true,
      });
    }

    // Create the new message
    const newMessage = await ChatMessageModel.create({
      sessionId,
      sender,
      senderId: resolvedSenderId,
      senderName: resolvedSenderName,
      senderAvatar: resolvedSenderAvatar,
      senderRole: resolvedSenderRole,
      text: text.trim(),
      attachmentUrl: attachmentUrl || "",
      isRead: false,
    });

    // Update Session metadata
    session.lastMessage = {
      text: text.trim() || (attachmentUrl ? "Sent an attachment" : ""),
      sender,
      senderName: resolvedSenderName,
      createdAt: new Date(),
    };

    if (sender === "client") {
      session.unreadCountAdmin += 1;
    } else {
      session.unreadCountClient += 1;

      // Update active assigned agent & participating agents
      session.assignedAgent = {
        id: resolvedSenderId,
        name: resolvedSenderName,
        email: authSession?.email || "",
        avatar: resolvedSenderAvatar,
      };

      const alreadyInList = session.participatingAgents.some(
        (a) => a.name === resolvedSenderName
      );
      if (!alreadyInList) {
        session.participatingAgents.push({
          id: resolvedSenderId,
          name: resolvedSenderName,
          email: authSession?.email || "",
          avatar: resolvedSenderAvatar,
          lastActive: new Date(),
        });
      } else {
        const found = session.participatingAgents.find((a) => a.name === resolvedSenderName);
        if (found) found.lastActive = new Date();
      }
    }

    await session.save();

    return NextResponse.json({
      success: true,
      message: newMessage,
      reopenNotice: reopenMessageDoc,
      session,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

