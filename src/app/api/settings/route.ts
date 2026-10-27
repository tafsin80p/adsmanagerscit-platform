import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";


export async function GET() {
  try {
    await connectDB();
    let settings = await SettingModel.findOne({ key: "global_settings" }).lean();

    if (!settings) {
      // Create default settings if not exists
      settings = await SettingModel.create({
        key: "global_settings",
        exchangeRateBDT: 131.25,
        serviceChargePercent: 5,
        bkashCashoutPercent: 1.85,
        nagadCashoutPercent: 1.49,
      });
    }

    return NextResponse.json({ success: true, settings });
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

    const updated = await SettingModel.findOneAndUpdate(
      { key: "global_settings" },
      { $set: { ...body, lastUpdated: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
