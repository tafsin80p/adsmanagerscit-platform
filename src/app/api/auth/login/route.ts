import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserModel, verifyPassword, hashPassword } from "@/models";

// Default seed accounts if DB doesn't have them yet
const defaultAccounts = [
  {
    name: "Min Mart BD",
    email: "tafsin@fashionhubbd.com",
    password: "minmart123",
    role: "client" as const,
    businessName: "Min Mart BD",
    phone: "+880 1712-889900",
    avatar: "/images/avatar.jpg",
    connectedPage: {
      name: "Min Mart BD",
      id: "110132735345674",
      followers: "18.5K followers",
      category: "Shopping & Retail",
      verified: true,
    },
    currency: "USD" as const,
  },

  {
    name: "Shopno IT Admin",
    email: "admin@shopnocareerit.com",
    password: "admin123",
    role: "admin" as const,
    businessName: "Shopno Career IT",
    phone: "+880 1800-112233",
    avatar: "/images/shopno-it.jpg",
    connectedPage: {
      name: "Shopno Career IT",
      id: "FB-SHOPNO-IT",
      followers: "50K followers",
      category: "Information Technology Company",
      verified: true,
    },
    currency: "USD" as const,
  },
];

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password, accountType } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address or client ID is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look for user in MongoDB
    let user = await UserModel.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });

    // If user not found, check if it's one of the initial seed demo accounts and auto-seed
    if (!user) {
      const matchingDefault = defaultAccounts.find(
        (acc) => acc.email.toLowerCase() === cleanEmail
      );

      if (matchingDefault) {
        user = await UserModel.create({
          ...matchingDefault,
          password: hashPassword(matchingDefault.password),
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found with this email. Please check your credentials or contact support.",
        },
        { status: 404 }
      );
    }

    // Check accountType compatibility if provided
    if (accountType === "specialist" && user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Access restricted: This account does not have specialist/admin privileges. Please switch to Client Account.",
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password || "");
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect password. Please verify and try again.",
        },
        { status: 401 }
      );
    }

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
      phone: user.phone,
      avatar: user.avatar,
      connectedPage: user.connectedPage,
      currency: user.currency,
      notifications: user.notifications,
    };

    const redirectUrl = user.role === "admin" ? "/admin" : "/";

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: userData,
      redirectUrl,
    });

    // Set auth cookie
    const sessionToken = Buffer.from(
      JSON.stringify({ id: userData.id, email: userData.email, role: userData.role, timestamp: Date.now() })
    ).toString("base64");

    response.cookies.set("scit_auth_session", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Login API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
