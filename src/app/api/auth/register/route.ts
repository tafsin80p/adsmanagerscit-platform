import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserModel, hashPassword } from "@/models";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      businessName,
      role,
      facebookPageName,
      facebookPageId,
      facebookPageUrl,
      pageCategory,
      followers,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Determine Facebook Page details
    let resolvedPageName =
      (facebookPageName && facebookPageName.trim()) ||
      (businessName && businessName.trim()) ||
      `${name.trim()}'s Page`;

    let resolvedPageId = (facebookPageId && facebookPageId.trim()) || "";
    if (!resolvedPageId && facebookPageUrl) {
      const match = facebookPageUrl.match(
        /(?:facebook\.com\/(?:pages\/[^\/]+\/)?|fb\.com\/)([0-9]+|[A-Za-z0-9_.-]+)/i
      );
      if (match && match[1]) {
        resolvedPageId = match[1];
      }
    }

    let resolvedCategory = (pageCategory && pageCategory.trim()) || "Shopping & Retail";
    let resolvedFollowers = (followers && followers.trim()) || "12.8K followers";
    let resolvedAvatar = "/images/avatar.jpg";

    // Detect Min Mart BD
    if (
      resolvedPageName.toLowerCase().includes("min mart") ||
      resolvedPageId === "110132735345674" ||
      (facebookPageUrl && facebookPageUrl.includes("110132735345674"))
    ) {
      resolvedPageName = "MIN Mart BD";
      resolvedPageId = "110132735345674";
      resolvedFollowers = "12.8K followers";
      resolvedCategory = "Shopping & Retail";
      resolvedAvatar = "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527";
    }

    if (!resolvedPageId) {
      resolvedPageId = `FB-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }

    const newUser = await UserModel.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      phone: phone || "",
      businessName: resolvedPageName,
      role: role === "admin" ? "admin" : "client",
      avatar: resolvedAvatar,
      connectedPage: {
        name: resolvedPageName,
        id: resolvedPageId,
        followers: resolvedFollowers,
        category: resolvedCategory,
        verified: true,
        avatar: resolvedAvatar,
      },
      currency: "USD",
      notifications: {
        email: true,
        sms: true,
        whatsapp: true,
      },
    });

    const userData = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      businessName: newUser.businessName,
      phone: newUser.phone,
      avatar: newUser.avatar,
      connectedPage: newUser.connectedPage,
      currency: newUser.currency,
      notifications: newUser.notifications,
    };

    const sessionToken = Buffer.from(
      JSON.stringify({ id: userData.id, email: userData.email, role: userData.role, timestamp: Date.now() })
    ).toString("base64");

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully!",
        user: userData,
      },
      { status: 201 }
    );

    response.cookies.set("scit_auth_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
