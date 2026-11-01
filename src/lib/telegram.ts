import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export function escapeHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Retrieves the active Telegram configuration from MongoDB settings or environment variables.
 */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  let botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  let chatId = process.env.TELEGRAM_CHAT_ID || "";
  let enabled = true;

  try {
    await connectDB();
    const settings = await SettingModel.findOne({ key: "global_settings" }).lean();
    if (settings) {
      if (settings.telegramBotToken) {
        botToken = settings.telegramBotToken.trim();
      }
      if (settings.telegramChatId) {
        chatId = settings.telegramChatId.trim();
      }
      if (settings.telegramEnabled !== undefined) {
        enabled = Boolean(settings.telegramEnabled);
      }
    }
  } catch (err) {
    console.warn("[Telegram] Could not read settings from MongoDB:", err);
  }

  return {
    botToken,
    chatId,
    enabled,
  };
}

export interface SendTelegramOptions {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  photoUrl?: string;
  inlineKeyboard?: Array<Array<{ text: string; url: string }>>;
  botTokenOverride?: string;
  chatIdOverride?: string;
}

/**
 * Sends a message (and photo if provided) to one or multiple Telegram chats/groups.
 */
export async function sendTelegramMessage(
  text: string,
  options?: SendTelegramOptions
): Promise<{ success: boolean; delivered: number; errors: string[] }> {
  const config = await getTelegramConfig();
  const botToken = (options?.botTokenOverride || config.botToken).trim();
  const rawChatId = (options?.chatIdOverride || config.chatId).trim();

  if (!config.enabled && !options?.botTokenOverride) {
    console.log("[Telegram] Notifications are currently disabled in settings.");
    return { success: false, delivered: 0, errors: ["Telegram notifications disabled"] };
  }

  if (!botToken) {
    console.log("[Telegram] No Telegram Bot Token configured. Skipping notification.");
    return { success: false, delivered: 0, errors: ["Missing bot token"] };
  }

  if (!rawChatId) {
    console.log("[Telegram] No Telegram Chat/Group ID configured. Skipping notification.");
    return { success: false, delivered: 0, errors: ["Missing chat ID"] };
  }

  // Parse chat IDs (supports comma/space/semicolon separated IDs for personal + groups)
  const chatIds = rawChatId
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    return { success: false, delivered: 0, errors: ["No valid chat IDs parsed"] };
  }

  const errors: string[] = [];
  let delivered = 0;

  for (const targetChatId of chatIds) {
    let sentPhotoSuccess = false;

    // 1. If photoUrl is supplied, attempt sendPhoto first
    if (options?.photoUrl && options.photoUrl.startsWith("http")) {
      try {
        const photoPayload: Record<string, any> = {
          chat_id: targetChatId,
          photo: options.photoUrl,
          caption: text.slice(0, 1024), // Telegram caption max limit is 1024 chars
          parse_mode: options?.parseMode || "HTML",
        };

        if (options?.inlineKeyboard && options.inlineKeyboard.length > 0) {
          photoPayload.reply_markup = {
            inline_keyboard: options.inlineKeyboard,
          };
        }

        const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(photoPayload),
        });

        const photoData = await photoRes.json();
        if (photoRes.ok && photoData.ok) {
          delivered++;
          sentPhotoSuccess = true;
        } else {
          console.warn(
            `[Telegram] sendPhoto failed for ${targetChatId} (${photoData.description}). Falling back to text message.`
          );
        }
      } catch (err: unknown) {
        console.warn(`[Telegram] sendPhoto exception for ${targetChatId}:`, err);
      }
    }

    // 2. If photo wasn't sent (or not provided), send as standard sendMessage
    if (!sentPhotoSuccess) {
      try {
        let messageText = text;
        // If photoUrl was provided but sendPhoto failed, append image link
        if (options?.photoUrl && options.photoUrl.startsWith("http")) {
          messageText += `\n\n📸 <a href="${options.photoUrl}">View Attached Screenshot / Proof</a>`;
        }

        const msgPayload: Record<string, any> = {
          chat_id: targetChatId,
          text: messageText,
          parse_mode: options?.parseMode || "HTML",
          disable_web_page_preview: false,
        };

        if (options?.inlineKeyboard && options.inlineKeyboard.length > 0) {
          msgPayload.reply_markup = {
            inline_keyboard: options.inlineKeyboard,
          };
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(msgPayload),
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          delivered++;
        } else {
          const errMsg = data.description || `HTTP ${res.status}`;
          errors.push(`Chat ${targetChatId}: ${errMsg}`);
          console.error(`[Telegram] sendMessage failed for ${targetChatId}:`, errMsg);
        }
      } catch (err: unknown) {
        const error = err as Error;
        errors.push(`Chat ${targetChatId}: ${error.message}`);
        console.error(`[Telegram] Network error sending to ${targetChatId}:`, err);
      }
    }
  }

  return {
    success: delivered > 0,
    delivered,
    errors,
  };
}

