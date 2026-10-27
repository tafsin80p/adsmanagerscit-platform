import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { UserModel } from "@/models";

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
    delete body.password;
    delete body.email;
    delete body.role;

    const updated = await UserModel.findOneAndUpdate(
      { email: sessionData.email },
      { $set: body },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

