import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { UserModel, verifyPassword, hashPassword } from "@/models";

interface SessionPayload {
  id?: string;
  email?: string;
  role?: "client" | "admin";
  timestamp?: number;
}

async function getAdminSession(): Promise<{ id?: string; email?: string; role?: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("scit_auth_session");
  if (!sessionCookie || !sessionCookie.value) return null;

  try {
    const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const data: SessionPayload = JSON.parse(decoded);
    if (!data.email || data.role !== "admin") return null;
    return data;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || !session.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    await connectDB();
    let admin = await UserModel.findOne({ email: session.email.toLowerCase() })
      .select("-password")
      .lean();

    // Fallback if email was changed or session id matches
    if (!admin && session.id) {
      admin = await UserModel.findById(session.id).select("-password").lean();
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin account not found in database." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve admin profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || !session.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    await connectDB();

    let admin = await UserModel.findOne({ email: session.email.toLowerCase() });
    if (!admin && session.id) {
      admin = await UserModel.findById(session.id);
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin account not found in database." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      businessName,
      avatar,
      currency,
      notifications,
      connectedPage,
      currentPassword,
      newPassword,
    } = body;

    let emailChanged = false;

    // 1. Password change validation
    if (newPassword && typeof newPassword === "string" && newPassword.trim().length > 0) {
      const trimmedNewPass = newPassword.trim();
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to change your password." },
          { status: 400 }
        );
      }

      const isCurrentValid = verifyPassword(currentPassword, admin.password || "");
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: "Current password does not match. Please verify and try again." },
          { status: 400 }
        );
      }

      if (trimmedNewPass.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      admin.password = hashPassword(trimmedNewPass);
    }

    // 2. Email change validation
    if (email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid email address." },
          { status: 400 }
        );
      }

      if (cleanEmail !== admin.email.toLowerCase()) {
        const existingWithEmail = await UserModel.findOne({
          email: cleanEmail,
          _id: { $ne: admin._id },
        });

        if (existingWithEmail) {
          return NextResponse.json(
            { success: false, error: `The email "${cleanEmail}" is already registered to another account.` },
            { status: 400 }
          );
        }

        admin.email = cleanEmail;
        emailChanged = true;
      }
    }

    // 3. Information updates
    if (name !== undefined && typeof name === "string") {
      admin.name = name.trim() || admin.name;
    }
    if (phone !== undefined && typeof phone === "string") {
      admin.phone = phone.trim();
    }
    if (businessName !== undefined && typeof businessName === "string") {
      admin.businessName = businessName.trim() || admin.businessName;
    }
    if (avatar !== undefined && typeof avatar === "string") {
      admin.avatar = avatar.trim() || admin.avatar;
    }
    if (currency && (currency === "USD" || currency === "BDT")) {
      admin.currency = currency;
    }
    if (notifications && typeof notifications === "object") {
      admin.notifications = {
        email: Boolean(notifications.email ?? admin.notifications?.email ?? true),
        sms: Boolean(notifications.sms ?? admin.notifications?.sms ?? true),
        whatsapp: Boolean(notifications.whatsapp ?? admin.notifications?.whatsapp ?? true),
      };
    }
    if (connectedPage && typeof connectedPage === "object") {
      admin.connectedPage = {
        ...admin.connectedPage,
        ...connectedPage,
      };
    }

    await admin.save();

    // Prepare response data without password
    const adminData = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      businessName: admin.businessName,
      avatar: admin.avatar,
      role: admin.role,
      connectedPage: admin.connectedPage,
      currency: admin.currency,
      notifications: admin.notifications,
      updatedAt: admin.updatedAt || new Date(),
    };

    const response = NextResponse.json({
      success: true,
      message: "Admin profile and credentials updated successfully!",
      admin: adminData,
      emailChanged,
    });

    // If email changed, refresh the auth session cookie so user stays authenticated seamlessly
    if (emailChanged) {
      const sessionToken = Buffer.from(
        JSON.stringify({
          id: adminData.id,
          email: adminData.email,
          role: adminData.role,
          timestamp: Date.now(),
        })
      ).toString("base64");

      response.cookies.set("scit_auth_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update admin profile." },
      { status: 500 }
    );
  }
}
