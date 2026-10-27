import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";


export async function GET() {
  try {
    await connectDB();
    const readyState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const stateNames: Record<number, string> = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    return NextResponse.json({
      success: true,
      status: stateNames[readyState] || "Unknown",
      readyState,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      message: "MongoDB connected successfully! 🎉",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Database connection test failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to connect to MongoDB",
        hint: "Please ensure your MONGODB_URI in .env.local is valid and your MongoDB service is running (or IP is whitelisted in MongoDB Atlas).",
      },
      { status: 500 }
    );
  }
}
