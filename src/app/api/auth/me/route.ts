import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { UserModel, verifyPassword, hashPassword } from "@/models";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("scit_auth_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    let sessionData: { id?: string; email?: string };
    try {
      const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
      sessionData = JSON.parse(decoded);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session token" },
        { status: 401 }
      );
    }

    if (!sessionData.email) {
      return NextResponse.json(
        { success: false, error: "Invalid session payload" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await UserModel.findOne({ email: sessionData.email }).select("-password").lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User no longer exists" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("scit_auth_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    let sessionData: { id?: string; email?: string };
    try {
      const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
      sessionData = JSON.parse(decoded);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session token" },
        { status: 401 }
      );
    }

    if (!sessionData.email) {
      return NextResponse.json(
        { success: false, error: "Invalid session payload" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json();

    const user = await UserModel.findOne({ email: sessionData.email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Password change handling
    if (body.newPassword && typeof body.newPassword === "string" && body.newPassword.trim().length > 0) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to change password." },
          { status: 400 }
        );
      }

      const isCurrentValid = verifyPassword(body.currentPassword, user.password || "");
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: "Current password does not match. Please verify and try again." },
          { status: 400 }
        );
      }

      if (body.newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      user.password = hashPassword(body.newPassword.trim());
    }

    // Profile updates
    if (body.name !== undefined && typeof body.name === "string") user.name = body.name.trim();
    if (body.phone !== undefined && typeof body.phone === "string") user.phone = body.phone.trim();
    if (body.businessName !== undefined && typeof body.businessName === "string") user.businessName = body.businessName.trim();
    if (body.avatar !== undefined && typeof body.avatar === "string") user.avatar = body.avatar.trim();
    if (body.currency && (body.currency === "USD" || body.currency === "BDT")) user.currency = body.currency;
    if (body.connectedPage && typeof body.connectedPage === "object") {
      user.connectedPage = {
        ...user.connectedPage,
        ...body.connectedPage,
      };
    }
    if (body.notifications && typeof body.notifications === "object") {
      user.notifications = {
        email: Boolean(body.notifications.email ?? user.notifications?.email ?? true),
        sms: Boolean(body.notifications.sms ?? user.notifications?.sms ?? true),
        whatsapp: Boolean(body.notifications.whatsapp ?? user.notifications?.whatsapp ?? true),
      };
    }

    await user.save();

    const updatedUser = await UserModel.findOne({ _id: user._id }).select("-password").lean();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

