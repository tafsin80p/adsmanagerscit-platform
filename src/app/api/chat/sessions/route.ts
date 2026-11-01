import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ChatSessionModel, UserModel } from "@/models";
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

// GET /api/chat/sessions
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status") || "all";
    const query = searchParams.get("q")?.toLowerCase() || "";

    // 1. If single sessionId requested
    if (sessionId) {
      let session = await ChatSessionModel.findOne({ sessionId }).lean();
      if (!session) {
        return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, session });
    }

    // 2. Admin Queue Listing
    const filter: Record<string, any> = {};
    if (status === "open" || status === "closed") {
      filter.status = status;
    }

    if (query) {
      filter.$or = [
        { "client.name": { $regex: query, $options: "i" } },
        { "client.email": { $regex: query, $options: "i" } },
        { "client.phone": { $regex: query, $options: "i" } },
        { "client.businessName": { $regex: query, $options: "i" } },
        { "lastMessage.text": { $regex: query, $options: "i" } },
      ];
    }

    const sessions = await ChatSessionModel.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const openCount = await ChatSessionModel.countDocuments({ status: "open" });
    const closedCount = await ChatSessionModel.countDocuments({ status: "closed" });
    const unreadAdminCount = await ChatSessionModel.aggregate([
      { $group: { _id: null, total: { $sum: "$unreadCountAdmin" } } },
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      counts: {
        open: openCount,
        closed: closedCount,
        unreadAdmin: unreadAdminCount[0]?.total || 0,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/chat/sessions - Initialize or recover a client session
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    let { sessionId, clientName, clientEmail, clientPhone, businessName, avatar } = body;

    // Check if user is logged in to enrich client profile
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("scit_auth_session")?.value;
    const authSession = parseSession(sessionCookie);

    if (authSession?.email) {
      const user = await UserModel.findOne({ email: authSession.email }).lean();
      if (user) {
        clientName = user.name || clientName;
        clientEmail = user.email || clientEmail;
        clientPhone = user.phone || clientPhone;
        businessName = user.businessName || businessName;
        avatar = user.avatar || avatar;
      }
    }

    if (!sessionId) {
      sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    let chatSession = await ChatSessionModel.findOne({ sessionId });

    if (!chatSession) {
      chatSession = await ChatSessionModel.create({
        sessionId,
        client: {
          name: clientName || "Guest Visitor",
          email: clientEmail || "",
          phone: clientPhone || "",
          businessName: businessName || "",
          avatar: avatar || "/images/profile-avatar.jpg",
        },
        status: "open",
        unreadCountClient: 0,
        unreadCountAdmin: 0,
        lastMessage: {
          text: "Chat session started",
          sender: "system",
          senderName: "System",
          createdAt: new Date(),
        },
      });
    } else {
      // Update client metadata if changed
      if (clientName || clientEmail || clientPhone || businessName) {
        chatSession.client.name = clientName || chatSession.client.name;
        chatSession.client.email = clientEmail || chatSession.client.email;
        chatSession.client.phone = clientPhone || chatSession.client.phone;
        chatSession.client.businessName = businessName || chatSession.client.businessName;
        if (avatar) chatSession.client.avatar = avatar;
        await chatSession.save();
      }
    }

    return NextResponse.json({ success: true, session: chatSession });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

