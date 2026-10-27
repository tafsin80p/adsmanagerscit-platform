import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";

export async function GET() {
  try {
    await connectDB();

    // Upsert default global settings if not present
    await SettingModel.findOneAndUpdate(
      { key: "global_settings" },
      {
        $setOnInsert: {
          key: "global_settings",
          exchangeRateBDT: 150,
          serviceChargePercent: 0,
          bkashCashoutPercent: 2.0,
          nagadCashoutPercent: 1.5,
          bkashNumber: "01712-345678",
          nagadNumber: "01898-765432",
          bankDetails: {
            bankName: "The City Bank Ltd",
            accountName: "Meta Ads Agency BD",
            accountNumber: "1502-9384-72001",
            branch: "Gulshan Avenue Branch, Dhaka",
            routingNumber: "225271829",
          },
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Database initialized cleanly without demo data.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
