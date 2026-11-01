import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";
import { setTelegramWebhook, getTelegramWebhookInfo, getTelegramConfig } from "@/lib/telegram";

export async function GET() {
  try {
    const info = await getTelegramWebhookInfo();
    const config = await getTelegramConfig();

    return NextResponse.json({
      success: info.success,
      webhookInfo: info,
      currentConfigUrl: config.webhookUrl,
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
    const body = await req.json().catch(() => ({}));

    let targetUrl = body.webhookUrl?.trim();
    const botToken = body.botToken?.trim();

    // If no webhook URL provided, auto-construct from request headers
    if (!targetUrl) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "shopnocareerit.com";
      const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      targetUrl = `${proto}://${host}/api/telegram/webhook`;
    }

    const result = await setTelegramWebhook(targetUrl, botToken);

    if (result.success) {
      // Save webhook URL in database settings
      await SettingModel.findOneAndUpdate(
        { key: "global_settings" },
        { $set: { telegramWebhookUrl: targetUrl, lastUpdated: new Date() } },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: `Telegram webhook set to: ${targetUrl}`,
        url: targetUrl,
        description: result.description,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.description || "Failed to set Telegram webhook.",
          url: targetUrl,
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

