import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel, PaymentModel } from "@/models";
import {
  answerTelegramCallbackQuery,
  editTelegramMessage,
  escapeHtml,
} from "@/lib/telegram";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "Telegram webhook endpoint active",
    endpoint: "/api/telegram/webhook",
    time: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const update = await req.json().catch(() => null);

    if (!update) {
      return NextResponse.json({ ok: true });
    }

    // 1. Handle interactive inline callback queries (Button clicks)
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackId = cq.id;
      const data = cq.data || "";
      const fromUser = cq.from;
      const message = cq.message;

      const responder = fromUser.username
        ? `@${fromUser.username}`
        : [fromUser.first_name, fromUser.last_name].filter(Boolean).join(" ") || "Admin";

      // If already processed button clicked (e.g. info_done)
      if (data === "info_done") {
        await answerTelegramCallbackQuery(callbackId, "This order status has already been updated.", false);
        return NextResponse.json({ ok: true });
      }

      const colonIndex = data.indexOf(":");
      if (colonIndex === -1) {
        await answerTelegramCallbackQuery(callbackId, "Unknown action command.", false);
        return NextResponse.json({ ok: true });
      }

      const action = data.slice(0, colonIndex);
      const orderId = data.slice(colonIndex + 1);

      await connectDB();
      const order = await OrderModel.findOne({ id: orderId });

      if (!order) {
        await answerTelegramCallbackQuery(
          callbackId,
          `⚠️ Order #${orderId} was not found in the database.`,
          true
        );
        return NextResponse.json({ ok: true });
      }

      const nowFormatted = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const chatId = message.chat.id;
      const messageId = message.message_id;
      const isCaption = Boolean(message.caption && !message.text);
      const originalBody = (message.caption || message.text || "").replace(
        /━━━━━━━━━━━━━━━━━━━━━━━━━━\s*👇[\s\S]*$/g,
        ""
      ).trim();

      if (action === "confirm") {
        // Update Order in MongoDB Atlas
        order.status = "Active";
        order.paymentStatus = "Verified";
        await order.save();

        // Update corresponding Payment in MongoDB Atlas
        await PaymentModel.findOneAndUpdate(
          { orderId: order.id },
          { $set: { status: "Verified" } }
        );

        // Feedback alert popup to admin in Telegram
        await answerTelegramCallbackQuery(
          callbackId,
          `✅ Order #${order.id} verified & activated successfully!`,
          false
        );

        // Updated Message with verification badge
        const updatedMessage = `
${originalBody}
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>ORDER CONFIRMED & ACTIVATED</b>
👤 <b>Verified by:</b> <b>${escapeHtml(responder)}</b>
🕒 <b>Verified on:</b> ${nowFormatted}
⚡ <i>Payment marked as Verified in MongoDB database.</i>
`.trim();

        const updatedButtons: any[][] = [
          [{ text: "🟢 Order Active & Verified", callback_data: "info_done" }],
        ];

        if (order.postUrl && order.postUrl.startsWith("http")) {
          updatedButtons.push([{ text: "🔗 View Post Creative", url: order.postUrl }]);
        }

        await editTelegramMessage(chatId, messageId, updatedMessage, {
          isCaption,
          parseMode: "HTML",
          inlineKeyboard: updatedButtons,
        });
      } else if (action === "reject") {
        // Update Order to Rejected
        order.status = "Rejected";
        order.paymentStatus = "Failed";
        await order.save();

        // Update Payment to Failed
        await PaymentModel.findOneAndUpdate(
          { orderId: order.id },
          { $set: { status: "Failed" } }
        );

        await answerTelegramCallbackQuery(
          callbackId,
          `❌ Order #${order.id} marked as Rejected.`,
          false
        );

        const updatedMessage = `
${originalBody}
━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ <b>ORDER REJECTED / CANCELLED</b>
👤 <b>Action by:</b> <b>${escapeHtml(responder)}</b>
🕒 <b>Rejected on:</b> ${nowFormatted}
⚡ <i>Order status changed to Rejected in MongoDB database.</i>
`.trim();

        const updatedButtons: any[][] = [
          [{ text: "🔴 Order Rejected", callback_data: "info_done" }],
        ];

        if (order.postUrl && order.postUrl.startsWith("http")) {
          updatedButtons.push([{ text: "🔗 View Post Creative", url: order.postUrl }]);
        }

        await editTelegramMessage(chatId, messageId, updatedMessage, {
          isCaption,
          parseMode: "HTML",
          inlineKeyboard: updatedButtons,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Handle basic chat messages to bot (e.g. /start)
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;

      if (text.startsWith("/start") || text.startsWith("/help")) {
        const reply = `
🤖 <b>Shopno IT Meta Ads Order Bot</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
I deliver instant order notifications to your group whenever a client places an order or admin enters a campaign.

Group members can click <b>[✅ Confirm & Activate]</b> to approve orders and verify payments directly from Telegram without visiting the website admin panel!

🆔 <b>This Chat ID:</b> <code>${chatId}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Meta Ads Management Platform</i>
`.trim();

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: reply,
              parse_mode: "HTML",
            }),
          }).catch(() => null);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Telegram Webhook] Error processing update:", err);
    // Always return 200 OK so Telegram doesn't retry broken updates repeatedly
    return NextResponse.json({ ok: true, error: err.message });
  }
}

