import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel, PaymentModel } from "@/models";
import { editTelegramMessage, sendTelegramMessage, getTelegramConfig, escapeHtml } from "@/lib/telegram";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const orderId = url.searchParams.get("orderId");
    const chatId = url.searchParams.get("chatId");
    const messageIdStr = url.searchParams.get("messageId");

    if (!orderId || !action) {
      return new Response(renderHtmlPage({
        success: false,
        title: "Missing Parameters",
        message: "Order ID and Action are required to process confirmation.",
      }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    await connectDB();
    const order = await OrderModel.findOne({ id: orderId });

    if (!order) {
      return new Response(renderHtmlPage({
        success: false,
        title: "Order Not Found",
        message: `Order #${orderId} was not found in the database.`,
      }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const nowFormatted = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (action === "confirm") {
      // 1. Update Order in MongoDB
      await OrderModel.findOneAndUpdate(
        { id: order.id },
        { $set: { status: "Active", paymentStatus: "Verified" } }
      );

      // 2. Update Payment in MongoDB
      await PaymentModel.findOneAndUpdate(
        { orderId: order.id },
        { $set: { status: "Verified" } }
      );

      // 3. Notify Telegram group that order was confirmed
      const config = await getTelegramConfig();
      if (chatId && messageIdStr) {
        const msgId = parseInt(messageIdStr, 10);
        if (!isNaN(msgId)) {
          editTelegramMessage(
            chatId,
            msgId,
            `✅ <b>ORDER CONFIRMED & ACTIVATED</b>\n📦 Order: <code>#${escapeHtml(order.id)}</code>\n🏷️ Campaign: <b>${escapeHtml(order.campaignName)}</b>\n👤 Client: <b>${escapeHtml(order.clientName || order.businessName || "")}</b>\n💰 Total: <b>$${Number(order.totalBudgetUSD || 0).toFixed(2)} USD (৳${Number(order.paidAmountBDT || 0).toLocaleString()} BDT)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>Confirmed & Payment Verified</b> via Instant Link\n🕒 <b>Time:</b> ${nowFormatted}`,
            { parseMode: "HTML" }
          ).catch((e) => console.warn("[Telegram Action] Could not edit message:", e));
        }
      } else if (config.chatId && config.enabled) {
        sendTelegramMessage(
          `✅ <b>ORDER #${escapeHtml(order.id)} CONFIRMED & ACTIVATED!</b>\n🏷️ Campaign: <b>${escapeHtml(order.campaignName)}</b>\n👤 Client: <b>${escapeHtml(order.clientName || order.businessName || "")}</b>\n💰 Total: <b>$${Number(order.totalBudgetUSD || 0).toFixed(2)} USD (৳${Number(order.paidAmountBDT || 0).toLocaleString()} BDT)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ <i>Payment marked as Verified in database. Order is now Active.</i>\n🕒 <b>Time:</b> ${nowFormatted}`,
          { parseMode: "HTML" }
        ).catch(() => {});
      }

      return new Response(renderHtmlPage({
        success: true,
        orderId: order.id,
        campaignName: order.campaignName,
        clientName: order.clientName || order.businessName || "Valued Client",
        totalUSD: Number(order.totalBudgetUSD || 0).toFixed(2),
        totalBDT: Number(order.paidAmountBDT || 0).toLocaleString(),
        title: "Order Confirmed & Activated!",
        message: "Payment marked as Verified in database. The Meta Ads campaign is now Active.",
      }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } else if (action === "reject") {
      await OrderModel.findOneAndUpdate(
        { id: order.id },
        { $set: { status: "Rejected", paymentStatus: "Failed" } }
      );

      await PaymentModel.findOneAndUpdate(
        { orderId: order.id },
        { $set: { status: "Failed" } }
      );

      return new Response(renderHtmlPage({
        success: false,
        orderId: order.id,
        campaignName: order.campaignName,
        title: "Order Marked as Rejected",
        message: "Payment marked as Failed and Order status changed to Rejected.",
      }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(renderHtmlPage({
      success: false,
      title: "Invalid Action",
      message: `Unknown action: ${action}`,
    }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(renderHtmlPage({
      success: false,
      title: "System Error",
      message: error.message || "Failed to process order confirmation.",
    }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function renderHtmlPage(data: {
  success: boolean;
  title: string;
  message: string;
  orderId?: string;
  campaignName?: string;
  clientName?: string;
  totalUSD?: string;
  totalBDT?: string;
}) {
  const isSuccess = data.success;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - Shopno IT</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #F8FAFC; color: #1E293B; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #FFFFFF; max-width: 480px; width: 100%; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; text-align: center; }
    .badge-icon { width: 64px; height: 64px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 20px; }
    .badge-success { background: #EAF8F1; color: #10B981; }
    .badge-danger { background: #FEE2E2; color: #EF4444; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #0F172A; }
    p { font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 24px; }
    .details { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 24px; font-size: 13px; }
    .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #E2E8F0; }
    .details-row:last-child { border-bottom: none; }
    .label { color: #64748B; }
    .val { font-weight: 700; color: #0F172A; }
    .btn-group { display: flex; flex-direction: column; gap: 10px; }
    .btn { display: block; width: 100%; padding: 12px 20px; border-radius: 14px; font-size: 13px; font-weight: 700; text-decoration: none; text-align: center; transition: all 0.2s; }
    .btn-primary { background: #3858F6; color: #FFFFFF; }
    .btn-primary:hover { background: #2542D9; }
    .btn-secondary { background: #F1F5F9; color: #334155; }
    .btn-secondary:hover { background: #E2E8F0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge-icon ${isSuccess ? 'badge-success' : 'badge-danger'}">
      ${isSuccess ? '✓' : '✕'}
    </div>
    <h1>${data.title}</h1>
    <p>${data.message}</p>

    ${data.orderId ? `
    <div class="details">
      <div class="details-row">
        <span class="label">Order ID:</span>
        <span class="val">#${data.orderId}</span>
      </div>
      ${data.campaignName ? `
      <div class="details-row">
        <span class="label">Campaign:</span>
        <span class="val">${data.campaignName}</span>
      </div>` : ''}
      ${data.clientName ? `
      <div class="details-row">
        <span class="label">Client:</span>
        <span class="val">${data.clientName}</span>
      </div>` : ''}
      ${data.totalUSD ? `
      <div class="details-row">
        <span class="label">Total Amount:</span>
        <span class="val">$${data.totalUSD} USD (৳${data.totalBDT})</span>
      </div>` : ''}
      <div class="details-row">
        <span class="label">Order Status:</span>
        <span class="val" style="color: ${isSuccess ? '#10B981' : '#EF4444'}">${isSuccess ? 'Active (Live)' : 'Rejected'}</span>
      </div>
      <div class="details-row">
        <span class="label">Payment Status:</span>
        <span class="val" style="color: ${isSuccess ? '#10B981' : '#EF4444'}">${isSuccess ? 'Verified' : 'Failed'}</span>
      </div>
    </div>
    ` : ''}

    <div class="btn-group">
      <a href="/admin/orders" class="btn btn-primary">Open Admin Orders Console</a>
      <a href="/admin/payments" class="btn btn-secondary">Open Payments Audit Console</a>
    </div>
  </div>
</body>
</html>`;
}
