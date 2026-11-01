import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const botTokenOverride = body.botToken?.trim() || undefined;
    const chatIdOverride = body.chatId?.trim() || undefined;

    const testMessage = `
🤖 <b>Shopno IT Telegram Bot Test</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>Connection Status:</b> Successful!
🕒 <b>Timestamp:</b> ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}
📱 <b>Notification Mode:</b> Live Order Broadcast Active

Your Telegram bot is now successfully connected! When a client places an order or admin creates an order, full campaign and payment details will be posted to this chat/group automatically. 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Meta Ads Agency Management Platform</i>
`.trim();

    const result = await sendTelegramMessage(testMessage, {
      parseMode: "HTML",
      botTokenOverride,
      chatIdOverride,
      inlineKeyboard: [
        [
          {
            text: "🌐 Open Admin Portal",
            url: "https://shopnocareerit.com",
          },
        ],
      ],
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test message sent successfully to ${result.delivered} Telegram recipient(s)!`,
        delivered: result.delivered,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            result.errors.length > 0
              ? result.errors.join("; ")
              : "Failed to deliver message. Check Bot Token and Chat/Group ID.",
          details: result.errors,
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send Telegram test message" },
      { status: 500 }
    );
  }
}

