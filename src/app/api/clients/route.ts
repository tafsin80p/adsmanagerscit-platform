import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserModel, hashPassword } from "@/models";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");

    const query: Record<string, any> = {};
    if (roleParam && roleParam !== "all") {
      query.role = roleParam;
    }

    const clients = await UserModel.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name,
      email,
      password = "client123",
      role = "client",
      phone = "",
      businessName = "",
      dollarRate = 150,
      pageName = "",
      pageCategory = "E-Commerce",
      pageFollowers = "10K followers",
      avatar = "",
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const isStaff = role === "representative" || role === "admin" || role === "manager";
    const newClient = await UserModel.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      phone: phone.trim() || (isStaff ? "" : "+880 1700-000000"),
      businessName:
        businessName.trim() ||
        (isStaff
          ? role === "representative"
            ? "Support Representative"
            : role === "manager"
            ? "Ads Operations Specialist"
            : "Admin Staff"
          : `${name}'s Brand`),
      role:
        role === "admin"
          ? "admin"
          : role === "representative"
          ? "representative"
          : role === "manager"
          ? "manager"
          : "client",
      assignedShift: body.assignedShift || "Day Shift",
      avatar: avatar.trim() || "/images/avatar.jpg",
      connectedPage: isStaff
        ? {
            name:
              role === "representative"
                ? "Live Chat Desk"
                : role === "manager"
                ? "Campaign Operations Desk"
                : "Admin Console",
            id: `STAFF-${Math.floor(1000000 + Math.random() * 9000000)}`,
            followers: role === "manager" ? (body.assignedShift || "Day Shift") : "Staff Member",
            category:
              role === "representative"
                ? "Customer Support"
                : role === "manager"
                ? "Ads Operations"
                : "Administration",
            verified: true,
          }
        : {
            name: pageName.trim() || businessName.trim() || `${name}'s Facebook Page`,
            id: `FB-PAGE-${Math.floor(1000000 + Math.random() * 9000000)}`,
            followers: pageFollowers.trim() || "12.5K followers",
            category: pageCategory.trim() || "Retail & Shopping",
            verified: true,
          },
      currency: "USD",
      dollarRate: !isNaN(Number(dollarRate)) && Number(dollarRate) > 0 ? Number(dollarRate) : 150,
      notifications: {
        email: true,
        sms: !isStaff,
        whatsapp: !isStaff,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Client account onboarded successfully!",
      client: {
        _id: newClient._id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        businessName: newClient.businessName,
        connectedPage: newClient.connectedPage,
        role: newClient.role,
        createdAt: newClient.createdAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
