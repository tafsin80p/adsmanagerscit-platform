import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ChatSessionModel, ChatMessageModel, UserModel } from "@/models";
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await ChatSessionModel.findOne({ sessionId: id }).lean();
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, session });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { action, agentName, agentEmail, reason } = body;

    const session = await ChatSessionModel.findOne({ sessionId: id });
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    // Identify current user/agent from session cookie if available
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("scit_auth_session")?.value;
    const authSession = parseSession(sessionCookie);

    let activeAgentName = agentName || "Support Specialist";
    let activeAgentEmail = agentEmail || "";
    let activeAgentAvatar = "/images/profile-avatar.jpg";

    if (authSession?.email) {
      const user = await UserModel.findOne({ email: authSession.email }).lean();
      if (user) {
        activeAgentName = user.name || activeAgentName;
        activeAgentEmail = user.email || activeAgentEmail;
        activeAgentAvatar = user.avatar || activeAgentAvatar;
      }
    }

    // 1. END CHAT / PROBLEM SOLVED
    if (action === "close") {
      session.status = "closed";
      session.closedAt = new Date();
      session.closedBy = {
        name: activeAgentName,
        email: activeAgentEmail,
        role: "Specialist",
      };

      // Add system message into chat
      const closeNotice = await ChatMessageModel.create({
        sessionId: session.sessionId,
        sender: "system",
        senderName: "Support Team",
        senderRole: "system",
        text: `🔒 Conversation marked as Resolved & Closed by ${activeAgentName}${reason ? ` (${reason})` : ""}. If you need any further help, simply send a new message below to reopen anytime.`,
        isRead: true,
      });

      session.lastMessage = {
        text: `Issue marked as resolved by ${activeAgentName}`,
        sender: "system",
        senderName: "System",
        createdAt: new Date(),
      };

      await session.save();

      return NextResponse.json({
        success: true,
        message: "Chat session closed successfully",
        session,
        systemMessage: closeNotice,
      });
    }

    // 2. REOPEN CHAT
    if (action === "reopen") {
      session.status = "open";
      session.closedAt = undefined;
      session.closedBy = undefined;

      const reopenNotice = await ChatMessageModel.create({
        sessionId: session.sessionId,
        sender: "system",
        senderName: "Support Team",
        senderRole: "system",
        text: `🟢 Conversation has been reopened. A specialist is reviewing your messages.`,
        isRead: true,
      });

      session.lastMessage = {
        text: "Conversation reopened",
        sender: "system",
        senderName: "System",
        createdAt: new Date(),
      };

      await session.save();

      return NextResponse.json({
        success: true,
        message: "Chat session reopened",
        session,
        systemMessage: reopenNotice,
      });
    }

    // 3. JOIN OR TAKE OVER CHAT
    if (action === "join" || action === "assign") {
      session.assignedAgent = {
        name: activeAgentName,
        email: activeAgentEmail,
        avatar: activeAgentAvatar,
      };

      // Add to participatingAgents if not present
      const alreadyParticipating = session.participatingAgents.some(
        (a) => a.email && a.email === activeAgentEmail
      );
      if (!alreadyParticipating) {
        session.participatingAgents.push({
          name: activeAgentName,
          email: activeAgentEmail,
          avatar: activeAgentAvatar,
          lastActive: new Date(),
        });
      } else {
        const found = session.participatingAgents.find((a) => a.email === activeAgentEmail);
        if (found) found.lastActive = new Date();
      }

      const joinNotice = await ChatMessageModel.create({
        sessionId: session.sessionId,
        sender: "system",
        senderName: "Support Team",
        senderRole: "system",
        text: `👋 ${activeAgentName} (Support Specialist) joined the chat to assist you.`,
        isRead: false,
      });

      session.lastMessage = {
        text: `${activeAgentName} joined the chat`,
        sender: "system",
        senderName: "System",
        createdAt: new Date(),
      };

      await session.save();

      return NextResponse.json({
        success: true,
        message: `${activeAgentName} joined the chat`,
        session,
        systemMessage: joinNotice,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

