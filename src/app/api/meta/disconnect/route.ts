import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";

export async function POST() {
  try {
    await connectDB();
    const updated = await SettingModel.findOneAndUpdate(
      { key: "global_settings" },
      {
        $set: {
          metaApiConnected: false,
          metaAccessToken: "",
          metaAdAccountId: "",
          metaAccountName: "",
          metaAdAccounts: [],
          metaAppId: "",
          metaPageId: "",
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Meta Ads Manager integration disconnected successfully.",
      settings: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to disconnect Meta Ads Manager." },
      { status: 500 }
    );
  }
}
