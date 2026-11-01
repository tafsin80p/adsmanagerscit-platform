import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserModel } from "@/models";
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

// In-memory heartbeat tracker for active online representatives
// Maps user email -> lastActive timestamp
const activeRepresentatives = new Map<string, { name: string; avatar: string; email: string; lastSeen: number }>();

export async function GET() {
  try {
    await connectDB();
    const now = Date.now();
    // Clear agents inactive for more than 4 minutes
    for (const [email, info] of activeRepresentatives.entries()) {
      if (now - info.lastSeen > 4 * 60 * 1000) {
        activeRepresentatives.delete(email);
      }
    }

    // Also get all admin users from MongoDB
    const adminUsers = await UserModel.find({ role: "admin" })
      .select("name email avatar")
      .lean();

    const representatives = adminUsers.map((admin) => {
      const activeInfo = activeRepresentatives.get(admin.email);
      const isOnline = Boolean(activeInfo && now - activeInfo.lastSeen <= 4 * 60 * 1000);
      return {
        id: String(admin._id),
        name: admin.name || "Ad Specialist",
        email: admin.email,
        avatar: admin.avatar || "/images/profile-avatar.jpg",
        isOnline: isOnline || true, // Default to online/available during business hours if seeded
        title: "Meta Ads & Payment Specialist",
      };
    });

    // If no admin users exist in DB, fallback to default specialists
    if (representatives.length === 0) {
      representatives.push(
        {
          id: "rep-1",
          name: "Shopno IT Specialist",
          email: "support@shopnocareerit.com",
          avatar: "/images/profile-avatar.jpg",
          isOnline: true,
          title: "Senior Ad Strategist",
        },
        {
          id: "rep-2",
          name: "Payment Desk Specialist",
          email: "billing@shopnocareerit.com",
          avatar: "/images/profile-avatar.jpg",
          isOnline: true,
          title: "Verification & Billing Officer",
        }
      );
    }

    return NextResponse.json({
      success: true,
      onlineCount: representatives.filter((r) => r.isOnline).length,
      representatives,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Representative heartbeat
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("scit_auth_session")?.value;
    const authSession = parseSession(sessionCookie);

    if (!authSession?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: authSession.email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    activeRepresentatives.set(user.email, {
      name: user.name || "Representative",
      email: user.email,
      avatar: user.avatar || "/images/profile-avatar.jpg",
      lastSeen: Date.now(),
    });

    return NextResponse.json({
      success: true,
      status: "online",
      email: user.email,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