/**
 * Formats and broadcasts an instant alert when a new order is received.
 */
export async function notifyNewOrderTelegram(order: any): Promise<boolean> {
  try {
    const orderId = order.id || "NEW-ORDER";
    const campaignName = order.campaignName || "Untitled Campaign";
    const clientName = order.clientName || order.businessName || "Valued Client";
    const businessName = order.businessName || order.facebookPageName || "Business";
    const clientEmail = order.clientEmail || "Not provided";
    const pageName = order.facebookPageName || "Connected FB Page";
    const pageId = order.facebookPageId || "";
    const postType = order.postType || "Boost Post";
    const objective = order.objective || "Messages";
    const dailyBudget = Number(order.dailyBudgetUSD || 0).toFixed(2);
    const durationDays = Number(order.durationDays || 1);
    const totalUSD = Number(order.totalBudgetUSD || 0).toFixed(2);
    const totalBDT = Number(order.paidAmountBDT || 0).toLocaleString();
    const paymentMethod = order.paymentMethod || "bKash";
    const paymentStatus = order.paymentStatus || "Awaiting Verification";
    const transactionId = order.transactionId || "N/A";
    const postUrl = order.postUrl || "";
    const notes = Array.isArray(order.notes) && order.notes.length > 0 ? order.notes[0] : "";

    const message = `
🚀 <b>NEW META ADS ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>#${escapeHtml(orderId)}</code>
🏷️ <b>Campaign:</b> <b>${escapeHtml(campaignName)}</b>
🎯 <b>Category:</b> ${escapeHtml(postType)} (${escapeHtml(objective)})

👤 <b>Client:</b> ${escapeHtml(clientName)}
🏢 <b>Brand / Page:</b> ${escapeHtml(pageName)}${pageId ? `\n🆔 <b>Page ID:</b> <code>${escapeHtml(pageId)}</code>` : ""}
📧 <b>Email:</b> <code>${escapeHtml(clientEmail)}</code>

💰 <b>Budget & Schedule:</b>
• Daily Budget: $${dailyBudget} USD / Day
• Duration: ${durationDays} Days
• Total USD: <b>$${totalUSD} USD</b>
• Total BDT: <b>৳${totalBDT} BDT</b>

💳 <b>Payment Details:</b>
• Method: <b>${escapeHtml(paymentMethod)}</b>
• Status: <b>${escapeHtml(paymentStatus)}</b>
• TrxID: <code>${escapeHtml(transactionId)}</code>
${notes ? `\n📝 <b>Specialist Note:</b>\n<i>${escapeHtml(notes)}</i>` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Shopno IT • Automated Agency Notification</i>
`.trim();

    const inlineKeyboard: Array<Array<{ text: string; url: string }>> = [];
    const buttonsRow: Array<{ text: string; url: string }> = [];

    if (postUrl && postUrl.startsWith("http")) {
      buttonsRow.push({ text: "🔗 View Post Creative", url: postUrl });
    }

    if (buttonsRow.length > 0) {
      inlineKeyboard.push(buttonsRow);
    }

    const result = await sendTelegramMessage(message, {
      parseMode: "HTML",
      photoUrl: order.screenshotUrl || undefined,
      inlineKeyboard: inlineKeyboard.length > 0 ? inlineKeyboard : undefined,
    });

    return result.success;
  } catch (err) {
    console.error("[Telegram] Error triggering order notification:", err);
    return false;
  }
}
